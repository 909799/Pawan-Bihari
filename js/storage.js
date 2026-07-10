'use strict';

/**
 * LocalStorage management for Ami Polymer Film Formulation Calculator
 * @module storage
 */

/**
 * Save current calculation data to localStorage
 */
function saveData() {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      dieWidth: document.getElementById('dieWidth').value,
      lineSpeed: document.getElementById('lineSpeed').value,
      hours: document.getElementById('hoursInput').value,
      wastage: document.getElementById('wastageInput').value,
      layers: Array.from(document.querySelectorAll('#calcTable tbody tr')).map(r => ({
        ext: sanitizeText(r.querySelector('.ext').value),
        mat: sanitizeText(r.querySelector('.mat').value),
        mic: r.querySelector('.mic').value,
        den: r.querySelector('.den').value
      }))
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    showAlert('✓ Data saved successfully', 'success');
  } catch (e) {
    showAlert('Error saving data: ' + e.message, 'error');
  }
}

/**
 * Load saved calculation data from localStorage
 */
function loadData() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
  
  if (!saved) {
    showAlert('No saved data found', 'warning');
    return;
  }

  // Validate data before parsing
  if (!isValidStorageData(saved)) {
    showAlert('Corrupted data detected. Cannot load.', 'error');
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    return;
  }

  try {
    const data = JSON.parse(saved);
    
    // Validate loaded data structure
    if (!data.dieWidth || !data.lineSpeed || !data.hours || !Array.isArray(data.layers)) {
      throw new Error('Invalid data structure');
    }

    document.getElementById('dieWidth').value = data.dieWidth;
    document.getElementById('lineSpeed').value = data.lineSpeed;
    document.getElementById('hoursInput').value = data.hours;
    document.getElementById('wastageInput').value = data.wastage || 0;
    
    const rows = Array.from(document.querySelectorAll('#calcTable tbody tr'));
    data.layers.forEach((layer, i) => {
      if (rows[i]) {
        rows[i].querySelector('.ext').value = layer.ext || '';
        rows[i].querySelector('.mat').value = layer.mat || '';
        rows[i].querySelector('.mic').value = layer.mic || 0;
        rows[i].querySelector('.den').value = layer.den || 0;
      }
    });
    
    recalculate();
    showAlert('✓ Data loaded successfully', 'success');
  } catch (e) {
    showAlert('Error loading data: ' + e.message, 'error');
  }
}

/**
 * Clear all saved data from localStorage
 */
function clearData() {
  if (confirm('Are you sure you want to clear all saved data?')) {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    showAlert('✓ Data cleared', 'success');
  }
}
