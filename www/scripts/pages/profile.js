// Import necessary services and utilities
import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser, logoutUser, deleteUserAccount } from '../services/auth-service.js';
import { clearAllFavorites } from '../services/favorites-service.js';
import { showToast } from '../utils/app.js';

// Execute when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Initialize the JSON service to load required data
        await initializeJsonService();

        // Get the currently logged-in user
        const user = await getCurrentUser();

        // If no user is logged in, show the authentication overlay and stop execution
        if (!user) {
            showAuthOverlay();
            return;
        }

        // Update the UI with the user's profile information
        updateProfileUI(user);
        
        // Initialize interactive UI elements
        initializeInteractions(user);
        
        // Initialize the developer information modal
        initDevInfoModal();

    } catch (error) {
        // Handle any errors during initialization
        console.error("Error initializing profile page:", error);
        showToast("حدث خطأ في تهيئة الصفحة", "error");
    }
});

/**
 * Shows the authentication overlay when user is not logged in
 * This overlay prevents access to the profile features
 */
function showAuthOverlay() {
    const authOverlay = document.getElementById('authOverlay');
    const content = document.getElementById('profileContent');

    // Display the auth overlay
    if (authOverlay) {
        authOverlay.style.display = 'flex';
    }

    // Apply blur effect to the background content
    if (content) {
        content.classList.add('blurred-content');
    }
}

/**
 * Updates the profile UI with user information
 * @param {Object} user - The user object containing profile information
 */
function updateProfileUI(user) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    // Set user name with fallback
    if (profileName) profileName.textContent = user.fullName || 'المستخدم';
    
    // Set user email
    if (profileEmail) profileEmail.textContent = user.email || '';
    
    // Set user avatar with fallback
    if (profileAvatar) profileAvatar.src = user.avatarUrl || 'img/placeholder.jpg';
}

/**
 * Initializes interactive UI elements for the profile page
 * @param {Object} user - The user object
 */
function initializeInteractions(user) {
    // Initialize logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                // Prevent multiple clicks
                logoutBtn.disabled = true;
                
                // Clear user data from localStorage directly without waiting for async
                localStorage.removeItem('aqar_current_user');
                
                // Immediately redirect to login page
                window.location.href = 'login.html';
                
                // Also call the async function to clean up properly in the background
                logoutUser().catch(error => {
                    console.error("Error during background logout cleanup:", error);
                });
            }
        });
    }

    // Initialize clear favorites button
    const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
    if (clearFavoritesBtn) {
        clearFavoritesBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const confirmMessage = 'هل أنت متأكد من حذف جميع المفضلات؟';

            if (confirm(confirmMessage)) {
                try {
                    // Clear all favorites for the user
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

    // Initialize delete account button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const confirmMessage = 'هل أنت متأكد من حذف الحساب؟ لا يمكن التراجع عن هذه العملية.';

            if (confirm(confirmMessage)) {
                try {
                    // Prevent multiple clicks
                    deleteAccountBtn.disabled = true;
                    
                    // Clear localStorage immediately
                    localStorage.removeItem('aqar_current_user');
                    
                    // Then call the async function and redirect
                    await deleteUserAccount(user.id);
                    const successMessage = 'تم حذف الحساب بنجاح';
                    showToast(successMessage, 'success');

                    // Redirect to home page after a short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } catch (error) {
                    // Re-enable button if error occurs
                    deleteAccountBtn.disabled = false;
                    console.error("Error deleting account:", error);
                    const errorMessage = 'فشل حذف الحساب';
                    showToast(errorMessage, 'error');
                }
            }
        });
    }
}

/**
 * Initializes the developer information modal dialog
 */
function initDevInfoModal() {
    const developerInfoBtn = document.getElementById('developerInfoBtn');
    const devInfoDialog = document.getElementById('devInfoDialog');
    const closeDevInfoBtn = document.getElementById('closeDevInfoBtn');

    if (developerInfoBtn && devInfoDialog && closeDevInfoBtn) {
        // Open modal when clicking the developer info button
        developerInfoBtn.addEventListener('click', function (e) {
            e.preventDefault();
            devInfoDialog.style.display = 'flex';
        });

        // Close modal when clicking the close button
        closeDevInfoBtn.addEventListener('click', function () {
            devInfoDialog.style.display = 'none';
        });

        // Close modal when clicking outside the modal content
        devInfoDialog.addEventListener('click', function (e) {
            if (e.target === devInfoDialog) {
                devInfoDialog.style.display = 'none';
            }
        });
    }
}