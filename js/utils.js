'use strict';

/**
 * Utility functions for Ami Polymer Film Formulation Calculator
 * @module utils
 */

/**
 * Display alert message to user
 * @param {string} message - Alert message text
 * @param {string} [type='success'] - Alert type: 'success', 'error', 'warning'
 */
function showAlert(message, type = 'success') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  
  alertBox.textContent = message;
  alertBox.className = `alert show ${type}`;
  setTimeout(() => alertBox.classList.remove('show'), 4000);
}

/**
 * Validate numeric input against bounds
 * @param {number} value - Value to validate
 * @param {Object} bounds - Bounds object with min and max properties
 * @returns {boolean} True if value is within bounds and is a valid number
 */
function validateInput(value, bounds) {
  return !isNaN(value) && 
         isFinite(value) && 
         value >= bounds.min && 
         value <= bounds.max;
}

/**
 * Safely parse float with fallback to 0
 * @param {*} value - Value to parse
 * @returns {number} Parsed float or 0 if invalid
 */
function safeParseFloat(value) {
  const parsed = parseFloat(value) || 0;
  return isFinite(parsed) ? parsed : 0;
}

/**
 * Check if a number is safe (not NaN, not Infinity)
 * @param {number} n - Number to check
 * @returns {boolean} True if number is safe
 */
function isSafeNumber(n) {
  return typeof n === 'number' && isFinite(n) && !isNaN(n);
}

/**
 * Validate localStorage data structure
 * @param {*} data - Data to validate
 * @returns {boolean} True if data is valid JSON-like object
 */
function isValidStorageData(data) {
  if (!data || typeof data !== 'string') return false;
  if (!data.startsWith('{')) return false;
  try {
    JSON.parse(data);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Debounce function to limit execution frequency
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = CONFIG.DEBOUNCE_DELAY) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Sanitize text input to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
