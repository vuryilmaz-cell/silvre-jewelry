// Admin Dashboard

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardStats();
  await loadRecentOrders();
});

async function loadDashboardStats() {
  try {
    const stats = await api.getAdminStats();
    
    document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
    document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
    document.getElementById('totalCustomers').textContent = stats.totalCustomers || 0;
    document.getElementById('monthlySales').textContent = formatPrice(stats.monthlySales || 0);
    
  } catch (error) {
    console.error('Load stats error:', error);
    document.getElementById('totalProducts').textContent = '0';
    document.getElementById('pendingOrders').textContent = '0';
    document.getElementById('totalCustomers').textContent = '0';
    document.getElementById('monthlySales').textContent = '0 ₺';
  }
}

async function loadRecentOrders() {
  const tableBody = document.getElementById('recentOrdersTable');
  if (!tableBody) return;
  
  try {
    const data = await api.getAllOrders({ limit: 5, sort: '-created_at' });
    
    if (!data.orders || data.orders.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
            Henüz sipariş bulunmuyor
          </td>
        </tr>
      `;
      return;
    }
    
    tableBody.innerHTML = data.orders.map(order => `
      <tr>
        <td><strong>${order.order_number}</strong></td>
        <td>${order.customer_name || order.email || '-'}</td>
        <td>${formatPrice(order.total)}</td>
        <td>${getStatusBadge(order.status)}</td>
        <td>${formatDate(order.created_at)}</td>
        <td>
          <a href="/orders.html?search=${encodeURIComponent(order.order_number)}" class="btn btn-sm btn-secondary">
            Siparişe Git
          </a>
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    console.error('Load orders error:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #f44336;">
          Siparişler yüklenirken hata oluştu
        </td>
      </tr>
    `;
  }
}
