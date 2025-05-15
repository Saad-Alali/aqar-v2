// Import necessary services and utilities
import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser, updateUserProfile } from '../services/auth-service.js';
import { showToast } from '../utils/app.js';

// Execute when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
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
        
        // Populate the form with the user's existing data
        populateForm(user);
        
        // Initialize form event listeners and validation
        initializeForm(user);
        
    } catch (error) {
        // Handle any errors during initialization
        console.error("Error initializing edit profile page:", error);
        showToast("حدث خطأ في تهيئة الصفحة", "error");
    }
});

/**
 * Shows the authentication overlay when user is not logged in
 * This overlay prevents access to the profile editing features
 */
function showAuthOverlay() {
    const authOverlay = document.getElementById('authOverlay');
    const content = document.getElementById('editProfileContent');
    
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
 * Populates the form fields with the user's current data
 * @param {Object} user - The user object containing profile information
 */
function populateForm(user) {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    
    // Set values for each field if the element exists
    if (fullNameInput) fullNameInput.value = user.fullName || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (addressInput) addressInput.value = user.address || '';
}

/**
 * Initializes the form with event listeners and submission handling
 * @param {Object} user - The user object for updating profile
 */
function initializeForm(user) {
    const editProfileForm = document.getElementById('editProfileForm');
    if (!editProfileForm) return;
    
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    
    // Add blur event listeners for real-time validation
    fullNameInput.addEventListener('blur', function() {
        validateFullName(this);
    });
    
    phoneInput.addEventListener('blur', function() {
        validatePhone(this);
    });
    
    // Handle form submission
    editProfileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form fields before submission
        const isFullNameValid = validateFullName(fullNameInput);
        const isPhoneValid = validatePhone(phoneInput);
        
        // If any validation fails, stop the form submission
        if (!isFullNameValid || !isPhoneValid) {
            return;
        }
        
        try {
            // Show loading state on the save button
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.textContent = 'جارٍ الحفظ...';
            saveBtn.disabled = true;
            
            // Update the user profile with the new data
            const updatedUser = await updateUserProfile(user.id, {
                fullName: fullNameInput.value,
                phone: phoneInput.value,
                address: addressInput.value,
                avatarUrl: user.avatarUrl,
                favorites: user.favorites
            });
            
            // Show success message
            const alertsContainer = document.getElementById('formAlerts');
            alertsContainer.innerHTML = '<div class="alert alert--success">تم تحديث الملف الشخصي بنجاح!</div>';
            
            // Reset button state
            saveBtn.textContent = 'حفظ التغييرات';
            saveBtn.disabled = false;
            
            // Redirect to the profile page after a short delay
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        } catch (error) {
            // Handle errors during profile update
            console.error("Error updating profile:", error);
            
            // Show error message
            const alertsContainer = document.getElementById('formAlerts');
            alertsContainer.innerHTML = '<div class="alert alert--danger">فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.</div>';
            
            // Reset button state
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.textContent = 'حفظ التغييرات';
            saveBtn.disabled = false;
        }
    });
}

/**
 * Validates the full name input field
 * @param {HTMLInputElement} input - The full name input element to validate
 * @returns {boolean} True if validation passes, false otherwise
 */
function validateFullName(input) {
    // Name must be at least 3 characters long
    const isValid = input.value.trim().length >= 3;
    toggleError(input, isValid, 'fullNameError');
    return isValid;
}

/**
 * Validates the phone number input field
 * @param {HTMLInputElement} input - The phone input element to validate
 * @returns {boolean} True if validation passes, false otherwise
 */
function validatePhone(input) {
    // Phone is optional, so empty is valid
    if (input.value.trim() === '') {
        toggleError(input, true, 'phoneError');
        return true;
    }
    
    // Otherwise, must match the phone number pattern
    const phoneRegex = /^[\d\s\+\-\(\)]{8,15}$/;
    const isValid = phoneRegex.test(input.value);
    toggleError(input, isValid, 'phoneError');
    return isValid;
}

/**
 * Toggles the error state for an input field
 * @param {HTMLInputElement} input - The input element
 * @param {boolean} isValid - Whether the input is valid
 * @param {string} errorId - The ID of the error message element
 */
function toggleError(input, isValid, errorId) {
    if (isValid) {
        // Remove error styling and hide error message
        input.classList.remove('form__input--error');
        document.getElementById(errorId).style.display = 'none';
    } else {
        // Add error styling and show error message
        input.classList.add('form__input--error');
        document.getElementById(errorId).style.display = 'block';
    }
}