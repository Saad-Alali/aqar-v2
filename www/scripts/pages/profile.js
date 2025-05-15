import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser, logoutUser, deleteUserAccount } from '../services/auth-service.js';
import { clearAllFavorites } from '../services/favorites-service.js';
import { showToast } from '../utils/app.js';

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await initializeJsonService();

        const user = await getCurrentUser();

        if (!user) {
            showAuthOverlay();
            return;
        }

        updateProfileUI(user);
        initializeInteractions(user);
        initDevInfoModal();

    } catch (error) {
        console.error("Error initializing profile page:", error);
        showToast("حدث خطأ في تهيئة الصفحة", "error");
    }
});

function showAuthOverlay() {
    const authOverlay = document.getElementById('authOverlay');
    const content = document.getElementById('profileContent');

    if (authOverlay) {
        authOverlay.style.display = 'flex';
    }

    if (content) {
        content.classList.add('blurred-content');
    }
}

function updateProfileUI(user) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    if (profileName) profileName.textContent = user.fullName || 'المستخدم';
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profileAvatar) profileAvatar.src = user.avatarUrl || 'img/placeholder.jpg';
}

function initializeInteractions(user) {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                try {
                    logoutUser().then(() => {
                        window.location.href = 'login.html';
                    }).catch(error => {
                        console.error("Error logging out:", error);
                        showToast('حدث خطأ في تسجيل الخروج', "error");
                    });
                } catch (error) {
                    console.error("Error logging out:", error);
                    showToast('حدث خطأ في تسجيل الخروج', "error");
                }
            }
        });
    }

    const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
    if (clearFavoritesBtn) {
        clearFavoritesBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const confirmMessage = 'هل أنت متأكد من حذف جميع المفضلات؟';

            if (confirm(confirmMessage)) {
                try {
                    await clearAllFavorites(user.id);
                    const successMessage = 'تم حذف جميع المفضلات بنجاح';
                    showToast(successMessage, 'success');
                } catch (error) {
                    console.error("Error clearing favorites:", error);
                    const errorMessage = 'فشل حذف المفضلات';
                    showToast(errorMessage, 'error');
                }
            }
        });
    }

    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const confirmMessage = 'هل أنت متأكد من حذف الحساب؟ لا يمكن التراجع عن هذه العملية.';

            if (confirm(confirmMessage)) {
                try {
                    await deleteUserAccount(user.id);
                    const successMessage = 'تم حذف الحساب بنجاح';
                    showToast(successMessage, 'success');

                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } catch (error) {
                    console.error("Error deleting account:", error);
                    const errorMessage = 'فشل حذف الحساب';
                    showToast(errorMessage, 'error');
                }
            }
        });
    }
}

function initDevInfoModal() {
    const developerInfoBtn = document.getElementById('developerInfoBtn');
    const devInfoDialog = document.getElementById('devInfoDialog');
    const closeDevInfoBtn = document.getElementById('closeDevInfoBtn');

    if (developerInfoBtn && devInfoDialog && closeDevInfoBtn) {
        developerInfoBtn.addEventListener('click', function (e) {
            e.preventDefault();
            devInfoDialog.style.display = 'flex';
        });

        closeDevInfoBtn.addEventListener('click', function () {
            devInfoDialog.style.display = 'none';
        });

        devInfoDialog.addEventListener('click', function (e) {
            if (e.target === devInfoDialog) {
                devInfoDialog.style.display = 'none';
            }
        });
    }
}