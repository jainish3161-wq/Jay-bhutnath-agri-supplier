/* c:\Users\patel\Downloads\Prototype\app.js */
const API_BASE = window.API_BASE || 'http://localhost:3001/api';

async function apiGet(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API GET Error:', error);
    return null;
  }
}

async function apiPost(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('API POST Error:', error);
    return { success: false, error: error.message };
  }
}

async function apiPut(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('API PUT Error:', error);
    return { success: false, error: error.message };
  }
}

async function apiDelete(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('API DELETE Error:', error);
    return { success: false, error: error.message };
  }
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function showLoading(containerId, message = 'Loading...') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px;">
        <div class="spinner"></div>
        <p style="margin-top: 16px; color: #6b7280; font-size: 14px;" data-i18n="loading.text">${message}</p>
      </div>
    `;
    if (window.applyTranslations) window.applyTranslations();
  }
}

function hideLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
}

function formatPhone(phone) {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{5})(\d{5})$/);
  if (match) {
    return '+91 ' + match[1] + ' ' + match[2];
  }
  return phone;
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `JB-${year}-${random}`;
}

function getAdminToken() {
  return localStorage.getItem('adminToken');
}

function setAdminToken(token) {
  localStorage.setItem('adminToken', token);
}

function clearAdminToken() {
  localStorage.removeItem('adminToken');
}

async function checkAdminAuth() {
  const token = getAdminToken();
  if (!token) {
    window.location.href = 'admin-login.html';
    return false;
  }
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      clearAdminToken();
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function toggleNav() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  const toggleBtn = document.querySelector('.nav-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleNav);
  }
});

async function loadProductsDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="" disabled selected data-i18n="form.product">Select Product</option>';
  
  // Try to load from API
  const products = await apiGet('/products');
  
  const defaultProducts = [
    { id: 'wheat', name: 'Premium Wheat', i18n: 'product.wheat', price: 28 },
    { id: 'groundnut', name: 'Groundnut', i18n: 'product.groundnut', price: 65 },
    { id: 'castor', name: 'Castor Seeds', i18n: 'product.castor', price: 58 },
    { id: 'atta', name: 'Chakki Atta', i18n: 'product.atta', price: 35 },
    { id: 'cattle_feed', name: 'Cattle Feed', i18n: 'product.cattle_feed', price: 15 },
    { id: 'sesame', name: 'Sesame Seeds', i18n: 'product.sesame', price: 120 }
  ];
  
  const data = (products && products.length > 0) ? products : defaultProducts;
  
  data.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    if (p.i18n) option.setAttribute('data-i18n', p.i18n);
    option.setAttribute('data-price', p.price);
    select.appendChild(option);
  });
  
  if (window.applyTranslations) window.applyTranslations();
}
