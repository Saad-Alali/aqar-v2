import { initializeJsonService } from '../services/json-service.js';
import { registerUser } from '../services/auth-service.js';
import { showToast } from '../utils/app.js';

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    try {
        await initializeJsonService();

        const registerForm = document.getElementById('registerForm');

        if (registerForm) {
            const inputs = {
                fullName: document.getElementById('fullName'),
                email: document.getElementById('email'),
                phone: document.getElementById('phone'),
                password: document.getElementById('password'),
                confirmPassword: document.getElementById('confirmPassword')
            };

            inputs.fullName.addEventListener('blur', () => validateFullName(inputs.fullName));
            inputs.email.addEventListener('blur', () => validateEmail(inputs.email));
            inputs.phone.addEventListener('blur', () => validatePhone(inputs.phone));
            inputs.password.addEventListener('blur', () => validatePassword(inputs.password));
            inputs.confirmPassword.addEventListener('blur', () => validateConfirmPassword(inputs.confirmPassword, inputs.password));

            registerForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                const isFullNameValid = validateFullName(inputs.fullName);
                const isEmailValid = validateEmail(inputs.email);
                const isPhoneValid = validatePhone(inputs.phone);
                const isPasswordValid = validatePassword(inputs.password);
                const isConfirmPasswordValid = validateConfirmPassword(inputs.confirmPassword, inputs.password);

                if (isFullNameValid && isEmailValid && isPhoneValid &&
                    isPasswordValid && isConfirmPasswordValid) {
                    try {
                        const registerBtn = document.getElementById('registerBtn');
                        const alertsContainer = document.getElementById('formAlerts');

                        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ إنشاء الحساب...';
                        registerBtn.disabled = true;

                        alertsContainer.innerHTML = '';

                        const user = await registerUser(
                            inputs.email.value,
                            inputs.password.value,
                            inputs.fullName.value,
                            inputs.phone.value
                        );

                        alertsContainer.innerHTML = '<div class="alert alert--success"><i class="fas fa-check-circle"></i> تم إنشاء الحساب بنجاح! جاري التحويل...</div>';

                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    } catch (error) {
                        const alertsContainer = document.getElementById('formAlerts');
                        const registerBtn = document.getElementById('registerBtn');

                        let errorMessage = 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.';

                        if (error.message) {
                            errorMessage = error.message;
                        }

                        alertsContainer.innerHTML = `<div class="alert alert--danger"><i class="fas fa-exclamation-circle"></i> ${errorMessage}</div>`;
                        registerBtn.textContent = 'إنشاء حساب';
                        registerBtn.disabled = false;
                    }
                }
            });
        }

    } catch (error) {
        const alertsContainer = document.getElementById('formAlerts');
        if (alertsContainer) {
            alertsContainer.innerHTML = '<div class="alert alert--danger"><i class="fas fa-exclamation-triangle"></i> حدث خطأ في تهيئة التطبيق. يرجى المحاولة مرة أخرى لاحقاً.</div>';
        }
    }
}

function validateFullName(input) {
    const isValid = input.value.trim().length >= 3;

    if (isValid) {
        input.classList.remove('form__input--error');
        document.getElementById('fullNameError').style.display = 'none';
    } else {
        input.classList.add('form__input--error');
        document.getElementById('fullNameError').style.display = 'block';
    }

    return isValid;
}

function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(input.value);

    if (isValid) {
        input.classList.remove('form__input--error');
        document.getElementById('emailError').style.display = 'none';
    } else {
        input.classList.add('form__input--error');
        document.getElementById('emailError').style.display = 'block';
    }

    return isValid;
}

function validatePhone(input) {
    const phoneRegex = /^[\d\s\+\-\(\)]{8,15}$/;
    const isValid = phoneRegex.test(input.value);

    if (isValid) {
        input.classList.remove('form__input--error');
        document.getElementById('phoneError').style.display = 'none';
    } else {
        input.classList.add('form__input--error');
        document.getElementById('phoneError').style.display = 'block';
    }

    return isValid;
}

function validatePassword(input) {
    const isValid = input.value.length >= 6;

    if (isValid) {
        input.classList.remove('form__input--error');
        document.getElementById('passwordError').style.display = 'none';
    } else {
        input.classList.add('form__input--error');
        document.getElementById('passwordError').style.display = 'block';
    }

    return isValid;
}

function validateConfirmPassword(input, passwordInput) {
    const isValid = input.value === passwordInput.value;

    if (isValid) {
        input.classList.remove('form__input--error');
        document.getElementById('confirmPasswordError').style.display = 'none';
    } else {
        input.classList.add('form__input--error');
        document.getElementById('confirmPasswordError').style.display = 'block';
    }

    return isValid;
}