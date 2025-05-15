// Import necessary services and utilities
import { initializeJsonService } from '../services/json-service.js';
import { registerUser } from '../services/auth-service.js';
import { showToast } from '../utils/app.js';

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Initializes the registration application
 * Sets up event listeners and form validation
 */
async function initApp() {
    try {
        // Initialize the JSON service to load required data
        await initializeJsonService();

        // Get the registration form element
        const registerForm = document.getElementById('registerForm');

        if (registerForm) {
            // Get form input elements
            const inputs = {
                fullName: document.getElementById('fullName'),
                email: document.getElementById('email'),
                phone: document.getElementById('phone'),
                password: document.getElementById('password'),
                confirmPassword: document.getElementById('confirmPassword')
            };

            // Add blur event listeners for real-time validation
            inputs.fullName.addEventListener('blur', () => validateFullName(inputs.fullName));
            inputs.email.addEventListener('blur', () => validateEmail(inputs.email));
            inputs.phone.addEventListener('blur', () => validatePhone(inputs.phone));
            inputs.password.addEventListener('blur', () => validatePassword(inputs.password));
            inputs.confirmPassword.addEventListener('blur', () => validateConfirmPassword(inputs.confirmPassword, inputs.password));

            // Handle form submission
            registerForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                // Validate all form fields before submission
                const isFullNameValid = validateFullName(inputs.fullName);
                const isEmailValid = validateEmail(inputs.email);
                const isPhoneValid = validatePhone(inputs.phone);
                const isPasswordValid = validatePassword(inputs.password);
                const isConfirmPasswordValid = validateConfirmPassword(inputs.confirmPassword, inputs.password);

                // Proceed only if all validations pass
                if (isFullNameValid && isEmailValid && isPhoneValid &&
                    isPasswordValid && isConfirmPasswordValid) {
                    try {
                        // Get button and alerts container elements
                        const registerBtn = document.getElementById('registerBtn');
                        const alertsContainer = document.getElementById('formAlerts');

                        // Show loading state in the button
                        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ إنشاء الحساب...';
                        registerBtn.disabled = true;

                        // Clear any previous alerts
                        alertsContainer.innerHTML = '';

                        // Attempt to register the user
                        const user = await registerUser(
                            inputs.email.value,
                            inputs.password.value,
                            inputs.fullName.value,
                            inputs.phone.value
                        );

                        // Show success message
                        alertsContainer.innerHTML = '<div class="alert alert--success"><i class="fas fa-check-circle"></i> تم إنشاء الحساب بنجاح! جاري التحويل...</div>';

                        // Redirect to home page after a short delay
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    } catch (error) {
                        // Handle registration errors
                        const alertsContainer = document.getElementById('formAlerts');
                        const registerBtn = document.getElementById('registerBtn');

                        // Default error message
                        let errorMessage = 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.';

                        // Use specific error message if available
                        if (error.message) {
                            errorMessage = error.message;
                        }

                        // Display error message to user
                        alertsContainer.innerHTML = `<div class="alert alert--danger"><i class="fas fa-exclamation-circle"></i> ${errorMessage}</div>`;
                        
                        // Reset button state
                        registerBtn.textContent = 'إنشاء حساب';
                        registerBtn.disabled = false;
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
 * Validates full name input
 * @param {HTMLInputElement} input - The full name input element
 * @returns {boolean} True if valid, false otherwise
 */
function validateFullName(input) {
    // Name must be at least 3 characters long
    const isValid = input.value.trim().length >= 3;

    if (isValid) {
        // Remove error styling if valid
        input.classList.remove('form__input--error');
        document.getElementById('fullNameError').style.display = 'none';
    } else {
        // Add error styling if invalid
        input.classList.add('form__input--error');
        document.getElementById('fullNameError').style.display = 'block';
    }

    return isValid;
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
 * Validates phone number input
 * @param {HTMLInputElement} input - The phone input element
 * @returns {boolean} True if valid, false otherwise
 */
function validatePhone(input) {
    // Phone number format validation (8-15 digits with optional formatting characters)
    const phoneRegex = /^[\d\s\+\-\(\)]{8,15}$/;
    const isValid = phoneRegex.test(input.value);

    if (isValid) {
        // Remove error styling if valid
        input.classList.remove('form__input--error');
        document.getElementById('phoneError').style.display = 'none';
    } else {
        // Add error styling if invalid
        input.classList.add('form__input--error');
        document.getElementById('phoneError').style.display = 'block';
    }

    return isValid;
}

/**
 * Validates password input
 * @param {HTMLInputElement} input - The password input element
 * @returns {boolean} True if valid, false otherwise
 */
function validatePassword(input) {
    // Password must be at least 6 characters long
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

/**
 * Validates confirm password input
 * @param {HTMLInputElement} input - The confirm password input element
 * @param {HTMLInputElement} passwordInput - The original password input element
 * @returns {boolean} True if valid, false otherwise
 */
function validateConfirmPassword(input, passwordInput) {
    // Confirm password must match the password
    const isValid = input.value === passwordInput.value;

    if (isValid) {
        // Remove error styling if valid
        input.classList.remove('form__input--error');
        document.getElementById('confirmPasswordError').style.display = 'none';
    } else {
        // Add error styling if invalid
        input.classList.add('form__input--error');
        document.getElementById('confirmPasswordError').style.display = 'block';
    }

    return isValid;
}