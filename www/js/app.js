import { initializeJsonService } from './json-service.js';
import { getCurrentUser } from './auth-service.js';

let isInitializing = false;
let isInitialized = false;
let isOfflineMode = false;

document.addEventListener('DOMContentLoaded', async function() {
  await initApp();
});

async function initApp() {
  if (isInitializing) return;
  if (isInitialized) return;
  
  isInitializing = true;
  
  try {
    const isOnline = navigator.onLine;
    if (!isOnline) {
      console.log("Device is offline, entering offline mode");
      enterOfflineMode();
    }
    
    await initializeJsonService();
    
    const user = await getCurrentUser();
    updateAuthUI(user);
    
    initNavigation();
    initSwipeActions();
    initPullToRefresh();
    
    setupOfflineDetection();
    
    isInitialized = true;
    console.log("App initialized successfully");
  } catch (error) {
    console.error("Error initializing app:", error);
    enterOfflineMode();
    updateAuthUI(await getCurrentUser());
    isInitialized = true;
  } finally {
    isInitializing = false;
  }
}

function initNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('nav__menu--active');
    });
  }
  
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        try {
          await logoutUser();
          window.location.href = 'login.html';
        } catch (error) {
          console.error("Error logging out:", error);
          showToast("حدث خطأ في تسجيل الخروج", "error");
        }
      }
    });
  }
  
  const searchToggle = document.getElementById('searchToggle');
  const searchPanel = document.getElementById('searchPanel');
  
  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', () => {
      const isHidden = searchPanel.style.display === 'none' || !searchPanel.style.display;
      searchPanel.style.display = isHidden ? 'block' : 'none';
    });
  }
  
  const filterBtn = document.getElementById('filterBtn');
  
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (searchPanel) {
        const isHidden = searchPanel.style.display === 'none' || !searchPanel.style.display;
        searchPanel.style.display = isHidden ? 'block' : 'none';
      }
    });
  }
}

function initSwipeActions() {
  const swipeItems = document.querySelectorAll('.swipe-item');
  
  swipeItems.forEach(item => {
    let startX, moveX, deltaX = 0;
    let isSwiping = false;
    
    item.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
      
      item.style.transition = 'none';
    });
    
    item.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      
      moveX = e.touches[0].clientX;
      deltaX = moveX - startX;
      
      if (deltaX < 0 && deltaX > -150) {
        item.style.transform = `translateX(${deltaX}px)`;
      }
    });
    
    item.addEventListener('touchend', () => {
      isSwiping = false;
      item.style.transition = 'transform 0.3s ease';
      
      if (deltaX < -50) {
        item.style.transform = 'translateX(-80px)';
      } else {
        item.style.transform = 'translateX(0)';
      }
      
      deltaX = 0;
    });
  });
}

function initPullToRefresh() {
  const pullIndicator = document.getElementById('pullIndicator');
  const appContent = document.querySelector('.app-content');
  
  if (!pullIndicator || !appContent) return;
  
  let startY, moveY, deltaY = 0;
  let isPulling = false;
  let threshold = 80;
  
  appContent.addEventListener('touchstart', (e) => {
    if (appContent.scrollTop === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  });
  
  appContent.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    moveY = e.touches[0].clientY;
    deltaY = moveY - startY;
    
    if (deltaY > 0) {
      pullIndicator.style.display = 'flex';
      
      const resistance = deltaY * 0.4;
      
      if (resistance < threshold) {
        appContent.style.transform = `translateY(${resistance}px)`;
      }
      
      e.preventDefault();
    }
  });
  
  appContent.addEventListener('touchend', () => {
    if (!isPulling) return;
    
    isPulling = false;
    appContent.style.transition = 'transform 0.3s ease';
    
    if (deltaY > threshold / 2) {
      pullIndicator.innerHTML = '<div class="pull-indicator__spinner"></div><span>جاري التحديث...</span>';
      
      setTimeout(() => {
        appContent.style.transform = 'translateY(0)';
        pullIndicator.style.display = 'none';
        
        if (navigator.onLine) {
          location.reload();
        } else {
          showToast("لا يمكن التحديث، أنت غير متصل بالإنترنت", "error");
          refreshLocalContent();
        }
      }, 1500);
    } else {
      appContent.style.transform = 'translateY(0)';
      pullIndicator.style.display = 'none';
    }
    
    deltaY = 0;
  });
}

function refreshLocalContent() {
  getCurrentUser().then(user => {
    updateAuthUI(user);
  });
}

function setupOfflineDetection() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  if (!navigator.onLine) {
    enterOfflineMode();
  }
}

function handleOnline() {
  if (isOfflineMode) {
    isOfflineMode = false;
    showToast("تم استعادة الاتصال بالإنترنت", "success");
    removeOfflineIndicator();
  }
}

function handleOffline() {
  enterOfflineMode();
}

function enterOfflineMode() {
  isOfflineMode = true;
  showToast("أنت غير متصل بالإنترنت، سيتم العمل في وضع عدم الاتصال", "warning", 5000);
  addOfflineIndicator();
}

function addOfflineIndicator() {
  removeOfflineIndicator();
  
  const indicator = document.createElement('div');
  indicator.id = 'offlineIndicator';
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #f59e0b;
    color: white;
    text-align: center;
    padding: 4px 8px;
    font-size: 0.8rem;
    z-index: 9999;
  `;
  indicator.textContent = "أنت غير متصل بالإنترنت";
  
  document.body.appendChild(indicator);
  
  const appContent = document.querySelector('.app-content');
  if (appContent) {
    appContent.style.paddingTop = '28px';
  }
}

function removeOfflineIndicator() {
  const indicator = document.getElementById('offlineIndicator');
  if (indicator) {
    indicator.remove();
    
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      appContent.style.paddingTop = '';
    }
  }
}

function showToast(message, type = 'info', duration = 3000) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast--visible');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

function updateAuthUI(user) {
  if (user) {
    const profileNameElements = document.querySelectorAll('.user-name, #profileName');
    profileNameElements.forEach(el => {
      if (el) el.textContent = user.fullName || 'المستخدم';
    });
    
    const profileEmailElements = document.querySelectorAll('.user-email, #profileEmail');
    profileEmailElements.forEach(el => {
      if (el) el.textContent = user.email || '';
    });
    
    const profileAvatarElements = document.querySelectorAll('.user-avatar, #profileAvatar');
    profileAvatarElements.forEach(el => {
      if (el && user.avatarUrl) el.src = user.avatarUrl;
    });
    
    const loginButtons = document.querySelectorAll('.login-btn, .register-btn');
    loginButtons.forEach(btn => {
      if (btn) btn.style.display = 'none';
    });
    
    const profileButtons = document.querySelectorAll('.profile-btn, .logout-btn');
    profileButtons.forEach(btn => {
      if (btn) btn.style.display = 'block';
    });
  } else {
    const loginButtons = document.querySelectorAll('.login-btn, .register-btn');
    loginButtons.forEach(btn => {
      if (btn) btn.style.display = 'block';
    });
    
    const profileButtons = document.querySelectorAll('.profile-btn, .logout-btn');
    profileButtons.forEach(btn => {
      if (btn) btn.style.display = 'none';
    });
    
    checkAuthProtection();
  }
}

function checkAuthProtection() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  const protectedPages = ['profile.html', 'favorites.html', 'edit-profile.html', 'change-password.html'];
  
  if (protectedPages.includes(currentPage)) {
    const authOverlay = document.getElementById('authOverlay');
    const content = document.querySelector('.app-content');
    
    if (authOverlay) {
      authOverlay.style.display = 'flex';
    }
    
    if (content) {
      content.classList.add('blurred-content');
    }
  }
}

function showLoginModal(message) {
  const modal = document.createElement('div');
  modal.className = 'auth-overlay';
  modal.id = 'loginModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="auth-overlay__icon">
      <i class="fas fa-heart"></i>
    </div>
    <h2 class="auth-overlay__title">تسجيل الدخول مطلوب</h2>
    <p class="auth-overlay__description">
      ${message || 'يجب تسجيل الدخول أو إنشاء حساب جديد لإضافة العقارات إلى المفضلة.'}
    </p>
    <div class="auth-overlay__buttons">
      <a href="login.html" class="btn btn--primary">تسجيل الدخول</a>
      <a href="register.html" class="btn btn--outline-primary">إنشاء حساب جديد</a>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeLoginModal();
    }
  });
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.remove();
  }
}

window.showToast = showToast;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;

export { showToast, showLoginModal, closeLoginModal, updateAuthUI };