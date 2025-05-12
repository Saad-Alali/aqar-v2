let map;
let markers = [];
let locationsData = null;
let currentCity = null;
let currentNeighborhood = null;
const googleApiKey = 'AIzaSyDzluJAdmR0E6C6S4fu7MH9eL7JFtxr9wo';

window.initMap = function() {
    const saudiArabia = { lat: 24.7136, lng: 46.6753 };
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
    
    loadLocationsData();
};

async function loadLocationsData() {
    try {
        const response = await fetch('data/locations.json');
        locationsData = await response.json();
        
        renderCities();
        addCityMarkers();
    } catch (error) {
        console.error('Error loading locations data:', error);
        showToast('حدث خطأ في تحميل بيانات المواقع', 'error');
    }
}

function renderCities() {
    const cityGrid = document.getElementById('cityGrid');
    
    if (!cityGrid || !locationsData || !locationsData.cities) return;
    
    cityGrid.innerHTML = '';
    
    locationsData.cities.forEach(city => {
        const cityCard = createCityCard(city);
        cityGrid.appendChild(cityCard);
    });
}

function createCityCard(city) {
    const card = document.createElement('div');
    card.className = 'city-card';
    card.dataset.cityId = city.id;
    
    const imageUrl = `https://source.unsplash.com/300x200/?${city.nameEn.toLowerCase()},city`;
    
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
    
    document.getElementById('cityGrid').parentElement.style.display = 'none';
    const neighborhoodsSection = document.getElementById('neighborhoodsSection');
    neighborhoodsSection.style.display = 'block';
    
    document.getElementById('selectedCityTitle').textContent = `أحياء ${city.name}`;
    
    map.setCenter({ lat: city.lat, lng: city.lng });
    map.setZoom(12);
    
    clearMarkers();
    addNeighborhoodMarkers(city);
    
    renderNeighborhoods(city);
}

function renderNeighborhoods(city) {
    const neighborhoodGrid = document.getElementById('neighborhoodGrid');
    
    if (!neighborhoodGrid || !city.neighborhoods) return;
    
    neighborhoodGrid.innerHTML = '';
    
    city.neighborhoods.forEach(neighborhood => {
        const neighborhoodCard = createNeighborhoodCard(neighborhood);
        neighborhoodGrid.appendChild(neighborhoodCard);
    });
}

function createNeighborhoodCard(neighborhood) {
    const card = document.createElement('div');
    card.className = 'neighborhood-card';
    card.dataset.neighborhoodId = neighborhood.id;
    
    const imageUrl = `https://source.unsplash.com/300x200/?${neighborhood.nameEn.toLowerCase()},neighborhood`;
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${neighborhood.name}" class="neighborhood-card__image">
        <div class="neighborhood-card__overlay">
            <div class="neighborhood-card__name">${neighborhood.name}</div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        selectNeighborhood(neighborhood);
    });
    
    return card;
}

function selectNeighborhood(neighborhood) {
    currentNeighborhood = neighborhood;
    
    document.getElementById('neighborhoodsSection').style.display = 'none';
    const neighborhoodInfo = document.getElementById('neighborhoodInfo');
    neighborhoodInfo.style.display = 'block';
    
    document.getElementById('selectedNeighborhoodTitle').textContent = `حي ${neighborhood.name}`;
    
    map.setCenter({ lat: neighborhood.lat, lng: neighborhood.lng });
    map.setZoom(15);
    
    getWeatherData(neighborhood);
    getNearbyPlaces(neighborhood);
}

function addCityMarkers() {
    if (!locationsData || !locationsData.cities) return;
    
    locationsData.cities.forEach(city => {
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

function addNeighborhoodMarkers(city) {
    if (!city || !city.neighborhoods) return;
    
    city.neighborhoods.forEach(neighborhood => {
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
                    <div class="map-info-subtitle">${city.name}</div>
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

async function getWeatherData(neighborhood) {
    const weatherInfo = document.getElementById('weatherInfo');
    
    if (!weatherInfo) return;
    
    weatherInfo.innerHTML = `
        <div class="weather-loading">
            <i class="fas fa-spinner fa-spin"></i>
            جاري تحميل معلومات الطقس...
        </div>
    `;
    
    try {
        setTimeout(() => {
            const mockWeather = getMockWeatherData(neighborhood);
            displayWeatherData(mockWeather);
        }, 1000);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherInfo.innerHTML = '<div class="text-center">حدث خطأ في تحميل معلومات الطقس</div>';
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

async function getNearbyPlaces(neighborhood) {
    const nearbyInfo = document.getElementById('nearbyInfo');
    
    if (!nearbyInfo) return;
    
    nearbyInfo.innerHTML = `
        <div class="nearby-loading">
            <i class="fas fa-spinner fa-spin"></i>
            جاري تحميل المرافق القريبة...
        </div>
    `;
    
    try {
        setTimeout(() => {
            const mockPlaces = getMockNearbyPlaces(neighborhood);
            displayNearbyPlaces(mockPlaces);
        }, 1500);
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

function getMockWeatherData(neighborhood) {
    const temp = 20 + Math.floor(Math.random() * 20);
    const feelsLike = temp + (Math.random() > 0.5 ? 2 : -2);
    
    let icon, description;
    if (temp > 35) {
        icon = '01d';
        description = 'صافي';
    } else if (temp > 30) {
        icon = '02d';
        description = 'غائم جزئياً';
    } else if (temp > 25) {
        icon = '03d';
        description = 'غائم';
    } else {
        icon = '04d';
        description = 'غائم كلياً';
    }
    
    const humidity = 30 + Math.floor(Math.random() * 40);
    const windSpeed = 1 + Math.floor(Math.random() * 5);
    
    return {
        main: {
            temp: temp,
            feels_like: feelsLike,
            humidity: humidity
        },
        weather: [
            {
                description: description,
                icon: icon
            }
        ],
        wind: {
            speed: windSpeed
        }
    };
}

function getMockNearbyPlaces(neighborhood) {
    const seed = neighborhood.lat + neighborhood.lng;
    const rng = new PseudoRNG(seed);
    
    const placeTypes = ['restaurant', 'school', 'hospital', 'park', 'shopping_mall', 'mosque'];
    const placeNames = {
        restaurant: ['مطعم السلطان', 'مطعم الريف', 'مطعم البيت', 'مطعم الشرق', 'كافيه لاتيه'],
        school: ['مدرسة الأمل', 'مدرسة النور', 'مدرسة المستقبل', 'مدرسة الرواد'],
        hospital: ['مستشفى السلام', 'مركز الصحة', 'مستشفى الشفاء', 'عيادة الرعاية'],
        park: ['حديقة الأمير', 'منتزه الزهور', 'حديقة الملك فهد', 'الحديقة المركزية'],
        shopping_mall: ['مول الحياة', 'مركز التسوق', 'مجمع العرب', 'العثيم مول'],
        mosque: ['جامع الملك فهد', 'مسجد النور', 'مسجد السلام', 'جامع الإمام محمد']
    };
    
    const count = 3 + Math.floor(rng.random() * 3);
    const places = [];
    
    for (let i = 0; i < count; i++) {
        const typeIndex = Math.floor(rng.random() * placeTypes.length);
        const type = placeTypes[typeIndex];
        
        const nameIndex = Math.floor(rng.random() * placeNames[type].length);
        const name = placeNames[type][nameIndex];
        
        const distance = 100 + Math.floor(rng.random() * 900);
        
        places.push({
            name: name,
            type: type,
            distance: distance
        });
    }
    
    return places.sort((a, b) => a.distance - b.distance);
}

class PseudoRNG {
    constructor(seed) {
        this.seed = seed;
    }
    
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const backToCitiesBtn = document.getElementById('backToCities');
    if (backToCitiesBtn) {
        backToCitiesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.getElementById('neighborhoodsSection').style.display = 'none';
            document.getElementById('cityGrid').parentElement.style.display = 'block';
            
            map.setCenter({ lat: 24.7136, lng: 46.6753 });
            map.setZoom(6);
            
            clearMarkers();
            addCityMarkers();
            
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
                map.setCenter({ lat: currentCity.lat, lng: currentCity.lng });
                map.setZoom(12);
                
                clearMarkers();
                addNeighborhoodMarkers(currentCity);
            }
            
            currentNeighborhood = null;
        });
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