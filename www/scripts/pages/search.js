import { initializeJsonService } from '../services/json-service.js';
import { getCurrentUser } from '../services/auth-service.js';
import { searchProperties, filterProperties } from '../services/property-service.js';
import { toggleFavorite } from '../services/auth-service.js';
import { showToast, showLoginModal } from '../utils/app.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initializeJsonService();
        const user = await getCurrentUser();
        
        initSearchInput();
        initRecentSearches();
        initFilterPanel();
        await loadSuggestions();
        
    } catch (error) {
        console.error('Error initializing search page:', error);
        showToast('حدث خطأ في تهيئة الصفحة', 'error');
    }
});

const searchState = {
    query: '',
    filters: {
        type: 'all',
        transaction: 'all',
        minPrice: 0,
        maxPrice: 5000000,
        bedrooms: 'all',
        bathrooms: 'all',
        area: 'all',
        amenities: []
    },
    sort: 'default'
};

async function loadSuggestions() {
    try {
        const container = document.getElementById('propertySuggestions');
        if (!container) return;
        
        container.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const response = await fetch('data/properties.json');
        const properties = await response.json();
        
        if (properties.length === 0) {
            container.innerHTML = '<div class="text-center py-5">لا توجد عقارات</div>';
            return;
        }
        
        container.innerHTML = '';
        
        properties.slice(0, 2).forEach(property => {
            const propertyCard = createPropertyCard(property);
            container.appendChild(propertyCard);
        });
        
        initFavoriteButtons();
    } catch (error) {
        console.error('Error loading suggestions:', error);
        const container = document.getElementById('propertySuggestions');
        if (container) {
            container.innerHTML = '<div class="text-center py-5">حدث خطأ في تحميل الاقتراحات</div>';
        }
    }
}

function saveRecentSearch(searchText) {
    if (!searchText) return;
    
    try {
        let recentSearches = JSON.parse(localStorage.getItem('aqar_recent_searches') || '[]');
        
        recentSearches = recentSearches.filter(search => search !== searchText);
        recentSearches.unshift(searchText);
        recentSearches = recentSearches.slice(0, 5);
        
        localStorage.setItem('aqar_recent_searches', JSON.stringify(recentSearches));
    } catch (error) {
        console.error('Error saving recent search:', error);
    }
}

function loadRecentSearches() {
    try {
        return JSON.parse(localStorage.getItem('aqar_recent_searches') || '[]');
    } catch (error) {
        console.error('Error loading recent searches:', error);
        return [];
    }
}

function clearRecentSearches() {
    localStorage.removeItem('aqar_recent_searches');
    updateRecentSearchesUI();
}

function updateRecentSearchesUI() {
    const recentSearches = loadRecentSearches();
    const container = document.getElementById('recentSearches');
    
    if (!container) return;
    
    if (recentSearches.length === 0) {
        container.style.display = 'none';
        return;
    } else {
        container.style.display = 'block';
    }
    
    const headerElements = container.querySelectorAll('.section-header, .section-title, .section-action');
    
    Array.from(container.children).forEach(child => {
        if (!Array.from(headerElements).includes(child)) {
            container.removeChild(child);
        }
    });
    
    recentSearches.forEach(search => {
        const searchItem = document.createElement('div');
        searchItem.className = 'recent-search-item';
        searchItem.dataset.search = search;
        
        searchItem.innerHTML = `
            <div class="recent-search-icon">
                <i class="fas fa-history"></i>
            </div>
            <div class="recent-search-text">${search}</div>
        `;
        
        container.appendChild(searchItem);
    });
    
    initRecentSearchItems();
}

function initRecentSearchItems() {
    const recentSearchItems = document.querySelectorAll('.recent-search-item');
    
    recentSearchItems.forEach(item => {
        item.addEventListener('click', function() {
            const searchText = this.dataset.search;
            const searchInput = document.getElementById('searchInput');
            
            if (searchInput) {
                searchInput.value = searchText;
                performSearch(searchText);
            }
        });
    });
}

function initSearchInput() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        setTimeout(() => {
            searchInput.focus();
        }, 500);
        
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value.trim());
            }
        });
    }
}

function initRecentSearches() {
    updateRecentSearchesUI();
    
    const clearSearchesBtn = document.getElementById('clearSearchesBtn');
    if (clearSearchesBtn) {
        clearSearchesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearRecentSearches();
        });
    }
}

function initFilterPanel() {
    const filterButton = document.getElementById('filterButton');
    const filtersPanel = document.getElementById('filtersPanel');
    const filtersOverlay = document.getElementById('filtersOverlay');
    const closeFiltersBtn = document.getElementById('closeFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    if (filterButton && filtersPanel) {
        filterButton.addEventListener('click', function() {
            openFiltersPanel();
        });
    }
    
    if (filtersOverlay) {
        filtersOverlay.addEventListener('click', function() {
            closeFiltersPanel();
        });
    }
    
    if (closeFiltersBtn) {
        closeFiltersBtn.addEventListener('click', function() {
            closeFiltersPanel();
        });
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetFilters();
        });
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
            closeFiltersPanel();
        });
    }
    
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const filterSection = this.closest('.filter-section');
            const filterTitle = filterSection.querySelector('.filter-section__title').textContent;
            
            if (['نوع العقار', 'نوع المعاملة', 'غرف النوم', 'الحمامات', 'المساحة'].includes(filterTitle)) {
                filterSection.querySelectorAll('.filter-option').forEach(opt => {
                    opt.classList.remove('filter-option--selected');
                });
                this.classList.add('filter-option--selected');
            } else {
                this.classList.toggle('filter-option--selected');
            }
        });
    });
}

function openFiltersPanel() {
    const filtersPanel = document.getElementById('filtersPanel');
    const filtersOverlay = document.getElementById('filtersOverlay');
    
    if (filtersPanel && filtersOverlay) {
        filtersPanel.classList.add('search-filters-panel--visible');
        filtersOverlay.classList.add('search-filters-overlay--visible');
        document.body.style.overflow = 'hidden';
    }
}

function closeFiltersPanel() {
    const filtersPanel = document.getElementById('filtersPanel');
    const filtersOverlay = document.getElementById('filtersOverlay');
    
    if (filtersPanel && filtersOverlay) {
        filtersPanel.classList.remove('search-filters-panel--visible');
        filtersOverlay.classList.remove('search-filters-overlay--visible');
        document.body.style.overflow = '';
    }
}

function resetFilters() {
    const filterOptions = document.querySelectorAll('.filter-option');
    
    filterOptions.forEach(option => {
        const filterSection = option.closest('.filter-section');
        const filterTitle = filterSection.querySelector('.filter-section__title').textContent;
        
        if (['نوع العقار', 'نوع المعاملة', 'غرف النوم', 'الحمامات', 'المساحة'].includes(filterTitle)) {
            if (option.dataset.filter === 'all') {
                option.classList.add('filter-option--selected');
            } else {
                option.classList.remove('filter-option--selected');
            }
        } else {
            option.classList.remove('filter-option--selected');
        }
    });
    
    searchState.filters = {
        type: 'all',
        transaction: 'all',
        minPrice: 0,
        maxPrice: 5000000,
        bedrooms: 'all',
        bathrooms: 'all',
        area: 'all',
        amenities: []
    };
    
    showToast('تم إعادة تعيين الفلاتر', 'success');
}

function applyFilters() {
    collectFiltersFromUI();
    
    toggleLoading(true);
    
    document.getElementById('initialSearchView').style.display = 'none';
    
    performFilteredSearch();
}

function collectFiltersFromUI() {
    const propertyTypeOptions = document.querySelectorAll('.filter-section:nth-child(1) .filter-option--selected');
    const transactionTypeOptions = document.querySelectorAll('.filter-section:nth-child(2) .filter-option--selected');
    const bedroomsOptions = document.querySelectorAll('.filter-section:nth-child(4) .filter-option--selected');
    const bathroomsOptions = document.querySelectorAll('.filter-section:nth-child(5) .filter-option--selected');
    
    if (propertyTypeOptions.length > 0) {
        searchState.filters.type = propertyTypeOptions[0].dataset.filter;
    }
    
    if (transactionTypeOptions.length > 0) {
        searchState.filters.transaction = transactionTypeOptions[0].dataset.filter;
    }
    
    if (bedroomsOptions.length > 0) {
        searchState.filters.bedrooms = bedroomsOptions[0].dataset.filter;
    }
    
    if (bathroomsOptions.length > 0) {
        searchState.filters.bathrooms = bathroomsOptions[0].dataset.filter;
    }
}

async function performFilteredSearch() {
    try {
        const response = await fetch('data/properties.json');
        let properties = await response.json();
        
        properties = properties.filter(property => {
            if (searchState.filters.type !== 'all' && property.propertyType !== searchState.filters.type) {
                return false;
            }
            
            if (searchState.filters.transaction !== 'all' && property.transactionType !== searchState.filters.transaction) {
                return false;
            }
            
            if (searchState.filters.bedrooms !== 'all') {
                const bedroomsFilter = searchState.filters.bedrooms === '5+' ? 5 : parseInt(searchState.filters.bedrooms);
                if (property.features.bedrooms < bedroomsFilter) {
                    return false;
                }
            }
            
            if (searchState.filters.bathrooms !== 'all') {
                const bathroomsFilter = searchState.filters.bathrooms === '5+' ? 5 : parseInt(searchState.filters.bathrooms);
                if (property.features.bathrooms < bathroomsFilter) {
                    return false;
                }
            }
            
            return true;
        });
        
        displaySearchResults(properties);
    } catch (error) {
        console.error('Error performing filtered search:', error);
        toggleLoading(false);
        showToast('حدث خطأ أثناء البحث', 'error');
    }
}

async function performSearch(query) {
    if (!query) return;
    
    saveRecentSearch(query);
    updateRecentSearchesUI();
    
    searchState.query = query;
    
    toggleLoading(true);
    
    document.getElementById('initialSearchView').style.display = 'none';
    
    try {
        const response = await fetch('data/properties.json');
        let properties = await response.json();
        
        const normalizedQuery = query.toLowerCase();
        properties = properties.filter(property => {
            const searchableText = `${property.title} ${property.location} ${property.description}`.toLowerCase();
            return searchableText.includes(normalizedQuery);
        });
        
        displaySearchResults(properties);
    } catch (error) {
        console.error('Error performing search:', error);
        showToast('حدث خطأ أثناء البحث', 'error');
        
        toggleLoading(false);
        
        document.getElementById('initialSearchView').style.display = 'block';
    }
}

function toggleLoading(show) {
    const loadingEl = document.getElementById('searchLoading');
    const resultsView = document.getElementById('searchResultsView');
    const noResults = document.getElementById('noResults');
    
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
    
    if (resultsView) {
        resultsView.style.display = show ? 'none' : 'block';
    }
    
    if (noResults) {
        noResults.style.display = 'none';
    }
}

function displaySearchResults(results) {
    toggleLoading(false);
    
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsView = document.getElementById('searchResultsView');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!resultsContainer || !resultsView || !noResults) return;
    
    if (!results || results.length === 0) {
        resultsView.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    if (resultsCount) {
        const countText = `${results.length} عقار`;
        resultsCount.textContent = countText;
    }
    
    resultsContainer.innerHTML = '';
    
    results.forEach(property => {
        const propertyCard = createPropertyCard(property);
        resultsContainer.appendChild(propertyCard);
    });
    
    resultsView.style.display = 'block';
    
    initFavoriteButtons();
}

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

function initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.property-card__favorite-btn');
    
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const propertyId = this.dataset.propertyId;
            const user = await getCurrentUser();
            
            if (!user) {
                const message = 'يجب تسجيل الدخول أولاً لإضافة العقار إلى المفضلة';
                
                showLoginModal(message);
                return;
            }
            
            try {
                const isAdded = await toggleFavorite(user.id, propertyId);
                const heartIcon = this.querySelector('i');
                
                if (isAdded) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                    heartIcon.style.color = '#ef4444';
                    
                    const successMessage = 'تمت إضافة العقار إلى المفضلة';
                    
                    showToast(successMessage, 'success');
                } else {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                    heartIcon.style.color = '';
                    
                    const infoMessage = 'تمت إزالة العقار من المفضلة';
                    
                    showToast(infoMessage, 'info');
                }
            } catch (error) {
                console.error("Error toggling favorite:", error);
                showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
            }
        });
    });
}