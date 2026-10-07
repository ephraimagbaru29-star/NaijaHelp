/**
 * NaijaHelp – services.js
 * Handles the Services page (services.html) filters,
 * the Dashboard "My Services" tab, and the "Add Service" form.
 * Depends on app.js being loaded first.
 */

'use strict';

/* ── Services page: category filter dropdown ───────────────── */
function initCategoryFilter() {
  const catFilter = document.getElementById('categoryFilter');
  if (!catFilter) return;

  catFilter.addEventListener('change', () => {
    // Reuse currentCategory from app.js via the global
    window.currentCategory = catFilter.value || 'All';
    applyServicesFilter();
  });
}

/* ── Services page: clear all filters ─────────────────────── */
function initClearFilters() {
  const clearBtn = document.getElementById('clearFilters');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    const searchInput  = document.getElementById('searchInput');
    const catFilter    = document.getElementById('categoryFilter');
    const cityFilter   = document.getElementById('cityFilter');

    if (searchInput) searchInput.value = '';
    if (catFilter)   catFilter.value   = '';
    if (cityFilter)  cityFilter.value  = '';

    // Reset global state (defined in app.js)
    currentKeyword  = '';
    currentCategory = 'All';
    currentCity     = '';

    applyServicesFilter();
  });
}

/* ── Re-run filter against the loaded data ─────────────────── */
function applyServicesFilter() {
  const data     = window._naijaServices || SERVICES;
  const filtered = filterServices(data);
  displayServices(filtered);
}

/* ── Dashboard tabs ────────────────────────────────────────── */
function initDashboardTabs() {
  const tabBtns  = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b  => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // "Add Service" button in welcome bar also switches to the form tab
  const openAddModal = document.getElementById('openAddModal');
  if (openAddModal) {
    openAddModal.addEventListener('click', () => {
      tabBtns.forEach(b  => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      const addBtn  = document.querySelector('[data-tab="addService"]');
      const addPane = document.getElementById('tab-addService');
      if (addBtn)  addBtn.classList.add('active');
      if (addPane) addPane.classList.add('active');
      addPane && addPane.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/* ── Render the current user's own services ────────────────── */
async function loadMyServices() {
  const container = document.getElementById('myServicesList');
  if (!container) return;

  const user  = getCurrentUser();
  const token = getAuthToken();

  if (!user || !token) {
    container.innerHTML = '<p class="empty-msg">Please <a href="login.html">log in</a> to see your services.</p>';
    return;
  }

  container.innerHTML = '<p class="loading-text">Loading your services…</p>';

  // Update stat cards
  try {
    const res = await fetch(`${API_BASE}/services?user=me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderMyServices(data, container);

  } catch (err) {
    // If backend isn't up, show a graceful message
    console.warn('Could not load user services from API:', err.message);
    container.innerHTML = '<p class="empty-msg">Could not load services. Make sure the backend is running.</p>';
  }
}

function renderMyServices(services, container) {
  const statTotal   = document.getElementById('statTotal');
  const statVerified = document.getElementById('statVerified');
  const statPending  = document.getElementById('statPending');

  if (statTotal)    statTotal.textContent   = services.length;
  if (statVerified) statVerified.textContent = services.filter(s => s.is_verified).length;
  if (statPending)  statPending.textContent  = services.filter(s => !s.is_verified).length;

  if (services.length === 0) {
    container.innerHTML = `
      <p class="empty-msg">
        You haven't submitted any services yet.
        <a href="#tab-addService" id="goAddService">Add your first service →</a>
      </p>`;
    return;
  }

  container.innerHTML = '';
  const frag = document.createDocumentFragment();

  services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'my-service-card';
    card.innerHTML = `
      <h3>${escapeHtml(service.name)}</h3>
      <p>${escapeHtml(service.category)} · ${escapeHtml(service.city)}${service.state ? ', ' + escapeHtml(service.state) : ''}</p>
      <p>${service.is_verified
        ? '<span style="color:var(--green);font-weight:600;">✔ Verified</span>'
        : '<span style="color:var(--text-muted);">⏳ Pending verification</span>'}</p>
      <div class="my-card-actions">
        <button class="btn btn-outline btn-sm edit-btn" data-id="${service.id}">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn" data-id="${service.id}">Delete</button>
      </div>
    `;
    frag.appendChild(card);
  });

  container.appendChild(frag);

  // Wire up delete buttons
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteService(btn.dataset.id));
  });
}

/* ── Delete a service ──────────────────────────────────────── */
async function deleteService(id) {
  if (!confirm('Are you sure you want to delete this service?')) return;

  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showAlert('dashAlert', 'Service deleted successfully.', 'success');
    loadMyServices();
  } catch (err) {
    showAlert('dashAlert', `Failed to delete service: ${err.message}`, 'error');
  }
}

/* ── Add Service form submission ───────────────────────────── */
function initAddServiceForm() {
  const form = document.getElementById('addServiceForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');

    const name     = document.getElementById('svcName').value.trim();
    const category = document.getElementById('svcCategory').value;
    const city     = document.getElementById('svcCity').value.trim();

    let hasError = false;

    if (!name) {
      document.getElementById('svcNameError').textContent = 'Service name is required.';
      hasError = true;
    }
    if (!category) {
      document.getElementById('svcCategoryError').textContent = 'Please select a category.';
      hasError = true;
    }
    if (!city) {
      document.getElementById('svcCityError').textContent = 'City is required.';
      hasError = true;
    }
    if (hasError) return;

    const payload = {
      name,
      category,
      description: document.getElementById('svcDescription').value.trim(),
      phone:       document.getElementById('svcPhone').value.trim(),
      email:       document.getElementById('svcEmail').value.trim(),
      address:     document.getElementById('svcAddress').value.trim(),
      city,
      state:       document.getElementById('svcState').value,
    };

    const addBtn     = document.getElementById('addServiceBtn');
    const btnText    = document.getElementById('addServiceBtnText');
    const btnSpinner = document.getElementById('addServiceSpinner');

    addBtn.disabled       = true;
    btnText.textContent   = 'Submitting…';
    btnSpinner.style.display = '';

    const token = getAuthToken();
    if (!token) {
      showAlert('dashAlert', 'You must be logged in to add a service.', 'error');
      addBtn.disabled       = false;
      btnText.textContent   = 'Submit Service';
      btnSpinner.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/services`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      showAlert('dashAlert', 'Service submitted successfully! It will be reviewed before publishing.', 'success');
      form.reset();

      // Switch back to My Services tab and reload
      const myTab  = document.querySelector('[data-tab="myServices"]');
      const myPane = document.getElementById('tab-myServices');
      document.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
      if (myTab)  myTab.classList.add('active');
      if (myPane) myPane.classList.add('active');
      loadMyServices();

    } catch (err) {
      showAlert('dashAlert', `Failed to submit service: ${err.message}`, 'error');
    } finally {
      addBtn.disabled       = false;
      btnText.textContent   = 'Submit Service';
      btnSpinner.style.display = 'none';
    }
  });
}

/* ── Dashboard: populate user info ────────────────────────── */
function initDashboardUserInfo() {
  const user        = getCurrentUser();
  const nameEl      = document.getElementById('dashUserName');
  const emailEl     = document.getElementById('dashUserEmail');
  const dashSection = document.querySelector('.dashboard');

  if (!dashSection) return;

  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return;
  }

  if (nameEl)  nameEl.textContent  = user.full_name || user.email || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
}

/* ── Init on DOMContentLoaded ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Services page
  initCategoryFilter();
  initClearFilters();

  // Dashboard
  initDashboardUserInfo();
  initDashboardTabs();
  loadMyServices();
  initAddServiceForm();
});
