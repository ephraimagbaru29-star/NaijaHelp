/**
 * NaijaHelp – app.js
 * Core module: sample data, card rendering, search/filter,
 * navigation state, hamburger menu, and shared utilities.
 * Loaded on every page.
 */

'use strict';

/* ── API base URL ──────────────────────────────────────────────
   Points to the live backend on Vercel.
   Replace REPLACE_WITH_YOUR_BACKEND_URL with your actual
   Vercel backend URL, e.g. https://naijahelp-api.vercel.app
   ─────────────────────────────────────────────────────────── */
const API_BASE = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
)
  ? 'http://localhost:3000/api'           // local dev
  : 'https://naija-help.vercel.app/api'; // production

/* ── Category icon map ─────────────────────────────────────── */
const CATEGORY_ICONS = {
  'Hospital':     '🏥',
  'Pharmacy':     '💊',
  'Police':       '👮',
  'Fire Station': '🚒',
  'Mechanic':     '🔧',
  'Electrician':  '⚡',
  'Plumber':      '🪠',
  'default':      '📍',
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
}

/* ── Sample service data (≥10 entries as required) ─────────── */
const SERVICES = [
  {
    id: 1,
    name: 'Jalingo Specialist Hospital',
    category: 'Hospital',
    description: 'A government specialist hospital serving Taraba State with emergency and outpatient care.',
    phone: '08000000001',
    email: 'jalingo.hospital@example.com',
    address: '12 Hospital Road',
    city: 'Jalingo',
    state: 'Taraba',
    is_verified: true,
  },
  {
    id: 2,
    name: 'HealthPlus Pharmacy Jalingo',
    category: 'Pharmacy',
    description: 'Licensed pharmacy stocking prescription and OTC drugs, open 7 days a week.',
    phone: '08000000002',
    email: 'healthplus.jalingo@example.com',
    address: '5 Market Street',
    city: 'Jalingo',
    state: 'Taraba',
    is_verified: true,
  },
  {
    id: 3,
    name: 'Jalingo Central Police Station',
    category: 'Police',
    description: 'Central division covering Jalingo metropolis. Emergency response available 24/7.',
    phone: '08000000003',
    email: '',
    address: 'Police Barracks, Hammaruwa Way',
    city: 'Jalingo',
    state: 'Taraba',
    is_verified: true,
  },
  {
    id: 4,
    name: 'ABC Auto Repairs',
    category: 'Mechanic',
    description: 'General motor repairs, panel beating, welding and tyre services at fair prices.',
    phone: '08000000004',
    email: 'abc.repairs@example.com',
    address: '22 Bypass Road',
    city: 'Jalingo',
    state: 'Taraba',
    is_verified: false,
  },
  {
    id: 5,
    name: 'BrightSpark Electricians',
    category: 'Electrician',
    description: 'Domestic and commercial electrical installations, repairs and generator servicing.',
    phone: '08000000005',
    email: 'brightspark@example.com',
    address: '8 Garba Daho Road',
    city: 'Jalingo',
    state: 'Taraba',
    is_verified: false,
  },
  {
    id: 6,
    name: 'Lagos Island General Hospital',
    category: 'Hospital',
    description: 'One of Lagos State\'s major public hospitals providing specialist and emergency care.',
    phone: '08000000006',
    email: 'ligh@example.com',
    address: 'Broad Street, Lagos Island',
    city: 'Lagos',
    state: 'Lagos',
    is_verified: true,
  },
  {
    id: 7,
    name: 'MedPlus Pharmacy Victoria Island',
    category: 'Pharmacy',
    description: 'Full-service retail pharmacy with a wide range of prescription and wellness products.',
    phone: '08000000007',
    email: 'medplus.vi@example.com',
    address: '14 Akin Adesola Street',
    city: 'Lagos',
    state: 'Lagos',
    is_verified: true,
  },
  {
    id: 8,
    name: 'Abuja Municipal Fire Station',
    category: 'Fire Station',
    description: 'Federal Capital Territory fire brigade. Call for fire emergencies in Abuja.',
    phone: '08032000011',
    email: '',
    address: 'Area 1, Garki',
    city: 'Abuja',
    state: 'FCT',
    is_verified: true,
  },
  {
    id: 9,
    name: 'ProFix Plumbing Services',
    category: 'Plumber',
    description: 'Pipe installation, leak repairs, borehole and water tank services across Port Harcourt.',
    phone: '08000000009',
    email: 'profix.ph@example.com',
    address: '3 Trans Amadi Road',
    city: 'Port Harcourt',
    state: 'Rivers',
    is_verified: false,
  },
  {
    id: 10,
    name: 'Kano Central Police Command',
    category: 'Police',
    description: 'Kano State police headquarters. Emergency line active around the clock.',
    phone: '08000000010',
    email: '',
    address: 'Bompai Road',
    city: 'Kano',
    state: 'Kano',
    is_verified: true,
  },
  {
    id: 11,
    name: 'Enugu State University Teaching Hospital',
    category: 'Hospital',
    description: 'ESUTH provides tertiary health care, training and research for Enugu State.',
    phone: '08000000011',
    email: 'esuth@example.com',
    address: 'Park Lane, GRA',
    city: 'Enugu',
    state: 'Enugu',
    is_verified: true,
  },
  {
    id: 12,
    name: 'QuickWrench Motors Ibadan',
    category: 'Mechanic',
    description: 'Toyota and Honda specialists. Engine diagnostics, A/C servicing and roadside recovery.',
    phone: '08000000012',
    email: 'quickwrench@example.com',
    address: '7 Iwo Road',
    city: 'Ibadan',
    state: 'Oyo',
    is_verified: false,
  },
];

/* ── Current filter state ──────────────────────────────────── */
let currentCategory = 'All';
let currentKeyword  = '';
let currentCity     = '';

/* ── Build a service card element ─────────────────────────── */
function buildServiceCard(service) {
  const icon     = getCategoryIcon(service.category);
  const phone    = service.phone ? service.phone : null;
  const verified = service.is_verified
    ? '<span class="card-verified">✔ Verified</span>'
    : '';
  const desc = service.description
    ? `<p class="card-description">${escapeHtml(service.description)}</p>`
    : '';

  const article = document.createElement('article');
  article.className = 'service-card';
  article.setAttribute('role', 'listitem');
  article.setAttribute('data-id', service.id);

  article.innerHTML = `
    <div class="card-top">
      <span class="card-icon" aria-hidden="true">${icon}</span>
      <div class="card-title-group">
        <h3 title="${escapeHtml(service.name)}">${escapeHtml(service.name)}</h3>
        <span class="card-category">${escapeHtml(service.category)}</span>
      </div>
    </div>
    <div class="card-body">
      <p class="card-meta">
        <span class="icon" aria-hidden="true">📍</span>
        ${escapeHtml(service.city)}${service.state ? ', ' + escapeHtml(service.state) : ''}
      </p>
      ${phone ? `<p class="card-meta"><span class="icon" aria-hidden="true">📞</span>${escapeHtml(phone)}</p>` : ''}
      ${desc}
      ${verified}
    </div>
    <div class="card-footer">
      ${phone
        ? `<a href="tel:${escapeHtml(phone)}" class="btn btn-primary">Call Now</a>`
        : '<span class="btn btn-primary" style="opacity:.4;cursor:default;">No phone</span>'
      }
      <a href="services.html?id=${service.id}" class="btn btn-outline">Details</a>
    </div>
  `;

  return article;
}

/* ── Render cards into a container ────────────────────────── */
function displayServices(data, containerId = 'serviceList') {
  const container = document.getElementById(containerId);
  const emptyMsg  = document.getElementById('emptyMessage');
  const countEl   = document.getElementById('resultsCount');

  if (!container) return;

  container.innerHTML = '';

  if (data.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';
    const frag = document.createDocumentFragment();
    data.forEach(service => frag.appendChild(buildServiceCard(service)));
    container.appendChild(frag);
  }

  if (countEl) {
    countEl.textContent = `${data.length} service${data.length !== 1 ? 's' : ''} found`;
  }
}

/* ── Filter logic ──────────────────────────────────────────── */
function filterServices(services) {
  return services.filter(s => {
    const matchCategory = currentCategory === 'All' || s.category === currentCategory;
    const keyword       = currentKeyword.toLowerCase();
    const matchKeyword  = !keyword ||
      s.name.toLowerCase().includes(keyword) ||
      s.category.toLowerCase().includes(keyword) ||
      s.city.toLowerCase().includes(keyword) ||
      (s.description && s.description.toLowerCase().includes(keyword));
    const matchCity = !currentCity || s.city === currentCity;

    return matchCategory && matchKeyword && matchCity;
  });
}

function applyFilters() {
  const filtered = filterServices(SERVICES);
  displayServices(filtered);
}

/* ── Wire up search input ──────────────────────────────────── */
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn   = document.getElementById('searchBtn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentKeyword = searchInput.value.trim();
      applyFilters();
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (searchInput) currentKeyword = searchInput.value.trim();
      applyFilters();
    });
  }
}

/* ── Wire up category buttons ──────────────────────────────── */
function initCategories() {
  const catButtons = document.querySelectorAll('.cat-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category || 'All';
      applyFilters();
    });
  });
}

/* ── Wire up city filter dropdown ──────────────────────────── */
function initCityFilter() {
  const cityFilter = document.getElementById('cityFilter');
  if (cityFilter) {
    cityFilter.addEventListener('change', () => {
      currentCity = cityFilter.value;
      applyFilters();
    });
  }
}

/* ── Hamburger / mobile nav ────────────────────────────────── */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.setAttribute(
        'aria-expanded',
        mobileNav.classList.contains('open').toString()
      );
    });
    // Close when a link is clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }
}

/* ── Nav auth state ────────────────────────────────────────── */
function updateNavAuthState() {
  const user = getCurrentUser();

  const navLogin     = document.getElementById('navLogin');
  const navRegister  = document.getElementById('navRegister');
  const navDashboard = document.getElementById('navDashboard');
  const navLogout    = document.getElementById('navLogout');

  if (user) {
    if (navLogin)     navLogin.style.display     = 'none';
    if (navRegister)  navRegister.style.display  = 'none';
    if (navDashboard) navDashboard.style.display = '';
    if (navLogout)    navLogout.style.display     = '';
  } else {
    if (navLogin)     navLogin.style.display     = '';
    if (navRegister)  navRegister.style.display  = '';
    if (navDashboard) navDashboard.style.display = 'none';
    if (navLogout)    navLogout.style.display     = 'none';
  }

  if (navLogout) {
    navLogout.addEventListener('click', () => {
      logoutUser();
      window.location.href = 'index.html';
    });
  }
}

/* ── Auth helpers (used by auth.js too) ────────────────────── */
function getCurrentUser() {
  try {
    const stored = localStorage.getItem('naijahelp_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getAuthToken() {
  return localStorage.getItem('naijahelp_token') || null;
}

function saveUser(user, token) {
  localStorage.setItem('naijahelp_user', JSON.stringify(user));
  localStorage.setItem('naijahelp_token', token);
}

function logoutUser() {
  localStorage.removeItem('naijahelp_user');
  localStorage.removeItem('naijahelp_token');
}

/* ── HTML escape utility ───────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Show an alert element ─────────────────────────────────── */
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type}`;
  el.style.display = 'block';
  // Auto-hide success after 4 s
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

/* ── Fetch services from backend (replaces local array) ────── */
async function fetchServicesFromAPI() {
  const spinner   = document.getElementById('loadingSpinner');
  const container = document.getElementById('serviceList');

  if (spinner) spinner.style.display = 'flex';

  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res  = await fetch(`${API_BASE}/services`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend unavailable, using local data.', err.message);
    return null; // caller falls back to SERVICES
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

/* ── Init on every page ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  initHamburger();
  updateNavAuthState();

  // Only run service display logic on pages that have #serviceList
  if (!document.getElementById('serviceList')) return;

  // Try backend first; fall back to sample data
  const apiData = await fetchServicesFromAPI();
  const data    = apiData !== null ? apiData : SERVICES;

  // Expose to other scripts (services.js etc.)
  window._naijaServices = data;

  displayServices(filterServices(data));
  initSearch();
  initCategories();
  initCityFilter();

  // Show "Add Service" CTA once data is loaded
  const cta = document.getElementById('addServiceCta');
  if (cta) cta.style.display = 'block';
});
