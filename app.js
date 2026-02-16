/**
 * Cafetería Y&V - Lógica de la página y datos para automatización con Selenium
 */

(function () {
  'use strict';

  // --- Estado del carrito (se expone para Selenium) ---
  let cart = [];
  const CART_STORAGE_KEY = 'cafeteria_yv_cart';

  // --- Estado del menú y categorías (para admin) ---
  let menuData = [];
  let categories = [];
  const MENU_STORAGE_KEY = 'cafeteria_yv_menu';
  const CATEGORY_STORAGE_KEY = 'cafeteria_yv_categories';

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

  // ========================
  // MENÚ / ADMIN
  // ========================

  function loadMenuFromStorageOrDom() {
    try {
      const savedMenu = localStorage.getItem(MENU_STORAGE_KEY);
      const savedCats = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (savedMenu) {
        menuData = JSON.parse(savedMenu);
      } else {
        // Construir menú inicial desde las tarjetas existentes en el DOM
        const cards = document.querySelectorAll('.products-grid .product-card');
        menuData = Array.from(cards).map((card, index) => {
          const nameEl = card.querySelector('.product-name');
          const priceEl = card.querySelector('.product-price');
          const imgEl = card.querySelector('img');
          return {
            id: index + 1,
            name: nameEl ? nameEl.textContent.trim() : 'Producto',
            price: parsePrice(priceEl ? priceEl.textContent.trim() : ''),
            category: 'General',
            imageUrl: imgEl ? imgEl.src : '',
          };
        });
      }
      if (savedCats) {
        categories = JSON.parse(savedCats);
      } else {
        categories = ['General'];
      }
    } catch (e) {
      menuData = [];
      categories = ['General'];
    }
    saveMenuState();
    renderMenuGrid();
  }

  function saveMenuState() {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuData));
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {}
  }

  function renderMenuGrid() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    grid.innerHTML = menuData
      .map(
        (item) => `
        <div class="product-card" data-product-id="${item.id}">
          <div class="product-image">
            <img src="${escapeHtml(item.imageUrl || 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop')}" alt="${escapeHtml(item.name)}">
          </div>
          <div class="product-info">
            <h3 class="product-name">${escapeHtml(item.name)}</h3>
            <p class="product-price">$${formatNumber(item.price || 0)}</p>
            <button class="add-to-cart-btn" data-testid="add-to-cart-btn">Agregar al carrito</button>
          </div>
        </div>
      `
      )
      .join('');

    // Reasignar eventos de carrito después de re-renderizar
    attachAddToCartHandlers();
  }

  function attachAddToCartHandlers() {
    document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
      btn.setAttribute('data-testid', 'add-to-cart-btn');
      const card = btn.closest('.product-card');
      if (!card) return;
      const nameEl = card.querySelector('.product-name');
      const priceEl = card.querySelector('.product-price');
      if (nameEl && priceEl) {
        btn.onclick = () => addToCart(nameEl.textContent.trim(), priceEl.textContent.trim());
      }
    });
  }

  function renderAdminCategories() {
    const list = document.getElementById('admin-category-list');
    const select = document.getElementById('admin-product-category');
    if (!list || !select) return;

    list.innerHTML = categories
      .map(
        (cat, index) => `
        <li class="admin-list-item">
          <span>${escapeHtml(cat)}</span>
          ${index === 0 ? '<span class="badge">Por defecto</span>' : ''}
          ${index > 0 ? `<button type="button" data-cat-index="${index}" class="danger-btn small">Eliminar</button>` : ''}
        </li>
      `
      )
      .join('');

    select.innerHTML = categories
      .map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)
      .join('');

    list.querySelectorAll('button[data-cat-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-cat-index'), 10);
        const removed = categories[i];
        categories.splice(i, 1);
        // Reasignar productos de esa categoría a la primera
        const fallback = categories[0] || 'General';
        menuData = menuData.map((p) =>
          p.category === removed
            ? { ...p, category: fallback }
            : p
        );
        saveMenuState();
        renderAdminCategories();
        renderAdminProducts();
        renderMenuGrid();
      });
    });
  }

  function renderAdminProducts() {
    const wrapper = document.getElementById('admin-product-list');
    if (!wrapper) return;
    if (!menuData.length) {
      wrapper.innerHTML = '<p class="dashboard-empty">No hay productos registrados.</p>';
      return;
    }

    wrapper.innerHTML = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${menuData
            .map(
              (p) => `
            <tr data-product-id="${p.id}">
              <td>${escapeHtml(p.name)}</td>
              <td>${escapeHtml(p.category || '')}</td>
              <td>$${formatNumber(p.price || 0)}</td>
              <td class="actions">
                <button type="button" class="secondary-btn small" data-action="edit">Editar</button>
                <button type="button" class="danger-btn small" data-action="delete">Eliminar</button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    wrapper.querySelectorAll('button[data-action]').forEach((btn) => {
      const tr = btn.closest('tr');
      const id = tr ? parseInt(tr.getAttribute('data-product-id'), 10) : null;
      if (!id) return;
      const action = btn.getAttribute('data-action');
      if (action === 'edit') {
        btn.addEventListener('click', () => fillProductForm(id));
      } else if (action === 'delete') {
        btn.addEventListener('click', () => deleteProduct(id));
      }
    });
  }

  function fillProductForm(id) {
    const product = menuData.find((p) => p.id === id);
    if (!product) return;
    const idInput = document.getElementById('admin-product-id');
    const nameInput = document.getElementById('admin-product-name');
    const priceInput = document.getElementById('admin-product-price');
    const catSelect = document.getElementById('admin-product-category');
    const imageInput = document.getElementById('admin-product-image');
    if (!idInput || !nameInput || !priceInput || !catSelect || !imageInput) return;

    idInput.value = String(product.id);
    nameInput.value = product.name;
    priceInput.value = product.price || 0;
    catSelect.value = product.category || categories[0] || 'General';
    imageInput.value = product.imageUrl || '';
  }

  function deleteProduct(id) {
    menuData = menuData.filter((p) => p.id !== id);
    saveMenuState();
    renderAdminProducts();
    renderMenuGrid();
  }

  function setupAdminForms() {
    const categoryForm = document.getElementById('admin-category-form');
    const categoryName = document.getElementById('admin-category-name');
    const productForm = document.getElementById('admin-product-form');

    if (categoryForm && categoryName) {
      categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = categoryName.value.trim();
        if (!value) return;
        if (!categories.includes(value)) {
          categories.push(value);
          saveMenuState();
          renderAdminCategories();
        }
        categoryName.value = '';
      });
    }

    if (productForm) {
      productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('admin-product-id');
        const nameInput = document.getElementById('admin-product-name');
        const priceInput = document.getElementById('admin-product-price');
        const catSelect = document.getElementById('admin-product-category');
        const imageInput = document.getElementById('admin-product-image');
        if (!nameInput || !priceInput || !catSelect || !imageInput || !idInput) return;

        const name = nameInput.value.trim();
        const price = parseInt(priceInput.value, 10) || 0;
        const category = catSelect.value;
        const imageUrl = imageInput.value.trim();

        if (!name || !price) return;

        const idValue = idInput.value ? parseInt(idInput.value, 10) : null;
        if (idValue) {
          // Editar
          menuData = menuData.map((p) =>
            p.id === idValue
              ? { ...p, name, price, category, imageUrl }
              : p
          );
        } else {
          // Nuevo
          const newId = menuData.length ? Math.max(...menuData.map((p) => p.id)) + 1 : 1;
          menuData.push({ id: newId, name, price, category, imageUrl });
        }

        idInput.value = '';
        nameInput.value = '';
        priceInput.value = '';
        imageInput.value = '';

        saveMenuState();
        renderAdminProducts();
        renderMenuGrid();
      });
    }
  }

  // ========================
  // ADMIN AUTH
  // ========================

  function openModal(selector) {
    const overlay = document.querySelector(selector);
    if (overlay) overlay.classList.add('modal--open');
  }

  function openAdminPanel() {
    const overlay = document.querySelector('[data-testid="admin-panel-modal"]');
    if (overlay) overlay.classList.add('modal--open');
    renderAdminCategories();
    renderAdminProducts();
  }

  function initAdminAuth() {
    const adminBtn = document.querySelector('[data-testid="admin-btn"]');
    const loginModalSelector = '[data-testid="admin-login-modal"]';
    const loginForm = document.getElementById('admin-login-form');
    const loginMsg = document.getElementById('admin-login-message');
    const logoutBtn = document.querySelector('[data-testid="admin-logout-btn"]');

    const cfg = (window.CafeteriaConfig || null);

    function showMessage(text, type) {
      if (!loginMsg) return;
      loginMsg.textContent = text;
      loginMsg.className = 'form-helper ' + (type || '');
    }

    async function requireAdminSession() {
      if (!cfg || !cfg.getCurrentUser || !cfg.isCurrentUserAdmin) {
        // Modo demo sin Supabase: abre directo el panel
        openAdminPanel();
        return;
      }
      const isAdmin = await cfg.isCurrentUserAdmin();
      if (isAdmin) {
        openAdminPanel();
      } else {
        openModal(loginModalSelector);
      }
    }

    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        requireAdminSession();
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('admin-email');
        const passInput = document.getElementById('admin-password');
        if (!emailInput || !passInput) return;

        const email = emailInput.value.trim();
        const password = passInput.value;

        if (!cfg || !cfg.signInAdmin) {
          // Sin Supabase, aceptamos cualquier credencial en modo local
          showMessage('Modo local sin Supabase: acceso concedido.', 'success');
          setTimeout(() => {
            closeModals();
            openAdminPanel();
          }, 500);
          return;
        }

        showMessage('Verificando credenciales...', 'info');
        try {
          const { user, error } = await cfg.signInAdmin({ email, password });
          if (error || !user) {
            showMessage(error ? error.message : 'Credenciales inválidas', 'error');
            return;
          }
          showMessage('Bienvenido, ' + (user.email || 'admin'), 'success');
          setTimeout(() => {
            closeModals();
            openAdminPanel();
          }, 500);
        } catch (err) {
          showMessage('Error al iniciar sesión', 'error');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (cfg && cfg.signOut) {
          try {
            await cfg.signOut();
          } catch (e) {}
        }
        closeModals();
      });
    }
  }

  function toggleCartPanel() {
    const panel = document.querySelector(selectors.cartPanel);
    if (!panel) return;
    panel.classList.toggle('cart-panel--open');
  }

  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach((el) => el.classList.remove('modal--open'));
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

    if (cartBtn) cartBtn.addEventListener('click', toggleCartPanel);
    const cartPanelClose = document.querySelector('[data-testid="cart-panel-close"]');
    if (cartPanelClose) cartPanelClose.addEventListener('click', toggleCartPanel);
    if (reportBtn) reportBtn.addEventListener('click', openReport);
    if (supportBtn) supportBtn.addEventListener('click', openSupport);

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModals();
      });
    });
    document.querySelectorAll('[data-testid="modal-close"]').forEach((btn) => {
      btn.addEventListener('click', closeModals);
    });

    // Inicializar carrito y menú
    loadCart();
    loadMenuFromStorageOrDom();

    // Inicializar admin (auth + formularios)
    setupAdminForms();
    initAdminAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
