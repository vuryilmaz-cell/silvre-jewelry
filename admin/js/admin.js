// Admin Panel Main JS

// Check admin authentication
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  initLogout();
  displayCurrentUser();
});

function checkAdminAuth() {
  const token = localStorage.getItem('silvre_auth_token');
  
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  try {
    const userStr = localStorage.getItem('silvre_user');
    const user = JSON.parse(userStr);
    
    if (!user || user.role !== 'admin') {
      alert('Bu sayfaya erişim yetkiniz yok');
      localStorage.clear();
      window.location.href = '/login.html';
      return;
    }
  } catch (error) {
    console.error('Auth check error:', error);
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.clear();
        window.location.href = '/login.html';
      }
    });
  }
}

function displayCurrentUser() {
  const userElement = document.getElementById('currentUser');
  if (userElement) {
    try {
      const userStr = localStorage.getItem('silvre_user');
      const user = JSON.parse(userStr);
      if (user) {
        userElement.textContent = user.full_name || user.email;
      }
    } catch (error) {
      console.error('Display user error:', error);
    }
  }
}

// Format order status
function getStatusBadge(status) {
  const statusMap = {
    'pending': 'Beklemede',
    'confirmed': 'Onaylandı',
    'processing': 'Hazırlanıyor',
    'shipped': 'Kargoda',
    'delivered': 'Teslim Edildi',
    'cancelled': 'İptal'
  };
  
  return `<span class="status-badge ${status}">${statusMap[status] || status}</span>`;
}