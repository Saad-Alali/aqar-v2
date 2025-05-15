import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser, updateUserProfile } from '../services/auth-service.js';
import { showToast } from '../utils/app.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initializeJsonService();
        
        const user = await getCurrentUser();
        
        if (!user) {
            showAuthOverlay();
            return;
        }
        
        populateForm(user);
        initializeForm(user);
        
    } catch (error) {
        console.error("Error initializing edit profile page:", error);
        showToast("حدث خطأ في تهيئة الصفحة", "error");
    }
});

function showAuthOverlay() {
    const authOverlay = document.getElementById('authOverlay');
    const content = document.getElementById('editProfileContent');
    
    if (authOverlay) {
        authOverlay.style.display = 'flex';
    }
    
    if (content) {
        content.classList.add('blurred-content');
    }
}

function populateForm(user) {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    
    if (fullNameInput) fullNameInput.value = user.fullName || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (addressInput) addressInput.value = user.address || '';
}

function initializeForm(user) {
    const editProfileForm = document.getElementById('editProfileForm');
    if (!editProfileForm) return;
    
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    
    fullNameInput.addEventListener('blur', function() {
        validateFullName(this);
    });
    
    phoneInput.addEventListener('blur', function() {
        validatePhone(this);
    });
    
    editProfileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isFullNameValid = validateFullName(fullNameInput);
        const isPhoneValid = validatePhone(phoneInput);
        
        if (!isFullNameValid || !isPhoneValid) {
            return;
        }
        
        try {
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.textContent = 'جارٍ الحفظ...';
            saveBtn.disabled = true;
            
            const updatedUser = await updateUserProfile(user.id, {
                fullName: fullNameInput.value,
                phone: phoneInput.value,
                address: addressInput.value,
                avatarUrl: user.avatarUrl,
                favorites: user.favorites
            });
            
            const alertsContainer = document.getElementById('formAlerts');
            alertsContainer.innerHTML = '<div class="alert alert--success">تم تحديث الملف الشخصي بنجاح!</div>';
            
            saveBtn.textContent = 'حفظ التغييرات';
            saveBtn.disabled = false;
            
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        } catch (error) {
            console.error("Error updating profile:", error);
            
            const alertsContainer = document.getElementById('formAlerts');
            alertsContainer.innerHTML = '<div class="alert alert--danger">فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.</div>';
            
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.textContent = 'حفظ التغييرات';
            saveBtn.disabled = false;
        }
    });
}

function validateFullName(input) {
    const isValid = input.value.trim().length >= 3;
    toggleError(input, isValid, 'fullNameError');
    return isValid;
}

function validatePhone(input) {
    if (input.value.trim() === '') {
        toggleError(input, true, 'phoneError');
        return true;
    }
    
    const phoneRegex = /^[\d\s\+\-\(\)]{8,15}$/;
    const isValid = phoneRegex.test(input.value);
    toggleError(input, isValid, 'phoneError');
    return isValid;
}

function toggleError(input, isValid, errorId) {
    if (isValid) {
        input.classList.remove('form__input--error');
        document.getElementById(errorId).style.display = 'none';
    } else {
        input.classList.add('form__input--error');
        document.getElementById(errorId).style.display = 'block';
    }
}