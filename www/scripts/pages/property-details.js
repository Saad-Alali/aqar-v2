import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser } from '../services/auth-service.js';
import { getProperty } from '../services/property-service.js';
import { toggleFavorite } from '../services/auth-service.js';
import { isFavorite } from '../services/favorites-service.js';
import { showToast, showLoginModal } from '../utils/app.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const tabBar = document.querySelector('.tab-bar');
        if (tabBar) {
            tabBar.style.display = 'none';
        }
        
        await initializeJsonService();
        
        const user = await getCurrentUser();
        
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        
        if (!propertyId) {
            showError('معرّف العقار غير موجود');
            return;
        }
        
        await loadPropertyData(propertyId, user);
        
        initializeInteractions(propertyId, user);
        
    } catch (error) {
        console.error("Error initializing property details page:", error);
        showError('حدث خطأ في تحميل تفاصيل العقار');
    }
});

async function loadPropertyData(propertyId, user) {
    try {
        const property = await getProperty(propertyId);
        
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('propertyDetails').style.display = 'block';
        document.getElementById('propertyActions').style.display = 'flex';
        
        document.title = `${property.title} - عقار`;
        
        updatePropertyUI(property);
        
        if (user) {
            const isFav = await isFavorite(user.id, propertyId);
            updateFavoriteButtonState(isFav);
        }
    } catch (error) {
        console.error("Error loading property:", error);
        showError('العقار غير موجود أو حدث خطأ في التحميل');
    }
}

function updatePropertyUI(property) {
    document.getElementById('propertyTitle').textContent = property.title;
    const formattedPrice = property.priceFormatted.replace("$", "").replace(",", ",") + " ريال";
    document.getElementById('propertyPrice').textContent = formattedPrice;
    
    const locationElement = document.getElementById('propertyLocation');
    const locationIcon = locationElement.querySelector('i');
    locationElement.innerHTML = '';
    locationElement.appendChild(locationIcon);
    locationElement.appendChild(document.createTextNode(' ' + property.location));
    
    document.getElementById('propertyBedrooms').textContent = `${property.features.bedrooms} غرف`;
    document.getElementById('propertyBathrooms').textContent = `${property.features.bathrooms} حمامات`;
    document.getElementById('propertyArea').textContent = `${property.features.area} قدم²`;
    
    const descriptionContainer = document.getElementById('propertyDescriptionContainer');
    descriptionContainer.innerHTML = '';
    
    const paragraphs = property.description.split('\n\n');
    paragraphs.forEach((paragraph, index) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        if (index > 0) p.className = 'mt-2';
        descriptionContainer.appendChild(p);
    });
    
    document.getElementById('propertyMainImage').src = property.imageUrl;
    
    document.getElementById('favoriteBtn').dataset.propertyId = property.id;
}

function updateFavoriteButtonState(isFavorited) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    const heartIcon = favoriteBtn.querySelector('i');
    
    if (isFavorited) {
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        heartIcon.style.color = '#ef4444';
    } else {
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        heartIcon.style.color = '';
    }
}

function initializeInteractions(propertyId, user) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!user) {
                showLoginModal('يجب تسجيل الدخول أولاً لإضافة العقار إلى المفضلة');
                return;
            }
            
            try {
                const isAdded = await toggleFavorite(user.id, propertyId);
                updateFavoriteButtonState(isAdded);
                
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

function showError(message) {
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('propertyDetails').style.display = 'none';
    
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
}