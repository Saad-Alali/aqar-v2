// Global variables to track map state
let map;                     // Google Maps instance
let markers = [];            // Array to store map markers
let currentCity = null;      // Currently selected city
let currentNeighborhood = null; // Currently selected neighborhood
let neighborhoodDetails = null; // Detailed information about the selected neighborhood

/**
 * Initializes the Google Map when the API is loaded
 * This function is called by the Google Maps API callback
 */
function initializeMap() {
    // Default center coordinates for Saudi Arabia
    const saudiArabia = { lat: 24.7136, lng: 46.6753 };
    
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined') {
        console.error('Google Maps API not loaded');
        // Show error message in the map container
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#666;"><p>خريطة غير متاحة حالياً<br>تحقق من اتصالك بالإنترنت</p></div>';
        }
        // Continue loading cities without the map
        loadCities();
        return;
    }
    
    // Initialize the map with default options
    map = new google.maps.Map(document.getElementById('map'), {
        center: saudiArabia,
        zoom: 6,
        mapTypeControl: false,      // Hide map type control (satellite/terrain)
        streetViewControl: false,    // Hide street view control
        fullscreenControl: false,    // Hide fullscreen control
        styles: [
            {
                // Hide points of interest labels for cleaner map
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Load cities data to populate the city grid
    loadCities();
}

// Make the function available globally for the Google Maps callback
window.initializeMap = initializeMap;

/**
 * Loads cities data from the API or local storage
 */
async function loadCities() {
    try {
        // Show loading indicator while fetching data
        showLoading('cityGrid');
        
        // Get cities data
        const cities = await getCities();
        
        // Render cities in the grid
        renderCities(cities);
        
        // Add markers for cities on the map if it's available
        if (map) {
            addCityMarkers(cities);
        }
        
        // Hide loading indicator
        hideLoading('cityGrid');
    } catch (error) {
        console.error('Error loading cities:', error);
        showToast('حدث خطأ في تحميل بيانات المدن', 'error');
        renderErrorState('cityGrid', 'لا يمكن تحميل المدن');
    }
}

/**
 * Renders the cities grid with data
 * @param {Array} cities - Array of city objects
 */
function renderCities(cities) {
    const cityGrid = document.getElementById('cityGrid');
    
    if (!cityGrid || !cities) return;
    
    // Clear existing content
    cityGrid.innerHTML = '';
    
    // Handle empty state
    if (cities.length === 0) {
        cityGrid.innerHTML = '<div class="text-center py-5">لا توجد مدن متاحة</div>';
        return;
    }
    
    // Create and append city cards
    cities.forEach(city => {
        const cityCard = createCityCard(city);
        cityGrid.appendChild(cityCard);
    });
}

/**
 * Creates a city card element
 * @param {Object} city - The city data object
 * @returns {HTMLElement} The created card element
 */
function createCityCard(city) {
    const card = document.createElement('div');
    card.className = 'city-card';
    card.dataset.cityId = city.id;
    
    // Get a valid image URL for the city
    const imageUrl = ensureValidImageUrl(city.imageUrl || getCityImageUrl(city.nameEn || city.name));
    
    // Create card content with image and city name
    card.innerHTML = `
        <img src="${imageUrl}" alt="${city.name}" class="city-card__image" onerror="this.src='img/placeholder.jpg'">
        <div class="city-card__overlay">
            <div class="city-card__name">${city.name}</div>
        </div>
    `;
    
    // Add click event to select this city
    card.addEventListener('click', () => {
        selectCity(city);
    });
    
    return card;
}

/**
 * Ensures a valid image URL is used, with fallbacks if needed
 * @param {string} url - The original image URL
 * @returns {string} A valid image URL or fallback image
 */
function ensureValidImageUrl(url) {
    // If URL is empty or null, use placeholder
    if (!url || url.trim() === '') {
        return 'img/placeholder.jpg';
    }
    
    // If URL is from Unsplash (trusted source), use it
    if (url.startsWith('https://images.unsplash.com')) {
        return url;
    }
    
    // Otherwise use a local fallback image based on a hash of the URL
    const fallbackImages = [
        'img/city1.jpg',
        'img/city2.jpg',
        'img/city3.jpg',
        'img/city4.jpg',
        'img/city5.jpg',
        'img/placeholder.jpg'
    ];
    
    // Simple hash function to pick a consistent image for the same URL
    const hashCode = url.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return fallbackImages[hashCode % fallbackImages.length];
}

/**
 * Handles city selection - shows neighborhoods for selected city
 * @param {Object} city - The selected city object
 */
function selectCity(city) {
    // Update current selections
    currentCity = city;
    currentNeighborhood = null;
    
    // Hide cities grid and show neighborhoods section
    document.getElementById('cityGrid').parentElement.style.display = 'none';
    const neighborhoodsSection = document.getElementById('neighborhoodsSection');
    neighborhoodsSection.style.display = 'block';
    
    // Update title with city name
    document.getElementById('selectedCityTitle').textContent = `أحياء ${city.name}`;
    
    // Update map if available
    if (map) {
        map.setCenter({ lat: city.lat, lng: city.lng });
        map.setZoom(12);
        clearMarkers();
    }
    
    // Load neighborhoods for the selected city
    loadNeighborhoods(city.id);
}

/**
 * Loads neighborhoods data for a specific city
 * @param {string} cityId - ID of the selected city
 */
async function loadNeighborhoods(cityId) {
    try {
        // Show loading indicator
        showLoading('neighborhoodGrid');
        
        // Get neighborhoods data for the city
        const neighborhoods = await getNeighborhoods(cityId);
        
        // Render neighborhoods in the grid
        renderNeighborhoods(neighborhoods);
        
        // Add markers for neighborhoods on the map if it's available
        if (map) {
            addNeighborhoodMarkers(neighborhoods);
        }
        
        // Hide loading indicator
        hideLoading('neighborhoodGrid');
    } catch (error) {
        console.error('Error loading neighborhoods:', error);
        showToast('حدث خطأ في تحميل بيانات الأحياء', 'error');
        renderErrorState('neighborhoodGrid', 'لا يمكن تحميل الأحياء');
    }
}

/**
 * Renders the neighborhoods grid with data
 * @param {Array} neighborhoods - Array of neighborhood objects
 */
function renderNeighborhoods(neighborhoods) {
    const neighborhoodGrid = document.getElementById('neighborhoodGrid');
    
    if (!neighborhoodGrid || !neighborhoods) return;
    
    // Clear existing content
    neighborhoodGrid.innerHTML = '';
    
    // Handle empty state
    if (neighborhoods.length === 0) {
        neighborhoodGrid.innerHTML = '<div class="text-center py-5">لا توجد أحياء متاحة</div>';
        return;
    }
    
    // Create and append neighborhood cards
    neighborhoods.forEach(neighborhood => {
        const neighborhoodCard = createNeighborhoodCard(neighborhood);
        neighborhoodGrid.appendChild(neighborhoodCard);
    });
}

/**
 * Creates a neighborhood card element
 * @param {Object} neighborhood - The neighborhood data object
 * @returns {HTMLElement} The created card element
 */
function createNeighborhoodCard(neighborhood) {
    const card = document.createElement('div');
    card.className = 'neighborhood-card';
    card.dataset.neighborhoodId = neighborhood.id;
    
    // Get a valid image URL for the neighborhood
    const imageUrl = ensureValidImageUrl(neighborhood.imageUrl || getNeighborhoodImageUrl(currentCity ? currentCity.nameEn : '', neighborhood.nameEn || neighborhood.name));
    
    // Create card content with image and neighborhood name
    card.innerHTML = `
        <div class="neighborhood-card__image-container">
            <img src="${imageUrl}" alt="${neighborhood.name}" class="neighborhood-card__image" onerror="this.src='img/placeholder.jpg'">
            <div class="neighborhood-card__overlay">
                <div class="neighborhood-card__name">${neighborhood.name}</div>
                <div class="neighborhood-card__info">
                    <i class="fas fa-info-circle"></i>
                    عرض المعلومات
                </div>
            </div>
        </div>
    `;
    
    // Add click event to select this neighborhood
    card.addEventListener('click', () => {
        selectNeighborhood(neighborhood);
    });
    
    return card;
}

/**
 * Handles neighborhood selection - shows detailed info for selected neighborhood
 * @param {Object} neighborhood - The selected neighborhood object
 */
async function selectNeighborhood(neighborhood) {
    // Update current selection
    currentNeighborhood = neighborhood;
    
    // Hide neighborhoods grid and show neighborhood details section
    document.getElementById('neighborhoodsSection').style.display = 'none';
    const neighborhoodInfo = document.getElementById('neighborhoodInfo');
    neighborhoodInfo.style.display = 'block';
    
    // Update title with neighborhood name
    document.getElementById('selectedNeighborhoodTitle').textContent = `حي ${neighborhood.name}`;
    
    // Update map if available
    if (map) {
        map.setCenter({ lat: neighborhood.lat, lng: neighborhood.lng });
        map.setZoom(15);
    }
    
    // Load all neighborhood data in parallel
    await Promise.all([
        loadNeighborhoodDetails(neighborhood),
        loadWeatherData(neighborhood),
        loadNearbyPlaces(neighborhood)
    ]);
}

/**
 * Loads detailed information about a neighborhood
 * @param {Object} neighborhood - The neighborhood object
 */
async function loadNeighborhoodDetails(neighborhood) {
    try {
        // Find or create the demographics card
        let demographicsCard = document.querySelector('.demographics-card');
        
        if (!demographicsCard) {
            const neighborhoodDetails = document.querySelector('.neighborhood-details');
            
            if (neighborhoodDetails) {
                // Create the demographics card if it doesn't exist
                demographicsCard = document.createElement('div');
                demographicsCard.className = 'info-card demographics-card';
                demographicsCard.innerHTML = `
                    <h3 class="info-card-title">
                        <i class="fas fa-chart-pie"></i>
                        معلومات الحي
                    </h3>
                    <div class="demographics-info" id="demographicsInfo">
                        <div class="weather-loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            جاري تحميل معلومات الحي...
                        </div>
                    </div>
                `;
                
                // Insert it after the weather card if it exists
                const weatherCard = document.querySelector('.weather-card');
                if (weatherCard) {
                    weatherCard.after(demographicsCard);
                } else {
                    neighborhoodDetails.prepend(demographicsCard);
                }
            }
        }
        
        const demographicsInfo = document.getElementById('demographicsInfo');
        
        if (demographicsInfo) {
            // Show loading state
            demographicsInfo.innerHTML = `
                <div class="weather-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    جاري تحميل معلومات الحي...
                </div>
            `;
            
            try {
                // Get neighborhood details
                const details = await getNeighborhoodDetails(neighborhood);
                
                // Populate the demographics card with data
                let html = `
                    <div class="neighborhood-description mb-3">
                        ${details.description || 'لا يوجد وصف متاح لهذا الحي'}
                    </div>
                    <div class="neighborhood-stats">
                        <div class="stat-group">
                            <div class="stat-title">الديموغرافيا</div>
                            <div class="stat-items">
                                <div class="stat-item">
                                    <div class="stat-label">عدد السكان</div>
                                    <div class="stat-value">${details.demographics?.population || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">الكثافة السكانية</div>
                                    <div class="stat-value">${details.demographics?.density || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">متوسط العمر</div>
                                    <div class="stat-value">${details.demographics?.avgAge ? details.demographics.avgAge + ' سنة' : 'غير متاح'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-title">المرافق</div>
                            <div class="stat-items">
                                <div class="stat-item">
                                    <div class="stat-label">المدارس</div>
                                    <div class="stat-value">${details.amenities?.schools || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">المستشفيات</div>
                                    <div class="stat-value">${details.amenities?.hospitals || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">الحدائق</div>
                                    <div class="stat-value">${details.amenities?.parks || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">مراكز التسوق</div>
                                    <div class="stat-value">${details.amenities?.malls || 'غير متاح'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-title">العقارات</div>
                            <div class="stat-items">
                                <div class="stat-item">
                                    <div class="stat-label">متوسط الأسعار</div>
                                    <div class="stat-value">${details.realEstate?.avgPrice || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">التغير السنوي</div>
                                    <div class="stat-value">${details.realEstate?.priceChange || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">عقارات للبيع</div>
                                    <div class="stat-value">${details.realEstate?.propertiesForSale || 'غير متاح'}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">عقارات للإيجار</div>
                                    <div class="stat-value">${details.realEstate?.propertiesForRent || 'غير متاح'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                demographicsInfo.innerHTML = html;
                
                // Add CSS styles for the neighborhood details
                addNeighborhoodDetailStyles();
                
            } catch (error) {
                console.error('Error loading neighborhood details:', error);
                demographicsInfo.innerHTML = '<div class="text-center">لا يمكن تحميل معلومات الحي</div>';
            }
        }
    } catch (error) {
        console.error('Error setting up neighborhood details section:', error);
    }
}

/**
 * Loads weather data for a neighborhood
 * @param {Object} neighborhood - The neighborhood object
 */
async function loadWeatherData(neighborhood) {
    const weatherInfo = document.getElementById('weatherInfo');
    
    if (!weatherInfo) return;
    
    // Show loading state
    weatherInfo.innerHTML = `
        <div class="weather-loading">
            <i class="fas fa-spinner fa-spin"></i>
            جاري تحميل معلومات الطقس...
        </div>
    `;
    
    try {
        // Get weather data for the neighborhood
        const weatherData = await getWeatherData(neighborhood);
        displayWeatherData(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherInfo.innerHTML = '<div class="text-center">لا يمكن تحميل معلومات الطقس</div>';
    }
}

/**
 * Displays weather data in the UI
 * @param {Object} data - Weather data object
 */
function displayWeatherData(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    
    if (!weatherInfo) return;
    
    // Extract weather details from the data
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const feelsLike = Math.round(data.main.feels_like);
    
    // Create HTML for weather display
    weatherInfo.innerHTML = `
        <div class="weather-main">
            <div class="weather-temp">${temp}°C</div>
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${description}" class="weather-icon">
        </div>
        <div class="weather-description">${description}</div>
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-label">الرطوبة</div>
                <div class="weather-detail-value">${humidity}%</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">سرعة الرياح</div>
                <div class="weather-detail-value">${windSpeed} م/ث</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">الإحساس</div>
                <div class="weather-detail-value">${feelsLike}°C</div>
            </div>
        </div>
    `;
}

/**
 * Loads nearby places for a neighborhood
 * @param {Object} neighborhood - The neighborhood object
 */
async function loadNearbyPlaces(neighborhood) {
    const nearbyInfo = document.getElementById('nearbyInfo');
    
    if (!nearbyInfo) return;
    
    // Show loading state
    nearbyInfo.innerHTML = `
        <div class="nearby-loading">
            <i class="fas fa-spinner fa-spin"></i>
            جاري تحميل المرافق القريبة...
        </div>
    `;
    
    try {
        // Get nearby places for the neighborhood
        const places = await getNearbyPlaces(neighborhood);
        displayNearbyPlaces(places);
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        nearbyInfo.innerHTML = `<div class="text-center">لا يمكن تحميل المرافق القريبة</div>`;
    }
}

/**
 * Displays nearby places in the UI
 * @param {Array} places - Array of nearby places
 */
function displayNearbyPlaces(places) {
    const nearbyInfo = document.getElementById('nearbyInfo');
    
    if (!nearbyInfo) return;
    
    // Handle empty state
    if (!places || places.length === 0) {
        nearbyInfo.innerHTML = `<div class="text-center">لا توجد مرافق قريبة</div>`;
        return;
    }
    
    // Create HTML for places display
    let html = `<div class="nearby-places">`;
    
    places.forEach(place => {
        html += `
            <div class="nearby-place">
                <div class="nearby-place-icon">
                    <i class="${getPlaceIcon(place.type)}"></i>
                </div>
                <div class="nearby-place-details">
                    <div class="nearby-place-name">${place.name}</div>
                    <div class="nearby-place-distance">${place.distance} متر</div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    nearbyInfo.innerHTML = html;
}

/**
 * Gets the appropriate Font Awesome icon for a place type
 * @param {string} type - The place type
 * @returns {string} CSS class for the icon
 */
function getPlaceIcon(type) {
    switch (type) {
        case 'restaurant':
            return 'fas fa-utensils';
        case 'school':
            return 'fas fa-school';
        case 'hospital':
            return 'fas fa-hospital';
        case 'park':
            return 'fas fa-tree';
        case 'shopping_mall':
            return 'fas fa-shopping-cart';
        case 'mosque':
            return 'fas fa-mosque';
        default:
            return 'fas fa-map-marker-alt';
    }
}

/**
 * Adds city markers to the map
 * @param {Array} cities - Array of city objects
 */
function addCityMarkers(cities) {
    if (!map || !cities) return;
    
    cities.forEach(city => {
        const markerPosition = { lat: city.lat, lng: city.lng };
        
        // Create a custom circle marker for each city
        const marker = new google.maps.Marker({
            position: markerPosition,
            map: map,
            title: city.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#2563eb',
                fillOpacity: 1,
                scale: 8,
                strokeColor: '#ffffff',
                strokeWeight: 2
            }
        });
        
        // Create info window for the marker
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <div class="map-info-title">${city.name}</div>
                    <div class="map-info-subtitle">${city.neighborhoods ? city.neighborhoods.length : 0} أحياء</div>
                </div>
            `
        });
        
        // Add click event to the marker
        marker.addListener('click', () => {
            // Close all other info windows
            markers.forEach(m => {
                if (m.infoWindow && m.infoWindow.getMap()) {
                    m.infoWindow.close();
                }
            });
            
            // Open this info window
            infoWindow.open(map, marker);
            
            // Select the city
            selectCity(city);
        });
        
        // Store info window reference on the marker
        marker.infoWindow = infoWindow;
        
        // Add marker to the markers array
        markers.push(marker);
    });
}

/**
 * Adds neighborhood markers to the map
 * @param {Array} neighborhoods - Array of neighborhood objects
 */
function addNeighborhoodMarkers(neighborhoods) {
    if (!map || !neighborhoods) return;
    
    neighborhoods.forEach(neighborhood => {
        const markerPosition = { lat: neighborhood.lat, lng: neighborhood.lng };
        
        // Create a custom circle marker for each neighborhood
        const marker = new google.maps.Marker({
            position: markerPosition,
            map: map,
            title: neighborhood.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#059669',
                fillOpacity: 1,
                scale: 6,
                strokeColor: '#ffffff',
                strokeWeight: 2
            }
        });
        
        // Create info window for the marker
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <div class="map-info-title">${neighborhood.name}</div>
                    <div class="map-info-subtitle">${currentCity ? currentCity.name : ''}</div>
                </div>
            `
        });
        
        // Add click event to the marker
        marker.addListener('click', () => {
            // Close all other info windows
            markers.forEach(m => {
                if (m.infoWindow && m.infoWindow.getMap()) {
                    m.infoWindow.close();
                }
            });
            
            // Open this info window
            infoWindow.open(map, marker);
            
            // Select the neighborhood
            selectNeighborhood(neighborhood);
        });
        
        // Store info window reference on the marker
        marker.infoWindow = infoWindow;
        
        // Add marker to the markers array
        markers.push(marker);
    });
}

/**
 * Clears all markers from the map
 */
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    
    markers = [];
}

/**
 * Shows loading indicator in a container
 * @param {string} containerId - ID of the container element
 */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div style="grid-column: span 2; text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i>
            <p style="margin-top: 10px;">جاري التحميل...</p>
        </div>
    `;
}

/**
 * Hides loading indicator in a container
 * @param {string} containerId - ID of the container element
 */
function hideLoading(containerId) {
    // This function is empty because the loading indicator
    // is replaced when content is rendered
}

/**
 * Renders an error state in a container
 * @param {string} containerId - ID of the container element
 * @param {string} message - Error message to display
 */
function renderErrorState(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div style="grid-column: span 2; text-align: center; padding: 20px;">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: var(--danger-color);"></i>
            <p style="margin-top: 10px;">${message}</p>
            <button class="btn btn--primary mt-3" id="retry-${containerId}">إعادة المحاولة</button>
        </div>
    `;
    
    // Add retry button functionality
    const retryButton = document.getElementById(`retry-${containerId}`);
    if (retryButton) {
        retryButton.addEventListener('click', function() {
            if (containerId === 'cityGrid') {
                loadCities();
            } else if (containerId === 'neighborhoodGrid' && currentCity) {
                loadNeighborhoods(currentCity.id);
            }
        });
    }
}

/**
 * Adds CSS styles for the neighborhood details
 * Dynamically creates a style element if it doesn't exist
 */
function addNeighborhoodDetailStyles() {
    if (document.getElementById('neighborhood-details-style')) return;
    
    const style = document.createElement('style');
    style.id = 'neighborhood-details-style';
    style.textContent = `
        .neighborhood-description {
            line-height: 1.6;
            margin-bottom: 15px;
            font-size: 0.9rem;
            color: var(--dark-color);
        }
        
        .neighborhood-stats {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .stat-group {
            background-color: var(--lighter-gray);
            border-radius: var(--border-radius-sm);
            padding: 10px;
        }
        
        .stat-title {
            font-weight: 600;
            color: var(--primary-color);
            margin-bottom: 10px;
            font-size: 0.9rem;
            border-bottom: 1px solid var(--light-gray);
            padding-bottom: 5px;
        }
        
        .stat-items {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
        }
        
        .stat-label {
            font-size: 0.75rem;
            color: var(--gray-color);
        }
        
        .stat-value {
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        @media (min-width: 768px) {
            .neighborhood-stats {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize UI elements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Back button from neighborhoods to cities view
    const backToCitiesBtn = document.getElementById('backToCities');
    if (backToCitiesBtn) {
        backToCitiesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Hide neighborhoods and show cities
            document.getElementById('neighborhoodsSection').style.display = 'none';
            document.getElementById('cityGrid').parentElement.style.display = 'block';
            
            // Reset map to Saudi Arabia view
            if (map) {
                map.setCenter({ lat: 24.7136, lng: 46.6753 });
                map.setZoom( 6);
                clearMarkers();
            }
            
            // Reload cities
            loadCities();
            
            // Reset current city
            currentCity = null;
        });
    }
    
    // Back button from neighborhood details to neighborhoods view
    const backToNeighborhoodsBtn = document.getElementById('backToNeighborhoods');
    if (backToNeighborhoodsBtn) {
        backToNeighborhoodsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Hide neighborhood details and show neighborhoods
            document.getElementById('neighborhoodInfo').style.display = 'none';
            document.getElementById('neighborhoodsSection').style.display = 'block';
            
            // Reset map to city view
            if (currentCity) {
                if (map) {
                    map.setCenter({ lat: currentCity.lat, lng: currentCity.lng });
                    map.setZoom(12);
                    clearMarkers();
                }
                
                // Reload neighborhoods
                loadNeighborhoods(currentCity.id);
            }
            
            // Reset current neighborhood
            currentNeighborhood = null;
        });
    }
    
    // Initialize map placeholder
    const mapElement = document.getElementById('map');
    if (mapElement && mapElement.innerHTML === '') {
        mapElement.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#666;"><p>جاري تحميل الخريطة...</p></div>';
    }
    
    // Initialize map immediately if Google Maps API is already loaded
    if (typeof google !== 'undefined' && google.maps) {
        initializeMap();
    }
    
    // Load cities even if map isn't ready yet
    if (mapElement && !mapElement.querySelector('.gm-style')) {
        loadCities();
    }
});

/**
 * Displays a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (info, success, error, warning)
 * @param {number} duration - How long to show the toast (in milliseconds)
 */
function showToast(message, type = 'info', duration = 3000) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation after a small delay to ensure DOM update
    setTimeout(() => {
        toast.classList.add('toast--visible');
    }, 10);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        
        // Remove element after animation completes
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * Fetches cities data from a JSON file
 * @returns {Promise<Array>} Array of city objects
 */
async function getCities() {
    try {
        const response = await fetch('data/locations.json');
        const data = await response.json();
        
        // Add image URLs to cities
        return data.cities.map(city => ({
            ...city,
            imageUrl: getCityImageUrl(city.nameEn || city.name)
        }));
    } catch (error) {
        console.error('Error fetching cities:', error);
        throw error;
    }
}

/**
 * Fetches neighborhoods data for a specific city
 * @param {string} cityId - ID of the city
 * @returns {Promise<Array>} Array of neighborhood objects
 */
async function getNeighborhoods(cityId) {
    try {
        const response = await fetch('data/locations.json');
        const data = await response.json();
        const city = data.cities.find(c => c.id === cityId);
        
        if (!city) {
            throw new Error('City not found');
        }
        
        // Add image URLs to neighborhoods
        return city.neighborhoods.map(neighborhood => ({
            ...neighborhood,
            imageUrl: getNeighborhoodImageUrl(city.nameEn, neighborhood.nameEn || neighborhood.name)
        }));
    } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        throw error;
    }
}

/**
 * Gets details for a specific neighborhood
 * @param {Object} neighborhood - The neighborhood object
 * @returns {Promise<Object>} Neighborhood details object
 */
async function getNeighborhoodDetails(neighborhood) {
    return getMockNeighborhoodDetails(neighborhood);
}

/**
 * Gets weather data for a location
 * @param {Object} location - The location object with lat/lng
 * @returns {Promise<Object>} Weather data object
 */
async function getWeatherData(location) {
    return getMockWeatherData(location);
}

/**
 * Gets nearby places for a location
 * @param {Object} location - The location object with lat/lng
 * @returns {Promise<Array>} Array of nearby places
 */
async function getNearbyPlaces(location) {
    return getMockNearbyPlaces(location);
}

/**
 * Creates mock neighborhood details
 * @param {Object} neighborhood - The neighborhood object
 * @returns {Object} Mock neighborhood details
 */
function getMockNeighborhoodDetails(neighborhood) {
    // Map city names to population ranges for realistic mock data
    const cityNameToPopulation = {
        'Riyadh': { min: 80000, max: 200000 },
        'Jeddah': { min: 70000, max: 180000 },
        'Dammam': { min: 50000, max: 120000 },
        'Makkah': { min: 60000, max: 150000 },
        'Medinah': { min: 50000, max: 120000 },
        'default': { min: 40000, max: 100000 }
    };
    
    // Extract city name from neighborhood name (simplified)
    const cityName = neighborhood.nameEn.split(' ')[0];
    const popRange = cityNameToPopulation[cityName] || cityNameToPopulation.default;
    
    // Generate random population within appropriate range
    const population = Math.floor(Math.random() * (popRange.max - popRange.min + 1)) + popRange.min;
    
    // Create mock data object
    return {
        id: neighborhood.id,
        name: neighborhood.name,
        nameEn: neighborhood.nameEn,
        description: getCityDescription(neighborhood),
        demographics: {
            population: population.toLocaleString(),
            density: Math.floor(population / 5).toLocaleString() + ' نسمة/كم²',
            avgAge: Math.floor(Math.random() * 10) + 25
        },
        amenities: {
            schools: Math.floor(Math.random() * 10) + 5,
            hospitals: Math.floor(Math.random() * 3) + 1,
            parks: Math.floor(Math.random() * 5) + 2,
            malls: Math.floor(Math.random() * 3) + 1
        },
        realEstate: {
            avgPrice: Math.floor(Math.random() * 1000000) + 500000 + ' ريال',
            priceChange: '+' + (Math.floor(Math.random() * 10) + 1) + '%',
            propertiesForSale: Math.floor(Math.random() * 100) + 50,
            propertiesForRent: Math.floor(Math.random() * 80) + 30
        }
    };
}

/**
 * Creates mock weather data
 * @param {Object} location - The location object
 * @returns {Object} Mock weather data
 */
function getMockWeatherData(location) {
    // Generate mock temperature and description
    const temp = Math.floor(Math.random() * 15) + 20;
    const descriptions = ['صافي', 'غائم جزئياً', 'غائم', 'غيوم متفرقة'];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Create mock weather data
    return {
        weather: [
            {
                description: description,
                icon: getWeatherIcon(description)
            }
        ],
        main: {
            temp: temp,
            feels_like: temp + Math.floor(Math.random() * 3),
            humidity: Math.floor(Math.random() * 30) + 30
        },
        wind: {
            speed: (Math.random() * 5).toFixed(1)
        }
    };
}

/**
 * Gets appropriate weather icon for a description
 * @param {string} description - Weather description
 * @returns {string} OpenWeatherMap icon code
 */
function getWeatherIcon(description) {
    const iconMap = {
        'صافي': '01d',
        'غائم جزئياً': '02d',
        'غائم': '03d',
        'غيوم متفرقة': '04d'
    };
    
    return iconMap[description] || '01d';
}

/**
 * Creates mock nearby places data
 * @param {Object} location - The location object
 * @returns {Array} Array of mock nearby places
 */
function getMockNearbyPlaces(location) {
    // Define place types and names for each type
    const placeTypes = ['restaurant', 'school', 'hospital', 'park', 'shopping_mall', 'mosque'];
    const restaurantNames = ['مطعم الشرق', 'بيتزا هت', 'مطعم البيك', 'برجر كينج', 'ستاربكس'];
    const schoolNames = ['مدرسة الأمل', 'مدرسة النور', 'مدرسة الرياض', 'المدرسة السعودية'];
    const hospitalNames = ['مستشفى المملكة', 'مستشفى الدكتور سليمان الحبيب', 'المستشفى السعودي الألماني'];
    const parkNames = ['حديقة الملك عبدالله', 'منتزه السلام', 'حديقة الأمير فيصل'];
    const mallNames = ['العثيم مول', 'النخيل مول', 'الرياض بارك', 'حياة مول'];
    const mosqueNames = ['مسجد الملك فهد', 'مسجد النور', 'مسجد التقوى', 'جامع الراجحي'];
    
    // Map place types to name arrays
    const namesByType = {
        'restaurant': restaurantNames,
        'school': schoolNames,
        'hospital': hospitalNames,
        'park': parkNames,
        'shopping_mall': mallNames,
        'mosque': mosqueNames
    };
    
    const places = [];
    
    // Generate random number of places between 6-10
    const numPlaces = Math.floor(Math.random() * 5) + 6;
    
    // Generate mock places
    for (let i = 0; i < numPlaces; i++) {
        const type = placeTypes[Math.floor(Math.random() * placeTypes.length)];
        const names = namesByType[type];
        const name = names[Math.floor(Math.random() * names.length)];
        
        places.push({
            id: `place-${i}`,
            name: name,
            type: type,
            distance: (Math.floor(Math.random() * 1000) + 100).toString()
        });
    }
    
    return places;
}

/**
 * Creates random description for a neighborhood
 * @param {Object} neighborhood - The neighborhood object
 * @returns {string} A description
 */
function getCityDescription(neighborhood) {
    const descriptions = [
        `يعتبر حي ${neighborhood.name} من الأحياء الحيوية في المدينة، ويتميز بموقعه الاستراتيجي وقربه من مراكز التسوق والخدمات الأساسية.`,
        `يقع حي ${neighborhood.name} في منطقة مميزة ويوفر بيئة سكنية هادئة مع سهولة الوصول إلى الخدمات الرئيسية والمرافق العامة.`,
        `يتميز حي ${neighborhood.name} بتنوع الخيارات السكنية والتجارية، ويعد وجهة مفضلة للعائلات الباحثة عن الاستقرار.`,
        `يشتهر حي ${neighborhood.name} بشوارعه الواسعة وتخطيطه العمراني المميز، مما يجعله خياراً مثالياً للسكن والاستثمار العقاري.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Gets image URL for a city
 * @param {string} cityName - English name of the city
 * @returns {string} Image URL
 */
function getCityImageUrl(cityName) {
    // Map of city names to image paths
    const cityImages = {
        'Riyadh': 'img/cities/riyadh.jpg',
        'Jeddah': 'img/cities/jeddah.jpg',
        'Dammam': 'img/cities/dammam.jpg',
        'Makkah': 'img/cities/makkah.jpg',
        'Medinah': 'img/cities/medinah.jpg',
        'Taif': 'img/cities/taif.jpg',
        'Abha': 'img/cities/abha.jpg'
    };
    
    // Return specific image if available, otherwise fallback
    if (cityImages[cityName]) {
        return cityImages[cityName];
    }
    
    return 'img/placeholder.jpg';
}

/**
 * Gets image URL for a neighborhood
 * @param {string} cityName - English name of the city
 * @param {string} neighborhoodName - English name of the neighborhood
 * @returns {string} Image URL
 */
function getNeighborhoodImageUrl(cityName, neighborhoodName) {
    // Map of neighborhood names to image paths
    const neighborhoodImages = {
        'Olaya': 'img/neighborhoods/olaya.jpg',
        'Al Malaz': 'img/neighborhoods/almalaz.jpg',
        'Al Wazarat': 'img/neighborhoods/alwazarat.jpg',
        'Al Worood': 'img/neighborhoods/alworood.jpg',
        'Al Naseem': 'img/neighborhoods/alnaseem.jpg',
        'Al Balad': 'img/neighborhoods/albalad.jpg',
        'Al Hamra': 'img/neighborhoods/alhamra.jpg'
    };
    
    // Return specific image if available, otherwise fallback
    if (neighborhoodImages[neighborhoodName]) {
        return neighborhoodImages[neighborhoodName];
    }
    
    return 'img/placeholder.jpg';
}