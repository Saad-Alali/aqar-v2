// www/js/locations-service.js
const API_KEY = 'AIzaSyDzluJAdmR0E6C6S4fu7MH9eL7JFtxr9wo';
let citiesCache = null;

export async function getCities() {
    try {
        if (citiesCache) {
            return citiesCache;
        }
        
        const storedCities = localStorage.getItem('aqar_cities');
        if (storedCities) {
            try {
                citiesCache = JSON.parse(storedCities);
                return addImageUrlsToCities(citiesCache);
            } catch (error) {
                console.error('Error parsing stored cities:', error);
            }
        }
        
        const currentLang = localStorage.getItem('aqar_language') || 'ar';
        
        try {
            const response = await fetch(`https://saudicitiesmicroservice.azurewebsites.net/api/cities?lang=${currentLang}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'aqar123456'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch cities from API');
            }
            
            const data = await response.json();
            
            localStorage.setItem('aqar_cities', JSON.stringify(data.cities));
            citiesCache = data.cities;
            
            return addImageUrlsToCities(data.cities);
        } catch (error) {
            console.warn('Error fetching from API, falling back to local data:', error);
            const response = await fetch('data/locations.json');
            const data = await response.json();
            
            localStorage.setItem('aqar_cities', JSON.stringify(data.cities));
            citiesCache = data.cities;
            
            return addImageUrlsToCities(data.cities);
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
        throw error;
    }
}

export async function getNeighborhoods(cityId) {
    try {
        const cities = await getCities();
        const city = cities.find(c => c.id === cityId);
        
        if (!city) {
            throw new Error('City not found');
        }
        
        const currentLang = localStorage.getItem('aqar_language') || 'ar';
        
        try {
            const response = await fetch(`https://saudicitiesmicroservice.azurewebsites.net/api/neighborhoods/${cityId}?lang=${currentLang}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'aqar123456'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch neighborhoods from API');
            }
            
            const data = await response.json();
            return addImageUrlsToNeighborhoods(city.nameEn, data.neighborhoods);
        } catch (error) {
            console.warn('Error fetching from API, falling back to local data:', error);
            return addImageUrlsToNeighborhoods(city.nameEn, city.neighborhoods);
        }
    } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        throw error;
    }
}

export async function getNeighborhoodDetails(neighborhood) {
    try {
        const currentLang = localStorage.getItem('aqar_language') || 'ar';
        
        const response = await fetch(`https://saudicitiesmicroservice.azurewebsites.net/api/neighborhood-details/${neighborhood.id}?lang=${currentLang}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'aqar123456'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch neighborhood details from API');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching neighborhood details:', error);
        throw error;
    }
}

export async function getWeatherData(location) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&units=metric&appid=3b00f1c4ff5c5848f8fc0347b3835025&lang=${localStorage.getItem('aqar_language') || 'ar'}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

export async function getNearbyPlaces(location) {
    try {
        const currentLang = localStorage.getItem('aqar_language') || 'ar';
        
        const response = await fetch(`https://saudicitiesmicroservice.azurewebsites.net/api/nearby-places?lat=${location.lat}&lng=${location.lng}&lang=${currentLang}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'aqar123456'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch nearby places');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        throw error;
    }
}

function addImageUrlsToCities(cities) {
    return cities.map(city => ({
        ...city,
        imageUrl: getCityImageUrl(city.nameEn || city.name)
    }));
}

function addImageUrlsToNeighborhoods(cityName, neighborhoods) {
    return neighborhoods.map(neighborhood => ({
        ...neighborhood,
        imageUrl: getNeighborhoodImageUrl(cityName, neighborhood.nameEn || neighborhood.name)
    }));
}

export function getCityImageUrl(cityName) {
    const cityImages = {
        'Riyadh': 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?q=80&w=1000',
        'Jeddah': 'https://images.unsplash.com/photo-1572551878418-3b3077fdc52d?q=80&w=1000',
        'Dammam': 'https://images.unsplash.com/photo-1578895101408-1a6332f6dde1?q=80&w=1000',
        'Makkah': 'https://images.unsplash.com/photo-1591604129939-f1efa21757e2?q=80&w=1000',
        'Medinah': 'https://images.unsplash.com/photo-1591604075080-4af55c1ff8b8?q=80&w=1000',
        'Taif': 'https://images.unsplash.com/photo-1560611588-163f9968c0c4?q=80&w=1000',
        'Abha': 'https://images.unsplash.com/photo-1582767604854-ac59ad28580d?q=80&w=1000',
        'Tabuk': 'https://images.unsplash.com/photo-1566827786812-c3894ca0ac49?q=80&w=1000',
        'Khobar': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000',
        'Qatif': 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000',
        'Jubail': 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?q=80&w=1000',
        'Hafar Al-Batin': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?q=80&w=1000',
        'Hail': 'https://images.unsplash.com/photo-1590076215667-875caa73c859?q=80&w=1000',
        'Najran': 'https://images.unsplash.com/photo-1566050790861-e15790633bd6?q=80&w=1000',
        'Jazan': 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=1000'
    };
    
    if (cityImages[cityName]) {
        return cityImages[cityName];
    }
    
    const fallbackCityImages = [
        'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=1000',
        'https://images.unsplash.com/photo-1547636780-e41778614c28?q=80&w=1000',
        'https://images.unsplash.com/photo-1495562569060-2eec283d3391?q=80&w=1000',
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1000',
        'https://images.unsplash.com/photo-1593604572577-1c6c44fa2804?q=80&w=1000'
    ];
    
    const hashCode = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return fallbackCityImages[hashCode % fallbackCityImages.length];
}

export function getNeighborhoodImageUrl(cityName, neighborhoodName) {
    const neighborhoodImages = {
        'Olaya': 'https://images.unsplash.com/photo-1597659840241-37e4d3fc858e?q=80&w=1000',
        'Al Malaz': 'https://images.unsplash.com/photo-1554607422-a8e46783d79b?q=80&w=1000',
        'Al Wazarat': 'https://images.unsplash.com/photo-1583608354517-0ea5a38817b2?q=80&w=1000',
        'Al Worood': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000',
        'Al Naseem': 'https://images.unsplash.com/photo-1531971085969-61e234323f57?q=80&w=1000',
        'Al Balad': 'https://images.unsplash.com/photo-1587979830976-a131b318da0a?q=80&w=1000',
        'Al Hamra': 'https://images.unsplash.com/photo-1591604122308-903ac45b38af?q=80&w=1000',
        'Al Salamah': 'https://images.unsplash.com/photo-1533267625677-ce5e7eedffd3?q=80&w=1000',
        'Al Rawdah': 'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?q=80&w=1000',
        'King Abdullah': 'https://images.unsplash.com/photo-1619450513815-ad5698a03203?q=80&w=1000',
        'Al Aziziyah': 'https://images.unsplash.com/photo-1560611588-163f9968c0c4?q=80&w=1000',
        'Quba': 'https://images.unsplash.com/photo-1591604075080-4af55c1ff8b8?q=80&w=1000'
    };
    
    if (neighborhoodImages[neighborhoodName]) {
        return neighborhoodImages[neighborhoodName];
    }
    
    const fallbackNeighborhoodImages = [
        'https://images.unsplash.com/photo-1502301197179-65228ab57f78?q=80&w=1000',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1000',
        'https://images.unsplash.com/photo-1549517045-bc93de075e53?q=80&w=1000',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
        'https://images.unsplash.com/photo-1592595896551-12b371d546d5?q=80&w=1000',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1000',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1000'
    ];
    
    const hashCode = (cityName + neighborhoodName).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return fallbackNeighborhoodImages[hashCode % fallbackNeighborhoodImages.length];
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