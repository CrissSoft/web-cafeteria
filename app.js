/**
 * Cafetería Y&V - Lógica de la página y datos para automatización con Selenium
 */

(function () {
  'use strict';

  // --- Estado del carrito (se expone para Selenium) ---
  let cart = [];
  const CART_STORAGE_KEY = 'cafeteria_yv_cart';

  // --- Elementos del DOM (con data-testid para Selenium) ---
  const selectors = {
    cartBadge: '[data-testid="cart-badge"]',
    cartBtn: '[data-testid="cart-btn"]',
    reportBtn: '[data-testid="report-btn"]',
    supportBtn: '[data-testid="support-btn"]',
    cartPanel: '[data-testid="cart-panel"]',
    cartList: '[data-testid="cart-list"]',
    cartTotal: '[data-testid="cart-total"]',
    cartDataExport: '#cart-data-export',
    dashboardContent: '[data-testid="report-content"]',
    modalOverlay: '[data-testid="modal-overlay"]',
  };

  // Cargar carrito desde localStorage al iniciar
  function loadCart() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) cart = JSON.parse(saved);
    } catch (e) {
      cart = [];
    }
    renderCartUI();
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
    updateCartDataExport();
  }

  /** Actualiza el elemento oculto que Selenium puede leer (JSON del carrito) */
  function updateCartDataExport() {
    const el = document.getElementById('cart-data-export');
    if (el) el.textContent = JSON.stringify(getCartForExport());
  }

  /** Objeto listo para automatización: productos en carrito + total */
  function getCartForExport() {
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    return {
      items: cart.map(({ name, price, quantity, subtotal }) => ({
        name,
        price,
        quantity,
        subtotal,
      })),
      total,
      count: cart.reduce((n, i) => n + i.quantity, 0),
    };
  }

  /** Expuesto globalmente para Selenium: driver.execute_script("return window.getCartDataForAutomation();") */
  window.getCartDataForAutomation = function () {
    return JSON.stringify(getCartForExport());
  };

  /** Devuelve el menú completo de la página (para Selenium) */
  window.getMenuDataForAutomation = function () {
    const cards = document.querySelectorAll('.product-card');
    const menu = [];
    cards.forEach((card, index) => {
      const nameEl = card.querySelector('.product-name');
      const priceEl = card.querySelector('.product-price');
      const btn = card.querySelector('.add-to-cart-btn');
      if (nameEl && priceEl) {
        menu.push({
          index,
          name: nameEl.textContent.trim(),
          price: priceEl.textContent.trim(),
          hasAddButton: !!btn,
        });
      }
    });
    return JSON.stringify(menu);
  };

  function updateBadge() {
    const badge = document.querySelector(selectors.cartBadge);
    if (!badge) return;
    const count = cart.reduce((n, i) => n + i.quantity, 0);
    badge.textContent = count;
    badge.style.visibility = count > 0 ? 'visible' : 'hidden';
  }

  function renderCartList() {
    const list = document.querySelector(selectors.cartList);
    const totalEl = document.querySelector(selectors.cartTotal);
    if (!list) return;

    if (cart.length === 0) {
      list.innerHTML = '<p class="cart-empty" data-testid="cart-empty">El carrito está vacío.</p>';
      if (totalEl) totalEl.textContent = '$0';
      updateBadge();
      saveCart();
      return;
    }

    list.innerHTML = cart
      .map(
        (item, i) => `
        <li class="cart-item" data-testid="cart-item" data-index="${i}">
          <span class="cart-item-name">${escapeHtml(item.name)}</span>
          <span class="cart-item-qty">x${item.quantity}</span>
          <span class="cart-item-price">$${formatNumber(item.subtotal)}</span>
          <button type="button" class="cart-item-remove" data-testid="cart-remove-${i}" aria-label="Quitar">×</button>
        </li>
      `
      )
      .join('');

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    if (totalEl) totalEl.textContent = '$' + formatNumber(total);

    updateBadge();
    saveCart();
    updateCartDataExport();

    list.querySelectorAll('.cart-item-remove').forEach((btn, i) => {
      btn.addEventListener('click', () => removeFromCart(i));
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatNumber(n) {
    return n.toLocaleString('es-CO');
  }

  function renderCartUI() {
    renderCartList();
    updateCartDataExport();
  }

  function addToCart(name, priceText) {
    const price = parsePrice(priceText);
    if (isNaN(price) || price <= 0) return;

    const existing = cart.find((i) => i.name === name);
    if (existing) {
      existing.quantity += 1;
      existing.subtotal = existing.price * existing.quantity;
    } else {
      cart.push({ name, price, quantity: 1, subtotal: price });
    }
    renderCartUI();
  }

  function parsePrice(text) {
    if (!text || typeof text !== 'string') return NaN;
    const num = text.replace(/[^\d]/g, '');
    return parseInt(num, 10) || NaN;
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCartUI();
  }

  function toggleCartPanel() {
    const panel = document.querySelector(selectors.cartPanel);
    if (!panel) return;
    panel.classList.toggle('cart-panel--open');
  }

  function closeModals() {
    document.querySelectorAll(selectors.modalOverlay).forEach((el) => el.classList.remove('modal--open'));
  }

  function openReport() {
    const overlay = document.querySelector(selectors.modalOverlay);
    const content = document.querySelector(selectors.dashboardContent);
    if (!overlay || !content) return;

    const data = getCartForExport();
    const menuJson = window.getMenuDataForAutomation ? window.getMenuDataForAutomation() : '[]';
    const menu = JSON.parse(menuJson);

    content.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-cards">
          <div class="dashboard-card">
            <span class="dashboard-card-value">${data.count}</span>
            <span class="dashboard-card-label">Items en carrito</span>
          </div>
          <div class="dashboard-card">
            <span class="dashboard-card-value">$${formatNumber(data.total)}</span>
            <span class="dashboard-card-label">Total</span>
          </div>
          <div class="dashboard-card">
            <span class="dashboard-card-value">${menu.length}</span>
            <span class="dashboard-card-label">Productos en menú</span>
          </div>
        </div>
        <div class="dashboard-section">
          <h4 class="dashboard-title">Tu carrito</h4>
          ${data.items.length ? `
            <table class="dashboard-table">
              <thead>
                <tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                ${data.items.map(function (item) {
                  return '<tr><td>' + escapeHtml(item.name) + '</td><td>' + item.quantity + '</td><td>$' + formatNumber(item.subtotal) + '</td></tr>';
                }).join('')}
              </tbody>
            </table>
          ` : '<p class="dashboard-empty">No hay productos en el carrito.</p>'}
        </div>
        <div class="dashboard-section">
          <h4 class="dashboard-title">Menú disponible</h4>
          <table class="dashboard-table">
            <thead>
              <tr><th>Producto</th><th>Precio</th></tr>
            </thead>
            <tbody>
              ${menu.map(function (p) {
                return '<tr><td>' + escapeHtml(p.name) + '</td><td>' + escapeHtml(p.price) + '</td></tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    overlay.classList.add('modal--open');
  }

  function openSupport() {
    const overlay = document.querySelector('[data-testid="support-modal"]');
    if (overlay) overlay.classList.add('modal--open');
  }

  function init() {
    const cartBtn = document.querySelector(selectors.cartBtn);
    const reportBtn = document.querySelector(selectors.reportBtn);
    const supportBtn = document.querySelector(selectors.supportBtn);
    const panel = document.querySelector(selectors.cartPanel);

    if (cartBtn) cartBtn.addEventListener('click', toggleCartPanel);
    const cartPanelClose = document.querySelector('[data-testid="cart-panel-close"]');
    if (cartPanelClose) cartPanelClose.addEventListener('click', toggleCartPanel);
    if (reportBtn) reportBtn.addEventListener('click', openReport);
    if (supportBtn) supportBtn.addEventListener('click', openSupport);

    document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
      btn.setAttribute('data-testid', 'add-to-cart-btn');
      const card = btn.closest('.product-card');
      if (!card) return;
      const nameEl = card.querySelector('.product-name');
      const priceEl = card.querySelector('.product-price');
      if (nameEl && priceEl) {
        btn.addEventListener('click', () => addToCart(nameEl.textContent.trim(), priceEl.textContent.trim()));
      }
    });

    document.querySelectorAll(selectors.modalOverlay).forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModals();
      });
    });
    document.querySelectorAll('[data-testid="modal-close"]').forEach((btn) => {
      btn.addEventListener('click', closeModals);
    });

    loadCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
