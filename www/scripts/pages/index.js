document.addEventListener('DOMContentLoaded', async function() {
    try {
        const propertiesGrid = document.getElementById('propertiesGrid');
        if (!propertiesGrid) return;
        
        const loadingMessage = 'جاري تحميل العقارات...';
        
        propertiesGrid.innerHTML = `<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-3">${loadingMessage}</p></div>`;
        
        const response = await fetch('data/properties.json');
        let properties = await response.json();
        
        propertiesGrid.innerHTML = '';
        
        if (properties.length === 0) {
            const noPropertiesMessage = 'لا توجد عقارات متاحة حالياً';
            
            propertiesGrid.innerHTML = `<div class="text-center py-5"><p>${noPropertiesMessage}</p></div>`;
            return;
        }
        
        properties.forEach(property => {
            const propertyCard = createPropertyCard(property);
            propertiesGrid.appendChild(propertyCard);
        });
        
        initFavoriteButtons();
        
        createPagination(Math.ceil(properties.length / 6));
        
    } catch (error) {
        console.error("Error loading properties:", error);
        
        const propertiesGrid = document.getElementById('propertiesGrid');
        if (propertiesGrid) {
            const errorMessage = 'حدث خطأ في تحميل العقارات';
            
            propertiesGrid.innerHTML = `<div class="text-center py-5"><i class="fas fa-exclamation-circle fa-2x" style="color: var(--danger-color);"></i><p class="mt-3">${errorMessage}</p></div>`;
        }
    }
});

function createPropertyCard(property) {
    const cardElement = document.createElement('div');
    cardElement.className = 'property-card';
    
    const viewDetailsText = 'عرض التفاصيل';
    
    cardElement.innerHTML = `
        <div class="property-card__image">
            <img src="${property.imageUrl}" class="property-card__img" alt="${property.title}">
            <button class="property-card__favorite-btn" data-property-id="${property.id}">
                <i class="far fa-heart"></i>
            </button>
            <div class="property-location-badge">
                <i class="fas fa-map-marker-alt"></i>
                ${property.location}
            </div>
        </div>
        <div class="property-card__content">
            <h3 class="property-card__title">${property.title}</h3>
            <div class="property-card__price">${property.priceFormatted}</div>
            <div class="property-card__features">
                <div class="property-card__feature">
                    <i class="fas fa-bed"></i>
                    ${property.features.bedrooms} غرف
                </div>
                <div class="property-card__feature">
                    <i class="fas fa-bath"></i>
                    ${property.features.bathrooms} حمامات
                </div>
                <div class="property-card__feature">
                    <i class="fas fa-ruler-combined"></i>
                    ${property.features.area} قدم²
                </div>
            </div>
            <a href="property-details.html?id=${property.id}" class="btn btn--primary btn--block">${viewDetailsText}</a>
        </div>
    `;
    
    return cardElement;
}

async function initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.property-card__favorite-btn');
    
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const propertyId = this.dataset.propertyId;
            
            try {
                const { getCurrentUser } = await import('../services/auth-service.js');
                const { toggleFavorite } = await import('../services/auth-service.js');
                const { showLoginModal } = await import('../utils/app.js');
                
                const user = await getCurrentUser();
                
                if (!user) {
                    const message = 'يجب تسجيل الدخول أولاً لإضافة العقار إلى المفضلة';
                    
                    showLoginModal(message);
                    return;
                }
                
                const isAdded = await toggleFavorite(user.id, propertyId);
                const heartIcon = this.querySelector('i');
                
                if (isAdded) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                    heartIcon.style.color = '#ef4444';
                } else {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                    heartIcon.style.color = '';
                }
            } catch (error) {
                console.error("Error toggling favorite:", error);
                const { showToast } = await import('../utils/app.js');
                showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
            }
        });
    });
}

function createPagination(totalPages) {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;
    
    paginationElement.innerHTML = '';
    
    const prevItem = document.createElement('li');
    prevItem.className = 'pagination__item';
    prevItem.innerHTML = `<a href="#" class="pagination__link"><i class="fas fa-chevron-right"></i></a>`;
    paginationElement.appendChild(prevItem);
    
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'pagination__item';
        
        const activeClass = i === 1 ? 'pagination__link--active' : '';
        pageItem.innerHTML = `<a href="#" class="pagination__link ${activeClass}">${i}</a>`;
        
        paginationElement.appendChild(pageItem);
    }
    
    const nextItem = document.createElement('li');
    nextItem.className = 'pagination__item';
    nextItem.innerHTML = `<a href="#" class="pagination__link"><i class="fas fa-chevron-left"></i></a>`;
    paginationElement.appendChild(nextItem);
    
    paginationElement.querySelectorAll('.pagination__link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            paginationElement.querySelectorAll('.pagination__link').forEach(l => {
                l.classList.remove('pagination__link--active');
            });
            
            this.classList.add('pagination__link--active');
            
            const propertiesSection = document.querySelector('.properties');
            if (propertiesSection) {
                window.scrollTo({
                    top: propertiesSection.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
}