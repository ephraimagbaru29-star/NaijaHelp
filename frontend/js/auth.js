/**
 * NaijaHelp – auth.js
 * Handles login and registration forms.
 * Sends credentials to the Express backend and stores the
 * returned JWT + user object in localStorage via helpers in app.js.
 * Depends on app.js being loaded first.
 */

'use strict';

/* ── Toggle password visibility ────────────────────────────── */
function initPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input    = document.getElementById(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        btn.textContent = '👁';
        btn.setAttribute('aria-label', 'Show password');
      }
    });
  });
}

/* ── Validate email format ──────────────────────────────────── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Validate Nigerian phone (optional field) ───────────────── */
function isValidNigerianPhone(phone) {
  if (!phone) return true; // optional
  return /^(0[7-9][0-1]\d{8}|0[7-9][0-9]\d{7}|\+234[7-9][0-1]\d{8})$/.test(phone);
}

/* ── Show/clear inline field errors ────────────────────────── */
function setFieldError(fieldId, message) {
  const el = document.getElementById(`${fieldId}Error`);
  if (el) el.textContent = message;
}

function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
  });
}

/* ── Set button loading state ───────────────────────────────── */
function setButtonLoading(btnId, textId, spinnerId, loading, defaultText) {
  const btn     = document.getElementById(btnId);
  const btnText = document.getElementById(textId);
  const spinner = document.getElementById(spinnerId);

  if (!btn) return;
  btn.disabled = loading;
  if (btnText) btnText.textContent = loading ? 'Please wait…' : defaultText;
  if (spinner) spinner.style.display = loading ? '' : 'none';
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════════════════ */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  // If already logged in, redirect to dashboard
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Client-side validation
    let hasError = false;

    if (!email) {
      setFieldError('email', 'Email address is required.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      setFieldError('password', 'Password is required.');
      hasError = true;
    }

    if (hasError) return;

    setButtonLoading('loginBtn', 'loginBtnText', 'loginSpinner', true, 'Sign In');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Login failed. Please check your credentials.');
      }

      // Save user session
      saveUser(json.user, json.token);
      showAlert('authAlert', 'Login successful! Redirecting…', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (err) {
      showAlert('authAlert', err.message, 'error');
    } finally {
      setButtonLoading('loginBtn', 'loginBtnText', 'loginSpinner', false, 'Sign In');
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   REGISTER
   ═══════════════════════════════════════════════════════════════ */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  // If already logged in, redirect
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const fullName       = document.getElementById('fullName').value.trim();
    const email          = document.getElementById('email').value.trim();
    const phone          = document.getElementById('phone').value.trim();
    const password       = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    let hasError = false;

    if (!fullName || fullName.length < 2) {
      setFieldError('fullName', 'Please enter your full name (at least 2 characters).');
      hasError = true;
    }

    if (!email) {
      setFieldError('email', 'Email address is required.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'Please enter a valid email address.');
      hasError = true;
    }

    if (phone && !isValidNigerianPhone(phone)) {
      setFieldError('phone', 'Please enter a valid Nigerian phone number (e.g. 08012345678).');
      hasError = true;
    }

    if (!password) {
      setFieldError('password', 'Password is required.');
      hasError = true;
    } else if (password.length < 8) {
      setFieldError('password', 'Password must be at least 8 characters.');
      hasError = true;
    }

    if (!confirmPassword) {
      setFieldError('confirmPassword', 'Please confirm your password.');
      hasError = true;
    } else if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setButtonLoading('registerBtn', 'registerBtnText', 'registerSpinner', true, 'Create Account');

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ full_name: fullName, email, phone, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Registration failed. Please try again.');
      }

      // Save user session and redirect
      saveUser(json.user, json.token);
      showAlert('authAlert', 'Account created successfully! Redirecting…', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (err) {
      showAlert('authAlert', err.message, 'error');
    } finally {
      setButtonLoading('registerBtn', 'registerBtnText', 'registerSpinner', false, 'Create Account');
    }
  });
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
});
