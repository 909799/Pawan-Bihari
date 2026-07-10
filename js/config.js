'use strict';

/**
 * Configuration and Constants for Ami Polymer Film Formulation Calculator
 * @module config
 */

const CONFIG = {
  // Unit conversion factors
  MICRON_TO_METER: 1e-6,
  MM_TO_METER: 1 / 1000,
  G_CM3_TO_KG_M3: 1000,
  MIN_TO_HOUR: 60,

  // RPM calculation divisors per extruder type
  RPM_DIVISORS: {
    90: 6.9,      // Large extruder
    55: 2,        // Medium extruder
    45: 2         // Small extruder
  },

  // Input validation bounds
  BOUNDS: {
    dieWidth: { min: 10, max: 5000 },      // mm
    lineSpeed: { min: 1, max: 500 },       // m/min
    hours: { min: 0.1, max: 168 },         // hours per week max
    wastage: { min: 0, max: 100000 },      // kg
    thickness: { min: 0, max: 500 },       // microns
    density: { min: 0.5, max: 2 }          // g/cm³
  },

  // Display precision
  DECIMAL_PLACES: {
    percentage: 2,
    thickness: 1,
    throughput: 3,
    rpm: 1,
    weight: 2,
    length: 2,
    density: 4
  },

  // Storage key
  STORAGE_KEY: 'filmFormulationData',

  // Debounce delay (ms)
  DEBOUNCE_DELAY: 300
};

// Password configuration
const PASSWORD_CONFIG = {
  SALT_HEX: "8b63658f475aa21b584248c24584195cae74c092abf3050d371e5c31b12e2ace",
  ITERATIONS: 310000,
  DERIVED_HEX: "404e7c16a39442c58a97c383971d0a9519b7526b0e1dad5fd0d919ef7d566ce7",
  LOCK_DELAYS: {
    first: 5000,    // 5 seconds
    second: 30000,  // 30 seconds
    third: 300000   // 5 minutes
  }
};
