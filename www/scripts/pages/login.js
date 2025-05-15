import { initializeJsonService } from '../services/json-service.js';
import { loginUser } from '../services/auth-service.js';
import { showToast } from '../utils/app.js';

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    try {
        await initializeJsonService();

        const loginForm = document.getElementById('loginForm');

        if (loginForm) {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            emailInput.addEventListener('blur', function () {
                validateEmail(this);
            });

            passwordInput.addEventListener('blur', function () {
                validatePassword(this);
            });

            loginForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                const isEmailValid = validateEmail(emailInput);
                const isPasswordValid = validatePassword(passwordInput);

                if (isEmailValid && isPasswordValid) {
                    try {
                        const loginBtn = document.getElementById('loginBtn');
                        const alertsContainer = document.getElementById('formAlerts');

                        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ تسجيل الدخول...';
                        loginBtn.disabled = true;

                        alertsContainer.innerHTML = '';

                        const user = await loginUser(emailInput.value, passwordInput.value);

                        alertsContainer.innerHTML = '<div class="alert alert--success"><i class="fas fa-check-circle"></i> تم تسجيل الدخول بنجاح! جاري التحويل...</div>';

                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    } catch (error) {
                        const alertsContainer = document.getElementById('formAlerts');
                        const loginBtn = document.getElementById('loginBtn');

                        let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.';

                        if (error.message) {
                            errorMessage = error.message;
                        }

                        alertsContainer.innerHTML = `<div class="alert alert--danger"><i class="fas fa-exclamation-circle"></i> ${errorMessage}</div>`;
                        loginBtn.textContent = 'دخول';
                        loginBtn.disabled = false;
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