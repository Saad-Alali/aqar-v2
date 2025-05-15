// Import necessary services and utilities
import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser } from '../services/auth-service.js';
import { getUserFavorites, removeFromFavorites, clearAllFavorites } from '../services/favorites-service.js';
import { showToast } from '../utils/app.js';

// Execute when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', async function () {
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

        // Load the user's favorites
        await loadFavorites(user);
        
        // Initialize tab filtering functionality
        initTabs();
        
        // Initialize options menu (accessible from the header)
        initOptionsMenu(user);
        
        // Initialize the clear all button
        initClearAllButton(user);

    } catch (error) {
        // Handle any errors during initialization
        console.error("Error initializing favorites page:", error);
        showToast("حدث خطأ في تهيئة الصفحة", "error");
    }
});

/**
 * Shows the authentication overlay when user is not logged in
 * This overlay prevents access to the favorites features
 */
function showAuthOverlay() {
    const authOverlay = document.getElementById('authOverlay');
    const content = document.getElementById('favoritesContent');

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
 * Loads and displays the user's favorite properties
 * @param {Object} user - The user object
 */
async function loadFavorites(user) {
    try {
        // Get user's favorites from the service
        const favorites = await getUserFavorites(user.id);

        // Get DOM elements
        const favoritesContainer = document.getElementById('favoritesWithItems');
        const emptyState = document.getElementById('favoritesEmpty');
        const clearAllBtn = document.getElementById('clearAllFavoritesBtn');

        if (!favoritesContainer || !emptyState) return;

        // Handle empty state - no favorites
        if (!favorites || favorites.length === 0) {
            favoritesContainer.style.display = 'none';
            emptyState.style.display = 'block';
            if (clearAllBtn) clearAllBtn.style.display = 'none';
            return;
        }

        // Clear container and show favorites
        favoritesContainer.innerHTML = '';
        favoritesContainer.style.display = 'block';
        emptyState.style.display = 'none';
        if (clearAllBtn) clearAllBtn.style.display = 'inline-block';

        // Create and append favorite item elements
        favorites.forEach(property => {
            const favoriteItem = createFavoriteItem(property);
            favoritesContainer.appendChild(favoriteItem);
        });

        // Initialize delete buttons for each favorite
        attachDeleteButtons(user.id);
    } catch (error) {
        console.error("Error loading favorites:", error);
        showToast("حدث خطأ في تحميل المفضلة", "error");
    }
}

/**
 * Creates a favorite property item element
 * @param {Object} property - The property object
 * @returns {HTMLElement} The favorite item element
 */
function createFavoriteItem(property) {
    const itemElement = document.createElement('div');
    itemElement.className = 'favorite-property';
    
    // Add data attributes for filtering
    itemElement.dataset.id = property.id;
    itemElement.dataset.type = property.transactionType || 'للبيع';
    itemElement.dataset.category = property.propertyType || 'apartment';

    // Format price to use riyal instead of dollar
    const priceFormatted = property.priceFormatted.replace("$", "").replace(",", ",") + " ريال";

    // Create HTML structure for the favorite item
    itemElement.innerHTML = `
        <div class="favorite-property__content">
            <div class="favorite-property__image">
                <img src="${property.imageUrl}" alt="${property.title}">
            </div>
            <div class="favorite-property__details">
                <h3 class="favorite-property__title">${property.title}</h3>
                <div class="favorite-property__location">
                    <i class="fas fa-map-marker-alt"></i> ${property.location}
                </div>
                <div class="favorite-property__price">${priceFormatted}</div>
                <div class="favorite-property__features">
                    <div class="favorite-property__feature">
                        <i class="fas fa-bed"></i> ${property.features.bedrooms}
                    </div>
                    <div class="favorite-property__feature">
                        <i class="fas fa-bath"></i> ${property.features.bathrooms}
                    </div>
                    <div class="favorite-property__feature">
                        <i class="fas fa-ruler-combined"></i> ${property.features.area} قدم²
                    </div>
                </div>
            </div>
        </div>
        <div class="favorite-property__actions">
            <a href="#" class="favorite-property__action favorite-property__action--delete" title="إزالة من المفضلة" data-id="${property.id}">
                <i class="fas fa-trash-alt"></i>
            </a>
        </div>
    `;

    // Add click event to navigate to property details
    // Exclude clicks on action buttons
    itemElement.addEventListener('click', function (e) {
        if (e.target.closest('.favorite-property__action')) {
            return;
        }

        window.location.href = `property-details.html?id=${property.id}`;
    });

    return itemElement;
}

/**
 * Attaches event listeners to delete buttons for each favorite
 * @param {string} userId - ID of the current user
 */
function attachDeleteButtons(userId) {
    const deleteButtons = document.querySelectorAll('.favorite-property__action--delete');

    deleteButtons.forEach(button => {
        button.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            const propertyId = this.dataset.id;
            const propertyItem = this.closest('.favorite-property');

            if (!propertyId || !propertyItem) return;

            try {
                // Remove from favorites in the backend
                await removeFromFavorites(userId, propertyId);
                
                // Animate the removal from UI
                propertyItem.style.transition = 'all 0.3s ease';
                propertyItem.style.opacity = '0';
                propertyItem.style.height = '0';
                propertyItem.style.marginBottom = '0';
                propertyItem.style.overflow = 'hidden';

                // Remove element after animation completes
                setTimeout(() => {
                    propertyItem.remove();
                    
                    // Check if there are any favorites left
                    const remainingProperties = document.querySelectorAll('.favorite-property');
                    if (remainingProperties.length === 0) {
                        // Show empty state if no favorites left
                        document.getElementById('favoritesWithItems').style.display = 'none';
                        document.getElementById('favoritesEmpty').style.display = 'block';
                        document.getElementById('clearAllFavoritesBtn').style.display = 'none';
                    }
                }, 300);

                showToast('تمت إزالة العقار من المفضلة', 'info');
            } catch (error) {
                console.error("Error removing from favorites:", error);
                showToast('حدث خطأ في إزالة العقار من المفضلة', 'error');
            }
        });
    });
}

/**
 * Initializes filter tabs functionality
 */
function initTabs() {
    const tabs = document.querySelectorAll('.favorites-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Update active tab styling
            tabs.forEach(t => t.classList.remove('favorites-tab--active'));
            this.classList.add('favorites-tab--active');

            // Apply filter based on tab data-filter attribute
            const filter = this.dataset.filter;
            filterFavorites(filter);
        });
    });
}

/**
 * Filters favorite items based on selected filter
 * @param {string} filter - Filter value (all, property type, or transaction type)
 */
function filterFavorites(filter) {
    const favoriteItems = document.querySelectorAll('.favorite-property');
    const favoritesContainer = document.getElementById('favoritesWithItems');
    const emptyState = document.getElementById('favoritesEmpty');

    // Handle empty state
    if (!favoriteItems.length) {
        if (favoritesContainer) favoritesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    let hasVisibleItems = false;

    // Apply filtering to each item
    favoriteItems.forEach(item => {
        if (filter === 'all') {
            // Show all items if "all" filter is selected
            item.style.display = 'block';
            hasVisibleItems = true;
        } else if (item.dataset.type === filter || item.dataset.category === filter) {
            // Show items matching the filter type or category
            item.style.display = 'block';
            hasVisibleItems = true;
        } else {
            // Hide non-matching items
            item.style.display = 'none';
        }
    });

    // Show/hide empty state based on filtering results
    if (hasVisibleItems) {
        if (favoritesContainer) favoritesContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
    } else {
        if (favoritesContainer) favoritesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }
}

/**
 * Initializes the options menu (accessible from header ellipsis button)
 * @param {Object} user - The user object
 */
function initOptionsMenu(user) {
    const optionsBtn = document.getElementById('moreOptionsBtn');
    const optionsMenu = document.getElementById('optionsMenu');

    if (!optionsBtn || !optionsMenu) return;

    // Toggle options menu visibility on button click
    optionsBtn.addEventListener('click', function () {
        const isVisible = optionsMenu.style.display === 'block';
        optionsMenu.style.display = isVisible ? 'none' : 'block';
    });

    // Hide options menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!optionsBtn.contains(e.target) && !optionsMenu.contains(e.target)) {
            optionsMenu.style.display = 'none';
        }
    });

    // Initialize "Clear All" button in options menu
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async function () {
            if (confirm('هل أنت متأكد من حذف جميع المفضلات؟')) {
                try {
                    // Clear all favorites
                    await clearAllFavorites(user.id);
                    
                    // Show empty state
                    document.getElementById('favoritesWithItems').style.display = 'none';
                    document.getElementById('favoritesEmpty').style.display = 'block';
                    document.getElementById('clearAllFavoritesBtn').style.display = 'none';
                    
                    showToast('تم حذف جميع المفضلات', 'success');
                    optionsMenu.style.display = 'none';
                } catch (error) {
                    console.error("Error clearing favorites:", error);
                    showToast('حدث خطأ في حذف المفضلات', 'error');
                }
            }
        });
    }

    // Initialize sort by newest option
    const sortByNewestBtn = document.getElementById('sortByNewestBtn');
    
    // Initialize sort by price option
    const sortByPriceBtn = document.getElementById('sortByPriceBtn');

    if (sortByNewestBtn) {
        sortByNewestBtn.addEventListener('click', function () {
            sortFavorites('newest');
            optionsMenu.style.display = 'none';
        });
    }

    if (sortByPriceBtn) {
        sortByPriceBtn.addEventListener('click', function () {
            sortFavorites('price');
            optionsMenu.style.display = 'none';
        });
    }
}

/**
 * Sorts favorite items based on the selected criterion
 * @param {string} sortType - Sorting criteria ('price' or 'newest')
 */
function sortFavorites(sortType) {
    const favoritesContainer = document.getElementById('favoritesWithItems');
    const items = Array.from(document.querySelectorAll('.favorite-property'));

    // Skip if fewer than 2 items (no sorting needed)
    if (items.length <= 1) return;

    // Sort items based on the selected criterion
    items.sort((a, b) => {
        if (sortType === 'price') {
            // Extract numeric price values for comparison
            const priceA = a.querySelector('.favorite-property__price').textContent
                .replace(/[^\d]/g, '');
            const priceB = b.querySelector('.favorite-property__price').textContent
                .replace(/[^\d]/g, '');

            return parseInt(priceA) - parseInt(priceB); // Sort by price ascending
        } else if (sortType === 'newest') {
            return -1; // In this implementation, we assume newer items are already first
        }

        return 0;
    });

    // Re-append sorted items to maintain the new order
    items.forEach(item => {
        favoritesContainer.appendChild(item);
    });

    showToast('تم ترتيب العقارات', 'success');
}

/**
 * Initializes the clear all button at the bottom of the favorites page
 * @param {Object} user - The user object
 */
function initClearAllButton(user) {
    const clearAllBtn = document.getElementById('clearAllFavoritesBtn');

    if (!clearAllBtn) return;

    clearAllBtn.addEventListener('click', async function () {
        if (confirm('هل أنت متأكد من حذف جميع المفضلات؟')) {
            try {
                // Clear all favorites
                await clearAllFavorites(user.id);
                
                // Show empty state
                document.getElementById('favoritesWithItems').style.display = 'none';
                document.getElementById('favoritesEmpty').style.display = 'block';
                clearAllBtn.style.display = 'none';
                
                showToast('تم حذف جميع المفضلات', 'success');
            } catch (error) {
                console.error("Error clearing favorites:", error);
                showToast('حدث خطأ في حذف المفضلات', 'error');
            }
        }
    });
}