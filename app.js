// Task 1: E-commerce
const state = { products: [], cart: JSON.parse(localStorage.getItem('harbor-cart') || '[]'), category: 'All', user: null };
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${value.toFixed(2).replace('.00', '')}`;

async function loadProducts() {
  await loadCurrentUser();
  const response = await fetch('/api/products');
  state.products = await response.json();
  const detailMatch = window.location.pathname.match(/^\/product\/(\d+)/);
  if (detailMatch) {
    renderProductDetail(Number(detailMatch[1]));
    updateCart();
    return;
  }
  renderFilters();
  renderProducts();
  updateCart();
}

async function loadCurrentUser() {
  const response = await fetch('/api/auth/me');
  state.user = (await response.json()).user;
  updateAccountButton();
}

function updateAccountButton() {
  $('#account-button').textContent = state.user ? state.user.name : 'Sign in';
}

function openAccount() {
  $('#auth-content').innerHTML = `<div class="account-panel"><h2>Your account.</h2><p>Signed in as <strong>${state.user.email}</strong>.</p><button class="primary-button" id="sign-out">Sign out <span>→</span></button></div>`;
  $('#auth-modal').classList.add('open');
  $('#sign-out').addEventListener('click', signOut);
}

function openAuth(mode = 'login') {
  const register = mode === 'register';
  $('#auth-content').innerHTML = `<h2>${register ? 'Join the circle.' : 'Welcome back.'}</h2><p>${register ? 'Create an account to keep your details and orders together.' : 'Sign in to complete your order and view your account.'}</p><div class="auth-tabs"><button class="auth-tab ${register ? '' : 'active'}" data-auth-mode="login">Sign in</button><button class="auth-tab ${register ? 'active' : ''}" data-auth-mode="register">Create account</button></div><form class="auth-form" id="auth-form">${register ? '<label>Name<input name="name" autocomplete="name" required></label>' : ''}<label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" minlength="8" autocomplete="${register ? 'new-password' : 'current-password'}" required></label><button class="primary-button">${register ? 'Create account' : 'Sign in'} <span>→</span></button></form>`;
  $('#auth-modal').classList.add('open');
  document.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => openAuth(button.dataset.authMode)));
  $('#auth-form').addEventListener('submit', submitAuth);
}

async function submitAuth(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const isRegister = form.has('name');
  const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) });
  const result = await response.json();
  if (!response.ok) return showToast(result.error || 'Could not authenticate');
  state.user = result.user; updateAccountButton(); $('#auth-modal').classList.remove('open'); showToast(isRegister ? 'Account created' : 'Signed in');
}

async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST' });
  state.user = null; updateAccountButton(); $('#auth-modal').classList.remove('open'); showToast('Signed out');
}

function renderProductDetail(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  document.title = `${product.name} | Abuzar Jan Store`;
  document.querySelector('main').innerHTML = `<section class="detail"><a class="back-link" href="/#shop">← Back to collection</a><div class="detail-layout"><div class="detail-image"><img src="${product.image}" alt="${product.name}"></div><div class="detail-copy"><p class="eyebrow">${product.category} / ${product.badge}</p><h1>${product.name}</h1><div class="detail-rating">★ ${product.rating} <span>Made for the everyday outside</span></div><p class="detail-price">${money(product.price)}</p><p class="detail-description">${product.description}</p><label class="detail-label">Color <select id="detail-color">${product.colors.map((color) => `<option>${color}</option>`).join('')}</select></label><label class="detail-label">Size <select id="detail-size">${product.sizes.map((size) => `<option>${size}</option>`).join('')}</select></label><button class="primary-button detail-add" id="detail-add">Add to bag <span>→</span></button><div class="detail-note">Free shipping on orders over $100<br>30-day easy returns</div></div></div></section>`;
  $('#detail-add').addEventListener('click', () => { addToCart(product.id); toggleCart(true); });
}

function renderFilters() {
  const categories = ['All', ...new Set(state.products.map((product) => product.category))];
  $('#filters').innerHTML = categories.map((category) => `<button class="filter ${category === state.category ? 'active' : ''}" data-category="${category}">${category}</button>`).join('');
  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
    state.category = button.dataset.category;
    renderFilters();
    renderProducts();
  }));
}

function renderProducts() {
  const visible = state.products.filter((product) => state.category === 'All' || product.category === state.category);
  $('#product-grid').innerHTML = visible.map((product) => `<article class="product-card"><a href="/product/${product.id}" class="product-image"><img src="${product.image}" alt="${product.name}"><span class="badge">${product.badge}</span></a><button class="quick-add" data-add="${product.id}">Add to bag <span>+</span></button><div class="product-info"><div><p class="product-name">${product.name}</p><p class="product-category">${product.category} · ★ ${product.rating}</p></div><p class="product-price">${money(product.price)}</p></div></article>`).join('');
  document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addToCart(Number(button.dataset.add))));
}

function addToCart(productId) {
  const existing = state.cart.find((item) => item.productId === productId);
  existing ? existing.quantity++ : state.cart.push({ productId, quantity: 1 });
  persistCart(); updateCart(); showToast('Added to your bag');
}
function persistCart() { localStorage.setItem('harbor-cart', JSON.stringify(state.cart)); }
function cartDetails() { return state.cart.map((item) => ({ ...item, product: state.products.find((product) => product.id === item.productId) })).filter((item) => item.product); }
function updateCart() {
  const details = cartDetails();
  const count = details.reduce((total, item) => total + item.quantity, 0);
  const total = details.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  $('#cart-count').textContent = count; $('#drawer-count').textContent = `${count} ${count === 1 ? 'item' : 'items'}`; $('#cart-total').textContent = money(total);
  $('#cart-items').innerHTML = details.length ? details.map(({ product, quantity }) => `<div class="cart-line"><img src="${product.image}" alt="${product.name}"><div><h3>${product.name}</h3><p>${money(product.price)}</p><div class="quantity"><button data-change="-1" data-id="${product.id}">−</button>${quantity}<button data-change="1" data-id="${product.id}">+</button></div></div><span class="line-total">${money(product.price * quantity)}</span></div>`).join('') : '<div class="empty-cart">Your bag is waiting for something good.</div>';
  document.querySelectorAll('[data-change]').forEach((button) => button.addEventListener('click', () => changeQuantity(Number(button.dataset.id), Number(button.dataset.change))));
}
function changeQuantity(productId, delta) { const item = state.cart.find((entry) => entry.productId === productId); if (item) item.quantity += delta; state.cart = state.cart.filter((entry) => entry.quantity > 0); persistCart(); updateCart(); }
function toggleCart(open) { $('#cart-drawer').classList.toggle('open', open); $('#overlay').classList.toggle('open', open); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }

function openCheckout() {
  if (!state.cart.length) return showToast('Your bag is empty');
  if (!state.user) { openAuth(); return; }
  $('#checkout-content').innerHTML = `<h2>Almost yours.</h2><p>Hi ${state.user.name}. Tell us where to send your Abuzar Jan Store pieces.</p><form class="checkout-form" id="checkout-form"><label>Delivery address<input name="address" required autocomplete="street-address"></label><button class="primary-button">Place order <span>→</span></button></form>`;
  $('#checkout-modal').classList.add('open'); toggleCart(false);
  $('#checkout-form').addEventListener('submit', submitOrder);
}
async function submitOrder(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: form.get('address'), items: state.cart }) });
  const order = await response.json();
  if (!response.ok) return showToast(order.error || 'Could not place order');
  state.cart = []; persistCart(); updateCart();
  $('#checkout-content').innerHTML = `<div class="confirmation"><div class="confirmation-icon">✓</div><h2>Order confirmed.</h2><p>Thanks, ${order.customer.name}. Your order <strong>${order.orderNumber}</strong> is on its way to the packing table.</p><button class="primary-button" onclick="document.querySelector('#checkout-modal').classList.remove('open')">Continue shopping <span>→</span></button></div>`;
}

$('#cart-button').addEventListener('click', () => toggleCart(true)); $('#close-cart').addEventListener('click', () => toggleCart(false)); $('#overlay').addEventListener('click', () => { toggleCart(false); $('#checkout-modal').classList.remove('open'); $('#auth-modal').classList.remove('open'); }); $('#checkout-button').addEventListener('click', openCheckout); $('#close-checkout').addEventListener('click', () => $('#checkout-modal').classList.remove('open')); $('#account-button').addEventListener('click', () => state.user ? openAccount() : openAuth()); $('#close-auth').addEventListener('click', () => $('#auth-modal').classList.remove('open')); $('#newsletter-form').addEventListener('submit', (event) => { event.preventDefault(); event.target.reset(); showToast('You are on the list'); });
loadProducts();
