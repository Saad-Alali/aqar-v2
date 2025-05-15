// Execute when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get the container for property cards
        const propertiesGrid = document.getElementById('propertiesGrid');
        if (!propertiesGrid) return;
        
        // Define loading message
        const loadingMessage = 'جاري تحميل العقارات...';
        
        // Show loading indicator while fetching properties
        propertiesGrid.innerHTML = `<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-3">${loadingMessage}</p></div>`;
        
        // Fetch properties data from JSON file
        const response = await fetch('data/properties.json');
        let properties = await response.json();
        
        // Format prices: Replace dollar sign with riyal
        properties = properties.map(property => {
            property.priceFormatted = property.priceFormatted.replace("$", "").replace(",", ",") + " ريال";
            return property;
        });
        
        // Clear loading indicator
        propertiesGrid.innerHTML = '';
        
        // Handle empty state if no properties
        if (properties.length === 0) {
            const noPropertiesMessage = 'لا توجد عقارات متاحة حالياً';
            
            propertiesGrid.innerHTML = `<div class="text-center py-5"><p>${noPropertiesMessage}</p></div>`;
            return;
        }
        
        // Create and append property cards to the grid
        properties.forEach(property => {
            const propertyCard = createPropertyCard(property);
            propertiesGrid.appendChild(propertyCard);
        });
        
        // Initialize favorite buttons functionality
        initFavoriteButtons();
        
        // Create pagination based on number of properties
        // (6 properties per page)
        createPagination(Math.ceil(properties.length / 6));
        
    } catch (error) {
        // Handle errors during data loading
        console.error("Error loading properties:", error);
        
        const propertiesGrid = document.getElementById('propertiesGrid');
        if (propertiesGrid) {
            const errorMessage = 'حدث خطأ في تحميل العقارات';
            
            propertiesGrid.innerHTML = `<div class="text-center py-5"><i class="fas fa-exclamation-circle fa-2x" style="color: var(--danger-color);"></i><p class="mt-3">${errorMessage}</p></div>`;
        }
    }
});

/**
 * Creates a property card element
 * @param {Object} property - The property data object
 * @returns {HTMLElement} The created card element
 */
function createPropertyCard(property) {
    const cardElement = document.createElement('div');
    cardElement.className = 'property-card';
    
    // Text for view details button
    const viewDetailsText = 'عرض التفاصيل';
    
    // Create HTML structure for the property card
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

/**
 * Initializes favorite buttons with click handlers
 * Dynamically imports required services when needed
 */
async function initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.property-card__favorite-btn');
    
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            // Prevent event from bubbling up to card
            e.preventDefault();
            e.stopPropagation();
            
            const propertyId = this.dataset.propertyId;
            
            try {
                // Dynamically import required services
                const { getCurrentUser } = await import('../services/auth-service.js');
                const { toggleFavorite } = await import('../services/auth-service.js');
                const { showLoginModal } = await import('../utils/app.js');
                
                // Get current user
                const user = await getCurrentUser();
                
                // Show login modal if not logged in
                if (!user) {
                    const message = 'يجب تسجيل الدخول أولاً لإضافة العقار إلى المفضلة';
                    
                    showLoginModal(message);
                    return;
                }
                
                // Toggle favorite status
                const isAdded = await toggleFavorite(user.id, propertyId);
                const heartIcon = this.querySelector('i');
                
                // Update button appearance based on favorite status
                if (isAdded) {
                    // Change to filled heart icon (favorited)
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                    heartIcon.style.color = '#ef4444';
                } else {
                    // Change to outline heart icon (not favorited)
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                    heartIcon.style.color = '';
                }
            } catch (error) {
                // Handle errors
                console.error("Error toggling favorite:", error);
                const { showToast } = await import('../utils/app.js');
                showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
            }
        });
    });
}

/**
 * Creates pagination controls for properties
 * @param {number} totalPages - Total number of pages
 */
function createPagination(totalPages) {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;
    
    // Clear existing pagination
    paginationElement.innerHTML = '';
    
    // Add previous page button
    const prevItem = document.createElement('li');
    prevItem.className = 'pagination__item';
    prevItem.innerHTML = `<a href="#" class="pagination__link"><i class="fas fa-chevron-right"></i></a>`;
    paginationElement.appendChild(prevItem);
    
    // Add numbered page buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'pagination__item';
        
        // Mark first page as active by default
        const activeClass = i === 1 ? 'pagination__link--active' : '';
        pageItem.innerHTML = `<a href="#" class="pagination__link ${activeClass}">${i}</a>`;
        
        paginationElement.appendChild(pageItem);
    }
    
    // Add next page button
    const nextItem = document.createElement('li');
    nextItem.className = 'pagination__item';
    nextItem.innerHTML = `<a href="#" class="pagination__link"><i class="fas fa-chevron-left"></i></a>`;
    paginationElement.appendChild(nextItem);
    
    // Add click handlers for all pagination links
    paginationElement.querySelectorAll('.pagination__link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            paginationElement.querySelectorAll('.pagination__link').forEach(l => {
                l.classList.remove('pagination__link--active');
            });
            
            this.classList.add('pagination__link--active');
            
            // Scroll to top of properties section
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