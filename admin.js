// Task 1: E-commerce
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${Number(value).toFixed(2).replace('.00', '')}`;

async function loadDashboard() {
  const response = await fetch('/api/admin/summary');
  if (response.status === 401) return showLogin();
  const data = await response.json();
  $('#login-view').hidden = true; $('#dashboard-view').hidden = false;
  $('#customers').textContent = data.metrics.customers; $('#orders').textContent = data.metrics.orders; $('#revenue').textContent = money(data.metrics.revenue); $('#products').textContent = data.metrics.products;
  $('#updated').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  $('#orders-table').innerHTML = data.orders.length ? data.orders.slice(0, 12).map((order) => `<tr><td><strong>${order.orderNumber}</strong></td><td>${order.user.name}<br><span class="muted">${order.user.email}</span></td><td class="address-cell">${order.address}</td><td>${order.itemCount}</td><td>${money(order.total)}</td><td><span class="status">${order.status}</span></td></tr>`).join('') : '<tr><td colspan="6">No orders yet.</td></tr>';
  $('#customers-list').innerHTML = data.users.length ? data.users.slice(0, 12).map((user) => `<div class="customer"><div><strong>${user.name}</strong><span>${user.email}</span></div><small>${new Date(user.createdAt).toLocaleDateString()}</small></div>`).join('') : '<p>No customers yet.</p>';
}
function showLogin() { $('#login-view').hidden = false; $('#dashboard-view').hidden = true; }
$('#admin-login').addEventListener('submit', async (event) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.target)); const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!response.ok) { $('#login-error').textContent = (await response.json()).error; return; } $('#login-error').textContent = ''; loadDashboard(); });
$('#logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method: 'POST' }); showLogin(); });
loadDashboard();
