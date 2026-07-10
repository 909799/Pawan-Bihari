'use strict';

/**
 * Calculation engine for Ami Polymer Film Formulation
 * @module calculator
 */

/** @type {Object} Current calculation state */
let calculationState = {
  layers: [],
  totalWeight: 0,
  totalThr: 0,
  wastage: 0,
  isValid: true,
  errors: []
};

/**
 * Calculate throughput (kg/hr) for a single layer
 * Formula: width(m) × thickness(m) × speed(m/min) × 60(min/hr) × density(kg/m³)
 * 
 * @param {number} widthM - Width in meters
 * @param {number} thicknessMicrons - Thickness in microns
 * @param {number} speedMperMin - Speed in m/min
 * @param {number} densityGcm3 - Density in g/cm³
 * @returns {number} Throughput in kg/hr
 */
function calculateLayerThroughput(widthM, thicknessMicrons, speedMperMin, densityGcm3) {
  const thicknessM = thicknessMicrons * CONFIG.MICRON_TO_METER;
  const densityKgM3 = densityGcm3 * CONFIG.G_CM3_TO_KG_M3;
  return widthM * thicknessM * speedMperMin * CONFIG.MIN_TO_HOUR * densityKgM3;
}

/**
 * Calculate RPM from throughput, density, and extruder type
 * @param {number} throughput - Throughput in kg/hr
 * @param {number} density - Density in g/cm³
 * @param {string|number} extruderType - Extruder type identifier
 * @returns {number} RPM value
 */
function calculateRPM(throughput, density, extruderType) {
  if (density <= 0) return 0;
  const divisor = CONFIG.RPM_DIVISORS[extruderType] || CONFIG.RPM_DIVISORS[45];
  return throughput / divisor / density;
}

/**
 * Calculate film length from total weight, die width, thickness, and density
 * Formula: length = netWeight / (width × thickness × density)
 * 
 * @param {number} netWeight - Net weight in kg
 * @param {number} widthM - Width in meters
 * @param {number} totalThicknessMicrons - Total thickness in microns
 * @param {number} avgDensityGcm3 - Average density in g/cm³
 * @returns {number} Film length in meters
 */
function calculateFilmLength(netWeight, widthM, totalThicknessMicrons, avgDensityGcm3) {
  if (!isSafeNumber(netWeight) || widthM <= 0 || totalThicknessMicrons <= 0 || avgDensityGcm3 <= 0) {
    return 0;
  }
  const thicknessM = totalThicknessMicrons * CONFIG.MICRON_TO_METER;
  const densityKgM3 = avgDensityGcm3 * CONFIG.G_CM3_TO_KG_M3;
  return netWeight / (widthM * thicknessM * densityKgM3);
}

/**
 * Main recalculation engine - processes all inputs and updates UI
 */
function recalculate() {
  calculationState.errors = [];

  // Read inputs
  const dieWidth = safeParseFloat(document.getElementById('dieWidth').value);
  const lineSpeed = safeParseFloat(document.getElementById('lineSpeed').value);
  const hours = safeParseFloat(document.getElementById('hoursInput').value);
  const wastage = safeParseFloat(document.getElementById('wastageInput').value);

  // Validate main inputs
  if (!validateInput(dieWidth, CONFIG.BOUNDS.dieWidth)) {
    calculationState.errors.push(`Die Width must be between ${CONFIG.BOUNDS.dieWidth.min}-${CONFIG.BOUNDS.dieWidth.max} mm`);
  }
  if (!validateInput(lineSpeed, CONFIG.BOUNDS.lineSpeed)) {
    calculationState.errors.push(`Line Speed must be between ${CONFIG.BOUNDS.lineSpeed.min}-${CONFIG.BOUNDS.lineSpeed.max} m/min`);
  }
  if (!validateInput(hours, CONFIG.BOUNDS.hours)) {
    calculationState.errors.push(`Hours must be between ${CONFIG.BOUNDS.hours.min}-${CONFIG.BOUNDS.hours.max}`);
  }
  if (wastage < 0) {
    calculationState.errors.push('Wastage cannot be negative');
  }

  calculationState.isValid = calculationState.errors.length === 0;

  // Parse layer data
  const widthM = dieWidth * CONFIG.MM_TO_METER;
  const rows = Array.from(document.querySelectorAll('#calcTable tbody tr'));

  const layers = rows.map(r => {
    const mic = safeParseFloat(r.querySelector('.mic').value);
    const den = safeParseFloat(r.querySelector('.den').value);

    // Validate layer inputs
    if (!validateInput(mic, CONFIG.BOUNDS.thickness)) {
      calculationState.errors.push(`Thickness must be 0-${CONFIG.BOUNDS.thickness.max} µ`);
    }
    if (!validateInput(den, CONFIG.BOUNDS.density)) {
      calculationState.errors.push(`Density must be ${CONFIG.BOUNDS.density.min}-${CONFIG.BOUNDS.density.max} g/cm³`);
    }

    return {
      name: r.querySelector('.ext').value,
      material: r.querySelector('.mat').value,
      microns: mic,
      density: den,
      extruder: r.getAttribute('data-extruder'),
      row: r
    };
  });

  // Calculate aggregates
  const totalMicrons = layers.reduce((sum, l) => sum + l.microns, 0);
  const sumWeighted = layers.reduce((sum, l) => sum + l.density * l.microns, 0);
  const avgDensity = totalMicrons > 0 ? sumWeighted / totalMicrons : 0;

  // Calculate per-layer metrics and totals
  let totalThroughput = 0;
  layers.forEach(layer => {
    // Layer percentage
    const percentage = totalMicrons > 0 ? (layer.microns / totalMicrons * 100) : 0;
    layer.row.querySelector('.pct').textContent = percentage.toFixed(CONFIG.DECIMAL_PLACES.percentage);

    // Throughput (kg/hr)
    const thr = calculateLayerThroughput(widthM, layer.microns, lineSpeed, layer.density);
    layer.throughput = thr;
    layer.row.querySelector('.thr').textContent = thr.toFixed(CONFIG.DECIMAL_PLACES.throughput);
    totalThroughput += thr;

    // RPM
    const rpm = calculateRPM(thr, layer.density, layer.extruder);
    layer.rpm = rpm;
    layer.row.querySelector('.rpm').textContent = rpm.toFixed(CONFIG.DECIMAL_PLACES.rpm);
  });

  // Update totals row
  document.getElementById('totalMic').textContent = totalMicrons.toFixed(CONFIG.DECIMAL_PLACES.thickness);
  document.getElementById('avgDen').textContent = avgDensity.toFixed(CONFIG.DECIMAL_PLACES.density);
  document.getElementById('sumThr').textContent = totalThroughput.toFixed(CONFIG.DECIMAL_PLACES.throughput);

  // Calculate total weight and length
  const totalWeight = totalThroughput * hours;
  document.getElementById('totalWeight').textContent = totalWeight.toFixed(CONFIG.DECIMAL_PLACES.weight);

  const wastagePct = totalWeight > 0 ? (wastage / totalWeight * 100) : 0;
  document.getElementById('wastagePct').textContent = wastagePct.toFixed(CONFIG.DECIMAL_PLACES.percentage) + '%';

  const netWeight = totalWeight - wastage;
  const filmLength = calculateFilmLength(netWeight, widthM, totalMicrons, avgDensity);
  document.getElementById('totalLength').textContent = filmLength.toFixed(CONFIG.DECIMAL_PLACES.length);

  // Calculate per-layer consumption and waste
  const totalConsume = layers.reduce((sum, l) => sum + l.throughput * hours, 0);
  layers.forEach(layer => {
    layer.consumeKg = layer.throughput * hours;
    layer.scrapKg = (totalConsume > 0 && wastage > 0)
      ? (layer.consumeKg / totalConsume) * wastage
      : 0;
    layer.netKg = layer.consumeKg - layer.scrapKg;
  });

  // Update state
  calculationState = {
    layers,
    totalWeight,
    totalThroughput,
    wastage,
    hours,
    dieWidth,
    lineSpeed,
    filmLength,
    totalMicrons,
    avgDensity,
    isValid: calculationState.errors.length === 0,
    errors: calculationState.errors
  };

  if (calculationState.errors.length > 0) {
    showAlert('⚠️ ' + calculationState.errors[0], 'warning');
  }
}
