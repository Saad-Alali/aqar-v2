// www/js/explore-locations.js
import { getCities, getNeighborhoods, getWeatherData, getNearbyPlaces, getNeighborhoodDetails } from './locations-service.js';

let map;
let markers = [];
let currentCity = null;
let currentNeighborhood = null;
let neighborhoodDetails = null;

function initializeMap() {
    const saudiArabia = { lat: 24.7136, lng: 46.6753 };
    
    if (typeof google === 'undefined') {
        console.error('Google Maps API not loaded');
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#666;"><p>خريطة غير متاحة حالياً<br>تحقق من اتصالك بالإنترنت</p></div>';
        }
        loadCities();
        return;
    }
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: saudiArabia,
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    loadCities();
}

// Explicitly set the global initMap function to call our initialize function
window.initMap = initializeMap;

async function loadCities() {
    try {
        showLoading('cityGrid');
        const cities = await getCities();
        renderCities(cities);
        
        if (map) {
            addCityMarkers(cities);
        }
        
        hideLoading('cityGrid');
    } catch (error) {
        console.error('Error loading cities:', error);
        showToast('حدث خطأ في تحميل بيانات المدن', 'error');
        renderErrorState('cityGrid', 'لا يمكن تحميل المدن');
    }
}

function renderCities(cities) {
    const cityGrid = document.getElementById('cityGrid');
    
    if (!cityGrid || !cities) return;
    
    cityGrid.innerHTML = '';
    
    if (cities.length === 0) {
        cityGrid.innerHTML = '<div class="text-center py-5">لا توجد مدن متاحة</div>';
        return;
    }
    
    cities.forEach(city => {
        const cityCard = createCityCard(city);
        cityGrid.appendChild(cityCard);
    });
}

function createCityCard(city) {
    const card = document.createElement('div');
    card.className = 'city-card';
    card.dataset.cityId = city.id;
    
    const imageUrl = city.imageUrl || 'img/placeholder.jpg';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${city.name}" class="city-card__image">
        <div class="city-card__overlay">
            <div class="city-card__name">${city.name}</div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        selectCity(city);
    });
    
    return card;
}

function selectCity(city) {
    currentCity = city;
    currentNeighborhood = null;
    
    document.getElementById('cityGrid').parentElement.style.display = 'none';
    const neighborhoodsSection = document.getElementById('neighborhoodsSection');
    neighborhoodsSection.style.display = 'block';
    
    document.getElementById('selectedCityTitle').textContent = `أحياء ${city.name}`;
    
    if (map) {
        map.setCenter({ lat: city.lat, lng: city.lng });
        map.setZoom(12);
        clearMarkers();
    }
    
    loadNeighborhoods(city.id);
}

async function loadNeighborhoods(cityId) {
    try {
        showLoading('neighborhoodGrid');
        const neighborhoods = await getNeighborhoods(cityId);
        renderNeighborhoods(neighborhoods);
        
        if (map) {
            addNeighborhoodMarkers(neighborhoods);
        }
        
        hideLoading('neighborhoodGrid');
    } catch (error) {
        console.error('Error loading neighborhoods:', error);
        showToast('حدث خطأ في تحميل بيانات الأحياء', 'error');
        renderErrorState('neighborhoodGrid', 'لا يمكن تحميل الأحياء');
    }
}

function renderNeighborhoods(neighborhoods) {
    const neighborhoodGrid = document.getElementById('neighborhoodGrid');
    
    if (!neighborhoodGrid || !neighborhoods) return;
    
    neighborhoodGrid.innerHTML = '';
    
    if (neighborhoods.length === 0) {
        neighborhoodGrid.innerHTML = '<div class="text-center py-5">لا توجد أحياء متاحة</div>';
        return;
    }
    
    neighborhoods.forEach(neighborhood => {
        const neighborhoodCard = createNeighborhoodCard(neighborhood);
        neighborhoodGrid.appendChild(neighborhoodCard);
    });
}

function createNeighborhoodCard(neighborhood) {
    const card = document.createElement('div');
    card.className = 'neighborhood-card';
    card.dataset.neighborhoodId = neighborhood.id;
    
    const imageUrl = neighborhood.imageUrl || 'img/placeholder.jpg';
    
    card.innerHTML = `
        <div class="neighborhood-card__image-container">
            <img src="${imageUrl}" alt="${neighborhood.name}" class="neighborhood-card__image">
            <div class="neighborhood-card__overlay">
                <div class="neighborhood-card__name">${neighborhood.name}</div>
                <div class="neighborhood-card__info">
                    <i class="fas fa-info-circle"></i>
                    عرض المعلومات
                </div>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        selectNeighborhood(neighborhood);
    });
    
    return card;
}

async function selectNeighborhood(neighborhood) {
    currentNeighborhood = neighborhood;
    
    document.getElementById('neighborhoodsSection').style.display = 'none';
    const neighborhoodInfo = document.getElementById('neighborhoodInfo');
    neighborhoodInfo.style.display = 'block';
    
    document.getElementById('selectedNeighborhoodTitle').textContent = `حي ${neighborhood.name}`;
    
    if (map) {
        map.setCenter({ lat: neighborhood.lat, lng: neighborhood.lng });
        map.setZoom(15);
    }
    
    await Promise.all([
        loadNeighborhoodDetails(neighborhood),
        loadWeatherData(neighborhood),
        loadNearbyPlaces(neighborhood)
    ]);
}

async function loadNeighborhoodDetails(neighborhood) {
    try {
        let demographicsCard = document.querySelector('.demographics-card');
        
        if (!demographicsCard) {
            const neighborhoodDetails = document.querySelector('.neighborhood-details');
            
            if (neighborhoodDetails) {
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
            demographicsInfo.innerHTML = `
                <div class="weather-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    جاري تحميل معلومات الحي...
                </div>
            `;
            
            try {
                const details = await getNeighborhoodDetails(neighborhood);
                
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

async function loadWeatherData(neighborhood) {
    const weatherInfo = document.getElementById('weatherInfo');
    
    if (!weatherInfo) return;
    
    weatherInfo.innerHTML = `
        <div class="weather-loading">
            <i class="fas fa-spinner fa-spin"></i>
            جاري تحميل معلومات الطقس...
        </div>
    `;
    
    try {
        const weatherData = await getWeatherData(neighborhood);
        displayWeatherData(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherInfo.innerHTML = '<div class="text-center">لا يمكن تحميل معلومات الطقس</div>';
    }
}

function displayWeatherData(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    
    if (!weatherInfo) return;
    
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const feelsLike = Math.round(data.main.feels_like);
    
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

async function loadNearbyPlaces(neighborhood) {
    const nearbyInfo = document.getElementById('nearbyInfo');
    
    if (!nearbyInfo) return;
    
    nearbyInfo.innerHTML = `
        <div class="nearby-loading">
            <i class="fas fa-spinner fa-spin"></i>
            جاري تحميل المرافق القريبة...
        </div>
    `;
    
    try {
        const places = await getNearbyPlaces(neighborhood);
        displayNearbyPlaces(places);
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        nearbyInfo.innerHTML = `<div class="text-center">لا يمكن تحميل المرافق القريبة</div>`;
    }
}

function displayNearbyPlaces(places) {
    const nearbyInfo = document.getElementById('nearbyInfo');
    
    if (!nearbyInfo) return;
    
    if (!places || places.length === 0) {
        nearbyInfo.innerHTML = `<div class="text-center">لا توجد مرافق قريبة</div>`;
        return;
    }
    
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

function addCityMarkers(cities) {
    if (!map || !cities) return;
    
    cities.forEach(city => {
        const markerPosition = { lat: city.lat, lng: city.lng };
        
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
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <div class="map-info-title">${city.name}</div>
                    <div class="map-info-subtitle">${city.neighborhoods ? city.neighborhoods.length : 0} أحياء</div>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            markers.forEach(m => {
                if (m.infoWindow && m.infoWindow.getMap()) {
                    m.infoWindow.close();
                }
            });
            
            infoWindow.open(map, marker);
            selectCity(city);
        });
        
        marker.infoWindow = infoWindow;
        markers.push(marker);
    });
}

function addNeighborhoodMarkers(neighborhoods) {
    if (!map || !neighborhoods) return;
    
    neighborhoods.forEach(neighborhood => {
        const markerPosition = { lat: neighborhood.lat, lng: neighborhood.lng };
        
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
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <div class="map-info-title">${neighborhood.name}</div>
                    <div class="map-info-subtitle">${currentCity ? currentCity.name : ''}</div>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            markers.forEach(m => {
                if (m.infoWindow && m.infoWindow.getMap()) {
                    m.infoWindow.close();
                }
            });
            
            infoWindow.open(map, marker);
            selectNeighborhood(neighborhood);
        });
        
        marker.infoWindow = infoWindow;
        markers.push(marker);
    });
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    
    markers = [];
}

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

function hideLoading(containerId) {
    // This function doesn't need to do anything as the container will be
    // populated with content when data is loaded
}

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

document.addEventListener('DOMContentLoaded', function() {
    // No need to initialize here as we've explicitly exposed initMap globally
    // and it will be called by the Google Maps API when it loads
    
    const backToCitiesBtn = document.getElementById('backToCities');
    if (backToCitiesBtn) {
        backToCitiesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.getElementById('neighborhoodsSection').style.display = 'none';
            document.getElementById('cityGrid').parentElement.style.display = 'block';
            
            if (map) {
                map.setCenter({ lat: 24.7136, lng: 46.6753 });
                map.setZoom(6);
                clearMarkers();
            }
            
            loadCities();
            
            currentCity = null;
        });
    }
    
    const backToNeighborhoodsBtn = document.getElementById('backToNeighborhoods');
    if (backToNeighborhoodsBtn) {
        backToNeighborhoodsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.getElementById('neighborhoodInfo').style.display = 'none';
            document.getElementById('neighborhoodsSection').style.display = 'block';
            
            if (currentCity) {
                if (map) {
                    map.setCenter({ lat: currentCity.lat, lng: currentCity.lng });
                    map.setZoom(12);
                    clearMarkers();
                }
                
                loadNeighborhoods(currentCity.id);
            }
            
            currentNeighborhood = null;
        });
    }
    
    // Check if the map already has content
    const mapElement = document.getElementById('map');
    if (mapElement && mapElement.innerHTML === '') {
        mapElement.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#666;"><p>جاري تحميل الخريطة...</p></div>';
    }
    
    // If Google Maps API is already loaded, initialize the map
    if (typeof google !== 'undefined' && google.maps) {
        initializeMap();
    }
    
    // If Google Maps failed to load, still load cities
    if (mapElement && !mapElement.querySelector('.gm-style')) {
        loadCities();
    }
});

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
    
    setTimeout(() => {
        toast.classList.add('toast--visible');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}