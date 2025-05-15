import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser } from '../services/auth-service.js';
import { getUserFavorites, removeFromFavorites, clearAllFavorites } from '../services/favorites-service.js';
import { showToast } from '../utils/app.js';

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await initializeJsonService();

        const user = await getCurrentUser();

        if (!user) {
            showAuthOverlay();
            return;
        }

        await loadFavorites(user);
        initTabs();
        initOptionsMenu(user);
        initClearAllButton(user);

    } catch (error) {
        console.error("Error initializing favorites page:", error);
        showToast("حدث خطأ في تهيئة الصفحة", "error");
    }
});

function showAuthOverlay() {
    const authOverlay = document.getElementById('authOverlay');
    const content = document.getElementById('favoritesContent');

    if (authOverlay) {
        authOverlay.style.display = 'flex';
    }

    if (content) {
        content.classList.add('blurred-content');
    }
}

async function loadFavorites(user) {
    try {
        const favorites = await getUserFavorites(user.id);

        const favoritesContainer = document.getElementById('favoritesWithItems');
        const emptyState = document.getElementById('favoritesEmpty');
        const clearAllBtn = document.getElementById('clearAllFavoritesBtn');

        if (!favoritesContainer || !emptyState) return;

        if (!favorites || favorites.length === 0) {
            favoritesContainer.style.display = 'none';
            emptyState.style.display = 'block';
            if (clearAllBtn) clearAllBtn.style.display = 'none';
            return;
        }

        favoritesContainer.innerHTML = '';
        favoritesContainer.style.display = 'block';
        emptyState.style.display = 'none';
        if (clearAllBtn) clearAllBtn.style.display = 'inline-block';

        favorites.forEach(property => {
            const favoriteItem = createFavoriteItem(property);
            favoritesContainer.appendChild(favoriteItem);
        });

        attachDeleteButtons(user.id);
    } catch (error) {
        console.error("Error loading favorites:", error);
        showToast("حدث خطأ في تحميل المفضلة", "error");
    }
}

function createFavoriteItem(property) {
    const itemElement = document.createElement('div');
    itemElement.className = 'favorite-property';
    itemElement.dataset.id = property.id;
    itemElement.dataset.type = property.transactionType || 'للبيع';
    itemElement.dataset.category = property.propertyType || 'apartment';

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
                <div class="favorite-property__price">${property.priceFormatted}</div>
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
            <a href="#" class="favorite-property__action" title="مشاركة">
                <i class="fas fa-share-alt"></i>
            </a>
        </div>
    `;

    itemElement.addEventListener('click', function (e) {
        if (e.target.closest('.favorite-property__action')) {
            return;
        }

        window.location.href = `property-details.html?id=${property.id}`;
    });

    return itemElement;
}

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
                await removeFromFavorites(userId, propertyId);
                propertyItem.style.transition = 'all 0.3s ease';
                propertyItem.style.opacity = '0';
                propertyItem.style.height = '0';
                propertyItem.style.marginBottom = '0';
                propertyItem.style.overflow = 'hidden';

                setTimeout(() => {
                    propertyItem.remove();
                    const remainingProperties = document.querySelectorAll('.favorite-property');
                    if (remainingProperties.length === 0) {
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

function initTabs() {
    const tabs = document.querySelectorAll('.favorites-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('favorites-tab--active'));
            this.classList.add('favorites-tab--active');

            const filter = this.dataset.filter;
            filterFavorites(filter);
        });
    });
}

function filterFavorites(filter) {
    const favoriteItems = document.querySelectorAll('.favorite-property');
    const favoritesContainer = document.getElementById('favoritesWithItems');
    const emptyState = document.getElementById('favoritesEmpty');

    if (!favoriteItems.length) {
        if (favoritesContainer) favoritesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    let hasVisibleItems = false;

    favoriteItems.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'block';
            hasVisibleItems = true;
        } else if (item.dataset.type === filter || item.dataset.category === filter) {
            item.style.display = 'block';
            hasVisibleItems = true;
        } else {
            item.style.display = 'none';
        }
    });

    if (hasVisibleItems) {
        if (favoritesContainer) favoritesContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
    } else {
        if (favoritesContainer) favoritesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }
}

function initOptionsMenu(user) {
    const optionsBtn = document.getElementById('moreOptionsBtn');
    const optionsMenu = document.getElementById('optionsMenu');

    if (!optionsBtn || !optionsMenu) return;

    optionsBtn.addEventListener('click', function () {
        const isVisible = optionsMenu.style.display === 'block';
        optionsMenu.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', function (e) {
        if (!optionsBtn.contains(e.target) && !optionsMenu.contains(e.target)) {
            optionsMenu.style.display = 'none';
        }
    });

    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async function () {
            if (confirm('هل أنت متأكد من حذف جميع المفضلات؟')) {
                try {
                    await clearAllFavorites(user.id);
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

    const sortByNewestBtn = document.getElementById('sortByNewestBtn');
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

function sortFavorites(sortType) {
    const favoritesContainer = document.getElementById('favoritesWithItems');
    const items = Array.from(document.querySelectorAll('.favorite-property'));

    if (items.length <= 1) return;

    items.sort((a, b) => {
        if (sortType === 'price') {
            const priceA = a.querySelector('.favorite-property__price').textContent
                .replace(/[^\d]/g, '');
            const priceB = b.querySelector('.favorite-property__price').textContent
                .replace(/[^\d]/g, '');

            return parseInt(priceA) - parseInt(priceB);
        } else if (sortType === 'newest') {
            return -1;
        }

        return 0;
    });

    items.forEach(item => {
        favoritesContainer.appendChild(item);
    });

    showToast('تم ترتيب العقارات', 'success');
}

function initClearAllButton(user) {
    const clearAllBtn = document.getElementById('clearAllFavoritesBtn');

    if (!clearAllBtn) return;

    clearAllBtn.addEventListener('click', async function () {
        if (confirm('هل أنت متأكد من حذف جميع المفضلات؟')) {
            try {
                await clearAllFavorites(user.id);
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