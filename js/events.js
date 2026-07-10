'use strict';

/**
 * Event handlers for Ami Polymer Film Formulation Calculator
 * @module events
 */

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveData);

  // Load button
  document.getElementById('loadBtn').addEventListener('click', loadData);

  // Export PDF button
  document.getElementById('exportPdf').addEventListener('click', exportPDF);

  // Input fields - debounced recalculation
  const debouncedRecalc = debounce(recalculate, CONFIG.DEBOUNCE_DELAY);
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', debouncedRecalc);
    input.addEventListener('change', recalculate);
  });
}

/**
 * Initialize on page load
 */
function initialize() {
  // Add accessibility attributes
  document.getElementById('pwOverlay').setAttribute('role', 'dialog');
  document.getElementById('pwOverlay').setAttribute('aria-label', 'Password unlock dialog');
  document.getElementById('pwOverlay').setAttribute('aria-modal', 'true');

  // Initialize event listeners
  initializeEventListeners();

  // Initial calculation
  recalculate();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
