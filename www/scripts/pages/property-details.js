// Import necessary services and utilities
import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser } from '../services/auth-service.js';
import { getProperty } from '../services/property-service.js';
import { toggleFavorite } from '../services/auth-service.js';
import { isFavorite } from '../services/favorites-service.js';
import { showToast, showLoginModal } from '../utils/app.js';

// Execute when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Hide tab bar on property details page for better view
        const tabBar = document.querySelector('.tab-bar');
        if (tabBar) {
            tabBar.style.display = 'none';
        }
        
        // Initialize the JSON service to load required data
        await initializeJsonService();
        
        // Get the currently logged-in user (might be null if not logged in)
        const user = await getCurrentUser();
        
        // Get property ID from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        
        // Verify property ID exists in the URL
        if (!propertyId) {
            showError('معرّف العقار غير موجود');
            return;
        }
        
        // Load and display property data
        await loadPropertyData(propertyId, user);
        
        // Initialize interactive elements
        initializeInteractions(propertyId, user);
        
    } catch (error) {
        // Handle any errors during initialization
        console.error("Error initializing property details page:", error);
        showError('حدث خطأ في تحميل تفاصيل العقار');
    }
});

/**
 * Loads and displays property data
 * @param {string} propertyId - ID of the property to load
 * @param {Object|null} user - Current user object (or null if not logged in)
 */
async function loadPropertyData(propertyId, user) {
    try {
        // Get property data from the service
        const property = await getProperty(propertyId);
        
        // Hide loading indicator and show property details
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('propertyDetails').style.display = 'block';
        document.getElementById('propertyActions').style.display = 'flex';
        
        // Update page title with property name
        document.title = `${property.title} - عقار`;
        
        // Update UI with property details
        updatePropertyUI(property);
        
        // Check and update favorite status if user is logged in
        if (user) {
            const isFav = await isFavorite(user.id, propertyId);
            updateFavoriteButtonState(isFav);
        }
    } catch (error) {
        console.error("Error loading property:", error);
        showError('العقار غير موجود أو حدث خطأ في التحميل');
    }
}

/**
 * Updates UI elements with property data
 * @param {Object} property - The property object
 */
function updatePropertyUI(property) {
    // Update title
    document.getElementById('propertyTitle').textContent = property.title;
    
    // Format price to use riyal instead of dollar
    const formattedPrice = property.priceFormatted.replace("$", "").replace(",", ",") + " ريال";
    document.getElementById('propertyPrice').textContent = formattedPrice;
    
    // Update location
    const locationElement = document.getElementById('propertyLocation');
    const locationIcon = locationElement.querySelector('i');
    locationElement.innerHTML = '';
    locationElement.appendChild(locationIcon);
    locationElement.appendChild(document.createTextNode(' ' + property.location));
    
    // Update features
    document.getElementById('propertyBedrooms').textContent = `${property.features.bedrooms} غرف`;
    document.getElementById('propertyBathrooms').textContent = `${property.features.bathrooms} حمامات`;
    document.getElementById('propertyArea').textContent = `${property.features.area} قدم²`;
    
    // Update description
    const descriptionContainer = document.getElementById('propertyDescriptionContainer');
    descriptionContainer.innerHTML = '';
    
    // Split description into paragraphs and create paragraph elements
    const paragraphs = property.description.split('\n\n');
    paragraphs.forEach((paragraph, index) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        if (index > 0) p.className = 'mt-2';
        descriptionContainer.appendChild(p);
    });
    
    // Update property image
    document.getElementById('propertyMainImage').src = property.imageUrl;
    
    // Set property ID for favorite button
    document.getElementById('favoriteBtn').dataset.propertyId = property.id;
}

/**
 * Updates the favorite button appearance based on favorite status
 * @param {boolean} isFavorited - Whether the property is favorited by the user
 */
function updateFavoriteButtonState(isFavorited) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    const heartIcon = favoriteBtn.querySelector('i');
    
    if (isFavorited) {
        // Show filled heart icon if favorited
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        heartIcon.style.color = '#ef4444';
    } else {
        // Show outline heart icon if not favorited
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        heartIcon.style.color = '';
    }
}

/**
 * Initializes interactive elements for the property details page
 * @param {string} propertyId - ID of the property
 * @param {Object|null} user - Current user object (or null if not logged in)
 */
function initializeInteractions(propertyId, user) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Check if user is logged in
            if (!user) {
                showLoginModal('يجب تسجيل الدخول أولاً لإضافة العقار إلى المفضلة');
                return;
            }
            
            try {
                // Toggle favorite status
                const isAdded = await toggleFavorite(user.id, propertyId);
                updateFavoriteButtonState(isAdded);
                
                // Show appropriate toast message
                if (isAdded) {
                    showToast('تمت إضافة العقار إلى المفضلة', 'success');
                } else {
                    showToast('تمت إزالة العقار من المفضلة', 'info');
                }
            } catch (error) {
                console.error("Error toggling favorite:", error);
                showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
            }
        });
    }
}

/**
 * Shows error state when property cannot be loaded
 * @param {string} message - Error message to display
 */
function showError(message) {
    // Hide loading and details containers
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('propertyDetails').style.display = 'none';
    
    // Show error container with message
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
}