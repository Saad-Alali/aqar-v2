// Import necessary services and utilities
import { initializeJsonService } from '../services/json-service.js';
import { loginUser } from '../services/auth-service.js';
import { showToast } from '../utils/app.js';

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Initializes the login application
 * Sets up event listeners and validates form inputs
 */
async function initApp() {
    try {
        // Initialize the JSON service to load required data
        await initializeJsonService();

        // Get the login form element
        const loginForm = document.getElementById('loginForm');

        if (loginForm) {
            // Get form input elements
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            // Add blur event listeners for real-time validation
            emailInput.addEventListener('blur', function () {
                validateEmail(this);
            });

            passwordInput.addEventListener('blur', function () {
                validatePassword(this);
            });

            // Handle form submission
            loginForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                // Validate form inputs before submission
                const isEmailValid = validateEmail(emailInput);
                const isPasswordValid = validatePassword(passwordInput);

                // Proceed only if all validations pass
                if (isEmailValid && isPasswordValid) {
                    try {
                        // Get button and alerts container elements
                        const loginBtn = document.getElementById('loginBtn');
                        const alertsContainer = document.getElementById('formAlerts');

                        // Show loading state in the button
                        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ تسجيل الدخول...';
                        loginBtn.disabled = true;

                        // Clear any previous alerts
                        alertsContainer.innerHTML = '';

                        // Attempt to login the user
                        const user = await loginUser(emailInput.value, passwordInput.value);

                        // Show success message
                        alertsContainer.innerHTML = '<div class="alert alert--success"><i class="fas fa-check-circle"></i> تم تسجيل الدخول بنجاح! جاري التحويل...</div>';

                        // Redirect to home page after a short delay
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    } catch (error) {
                        // Handle login errors
                        const alertsContainer = document.getElementById('formAlerts');
                        const loginBtn = document.getElementById('loginBtn');

                        // Default error message
                        let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.';

                        // Use specific error message if available
                        if (error.message) {
                            errorMessage = error.message;
                        }

                        // Display error message to user
                        alertsContainer.innerHTML = `<div class="alert alert--danger"><i class="fas fa-exclamation-circle"></i> ${errorMessage}</div>`;
                        
                        // Reset button state
                        loginBtn.textContent = 'دخول';
                        loginBtn.disabled = false;
                    }
                }
            });
        }

    } catch (error) {
        // Handle initialization errors
        const alertsContainer = document.getElementById('formAlerts');
        if (alertsContainer) {
            alertsContainer.innerHTML = '<div class="alert alert--danger"><i class="fas fa-exclamation-triangle"></i> حدث خطأ في تهيئة التطبيق. يرجى المحاولة مرة أخرى لاحقاً.</div>';
        }
    }
}

/**
 * Validates email input
 * @param {HTMLInputElement} input - The email input element
 * @returns {boolean} True if valid, false otherwise
 */
function validateEmail(input) {
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(input.value);

    if (isValid) {
        // Remove error styling if valid
        input.classList.remove('form__input--error');
        document.getElementById('emailError').style.display = 'none';
    } else {
        // Add error styling if invalid
        input.classList.add('form__input--error');
        document.getElementById('emailError').style.display = 'block';
    }

    return isValid;
}

/**
 * Validates password input
 * @param {HTMLInputElement} input - The password input element
 * @returns {boolean} True if valid, false otherwise
 */
function validatePassword(input) {
    // Simple length validation (at least 6 characters)
    const isValid = input.value.length >= 6;

    if (isValid) {
        // Remove error styling if valid
        input.classList.remove('form__input--error');
        document.getElementById('passwordError').style.display = 'none';
    } else {
        // Add error styling if invalid
        input.classList.add('form__input--error');
        document.getElementById('passwordError').style.display = 'block';
    }

    return isValid;
}