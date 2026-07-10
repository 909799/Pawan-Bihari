'use strict';

/**
 * Password protection with PBKDF2 hashing
 * @module password
 */

(function() {
  let attempts = 0;
  let lockedUntil = 0;

  /**
   * Convert hex string to Uint8Array
   * @param {string} hex - Hex string
   * @returns {Uint8Array} Byte array
   */
  function hexToUint8(hex) {
    const a = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2)
      a[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return a;
  }

  /**
   * Convert Uint8Array to hex string
   * @param {Uint8Array} buf - Byte array
   * @returns {string} Hex string
   */
  function uint8ToHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Verify password using PBKDF2
   * @param {string} password - Password to verify
   * @returns {Promise<string>} Derived key as hex string
   */
  async function pbkdf2Verify(password) {
    const enc = new TextEncoder();
    const keyMat = await crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: hexToUint8(PASSWORD_CONFIG.SALT_HEX),
        iterations: PASSWORD_CONFIG.ITERATIONS,
        hash: "SHA-256"
      },
      keyMat,
      256
    );
    return uint8ToHex(bits);
  }

  /**
   * Check password and unlock if correct
   */
  async function checkPassword() {
    const now = Date.now();
    if (now < lockedUntil) {
      const secs = Math.ceil((lockedUntil - now) / 1000);
      document.getElementById("pwErr").textContent = `⏳ Too many attempts. Wait ${secs}s`;
      return;
    }

    const password = document.getElementById("pwInput").value;
    if (!password) return;

    document.getElementById("pwBtn").disabled = true;
    document.getElementById("pwLoading").style.display = "block";
    document.getElementById("pwErr").textContent = "";

    try {
      const derived = await pbkdf2Verify(password);

      document.getElementById("pwBtn").disabled = false;
      document.getElementById("pwLoading").style.display = "none";

      if (derived === PASSWORD_CONFIG.DERIVED_HEX) {
        document.getElementById("pwOverlay").style.display = "none";
        attempts = 0;
      } else {
        handleWrongPassword();
      }
    } catch (e) {
      document.getElementById("pwBtn").disabled = false;
      document.getElementById("pwLoading").style.display = "none";
      document.getElementById("pwErr").textContent = "Error verifying password";
    }
  }

  /**
   * Handle wrong password attempt
   * @private
   */
  function handleWrongPassword() {
    attempts++;
    const inp = document.getElementById("pwInput");
    inp.classList.add("error");
    inp.value = "";
    setTimeout(() => inp.classList.remove("error"), 400);

    if (attempts % 3 === 0) {
      const lockDelays = PASSWORD_CONFIG.LOCK_DELAYS;
      const delay = attempts === 3 ? lockDelays.first : attempts === 6 ? lockDelays.second : lockDelays.third;
      lockedUntil = Date.now() + delay;
      document.getElementById("pwErr").textContent = `❌ Wrong password! Locked for ${Math.ceil(delay / 1000)}s`;
      document.getElementById("attemptWarn").textContent = `⚠️ ${attempts} wrong attempts`;
    } else {
      document.getElementById("pwErr").textContent = "❌ Wrong password! Try again.";
      document.getElementById("attemptWarn").textContent = attempts > 1 ? `⚠️ ${attempts} wrong attempts` : "";
    }
  }

  // Event listeners
  document.getElementById("pwBtn").addEventListener("click", checkPassword);
  document.getElementById("pwInput").addEventListener("keydown", e => {
    if (e.key === "Enter") checkPassword();
  });
})();
