// www/js/locations-service.js
const API_KEY = 'AIzaSyDzluJAdmR0E6C6S4fu7MH9eL7JFtxr9wo';
let citiesCache = null;

/**
 * Get all cities from local storage or fetch from API if not available
 * @returns {Promise<Array>} Array of cities with their data
 */
export async function getCities() {
    try {
        // Check if we already have the cities in cache
        if (citiesCache) {
            return citiesCache;
        }
        
        // Try to get cities from localStorage first
        const storedCities = localStorage.getItem('aqar_cities');
        if (storedCities) {
            try {
                citiesCache = JSON.parse(storedCities);
                return addImageUrlsToCities(citiesCache);
            } catch (error) {
                console.error('Error parsing stored cities:', error);
            }
        }
        
        // If not in localStorage, fetch from API or fallback to local file
        try {
            const response = await fetch('https://saudicitiesmicroservice.azurewebsites.net/api/cities', {
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
            
            // Store in localStorage for future use
            localStorage.setItem('aqar_cities', JSON.stringify(data.cities));
            citiesCache = data.cities;
            
            return addImageUrlsToCities(data.cities);
        } catch (error) {
            console.warn('Error fetching from API, falling back to local data:', error);
            // Fallback to local JSON file
            const response = await fetch('data/locations.json');
            const data = await response.json();
            
            // Store in localStorage for future use
            localStorage.setItem('aqar_cities', JSON.stringify(data.cities));
            citiesCache = data.cities;
            
            return addImageUrlsToCities(data.cities);
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
        throw error;
    }
}

/**
 * Get neighborhoods for a specific city
 * @param {string} cityId - The city ID
 * @returns {Promise<Array>} Array of neighborhoods
 */
export async function getNeighborhoods(cityId) {
    try {
        const cities = await getCities();
        const city = cities.find(c => c.id === cityId);
        
        if (!city) {
            throw new Error('City not found');
        }
        
        try {
            // Try to fetch from API first
            const response = await fetch(`https://saudicitiesmicroservice.azurewebsites.net/api/neighborhoods/${cityId}`, {
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
            // Fallback to local data
            return addImageUrlsToNeighborhoods(city.nameEn, city.neighborhoods);
        }
    } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        throw error;
    }
}

/**
 * Get additional information about a neighborhood
 * @param {Object} neighborhood - The neighborhood object
 * @returns {Promise<Object>} Enhanced neighborhood data
 */
export async function getNeighborhoodDetails(neighborhood) {
    try {
        // Try to fetch from API first
        try {
            const response = await fetch(`https://saudicitiesmicroservice.azurewebsites.net/api/neighborhood-details/${neighborhood.id}`, {
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
            console.warn('Error fetching from API, generating mock data:', error);
            // Generate mock data based on neighborhood
            return {
                demographics: {
                    population: Math.floor(50000 + Math.random() * 100000),
                    density: Math.floor(1000 + Math.random() * 5000) + " شخص/كم²",
                    avgAge: Math.floor(25 + Math.random() * 15)
                },
                amenities: {
                    schools: Math.floor(3 + Math.random() * 10),
                    hospitals: Math.floor(1 + Math.random() * 3),
                    parks: Math.floor(2 + Math.random() * 5),
                    malls: Math.floor(1 + Math.random() * 3)
                },
                realEstate: {
                    avgPrice: Math.floor(500000 + Math.random() * 1500000) + " ريال",
                    priceChange: (Math.random() * 10 - 5).toFixed(1) + "%",
                    propertiesForSale: Math.floor(50 + Math.random() * 200),
                    propertiesForRent: Math.floor(20 + Math.random() * 100)
                },
                description: getNeighborhoodDescription(neighborhood.name)
            };
        }
    } catch (error) {
        console.error('Error fetching neighborhood details:', error);
        throw error;
    }
}

/**
 * Get weather data for a location
 * @param {Object} location - Object with lat and lng properties
 * @returns {Promise<Object>} Weather data
 */
export async function getWeatherData(location) {
    try {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&units=metric&appid=3b00f1c4ff5c5848f8fc0347b3835025`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            return await response.json();
        } catch (error) {
            console.warn('Error fetching weather data, generating mock data:', error);
            // Generate mock weather data based on location
            return getMockWeatherData(location);
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

/**
 * Get nearby places for a location
 * @param {Object} location - Object with lat and lng properties
 * @returns {Promise<Array>} Array of nearby places
 */
export async function getNearbyPlaces(location) {
    try {
        try {
            const response = await fetch(`https://saudicitiesmicroservice.azurewebsites.net/api/nearby-places?lat=${location.lat}&lng=${location.lng}`, {
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
            console.warn('Error fetching nearby places, generating mock data:', error);
            // Generate mock nearby places
            return getMockNearbyPlaces(location);
        }
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        throw error;
    }
}

// Helper functions

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
    // Use specific images for main cities, fallback to pattern for others
    const cityImages = {
        'Riyadh': 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?q=80&w=1000',
        'Jeddah': 'https://images.unsplash.com/photo-1572551878418-3b3077fdc52d?q=80&w=1000',
        'Dammam': 'https://images.unsplash.com/photo-1578895101408-1a6332f6dde1?q=80&w=1000',
        'Makkah': 'https://images.unsplash.com/photo-1591604129939-f1efa21757e2?q=80&w=1000',
        'Medinah': 'https://images.unsplash.com/photo-1591604075080-4af55c1ff8b8?q=80&w=1000'
    };
    
    return cityImages[cityName] || `https://source.unsplash.com/1000x600/?saudi,${cityName},city`;
}

export function getNeighborhoodImageUrl(cityName, neighborhoodName) {
    return `https://source.unsplash.com/1000x600/?saudi,${cityName},${neighborhoodName},neighborhood`;
}

function getMockWeatherData(location) {
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

function getMockNearbyPlaces(location) {
    const seed = location.lat + location.lng;
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
    
    const count = 5 + Math.floor(rng.random() * 5);
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

function getNeighborhoodDescription(name) {
    const descriptions = [
        `يُعد حي ${name} من أرقى الأحياء السكنية في المدينة، حيث يتميز بمساحاته الخضراء الواسعة والمباني الفاخرة والشوارع النظيفة. تتوفر فيه خدمات متكاملة من مدارس ومستشفيات ومراكز تسوق وأماكن ترفيهية.`,
        `يتميز حي ${name} بموقعه الاستراتيجي في قلب المدينة، حيث يسهل الوصول منه إلى جميع المناطق الحيوية. يعتبر من الأحياء التجارية النشطة، ويضم العديد من المطاعم والمقاهي والمحلات التجارية.`,
        `يُعتبر حي ${name} من الأحياء الهادئة والمناسبة للعائلات، حيث يتميز بوجود المدارس والحدائق والمراكز الصحية. كما يتميز بأسعاره المعقولة مقارنة بالأحياء المجاورة.`,
        `حي ${name} من الأحياء الحديثة والمتطورة، حيث يضم مجموعة من الفلل والشقق الفاخرة. تتوفر فيه جميع الخدمات الأساسية، بالإضافة إلى قربه من الطرق الرئيسية والمناطق الترفيهية.`
    ];
    
    // Use the hash of the name to deterministically select a description
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    
    const index = Math.abs(hash) % descriptions.length;
    return descriptions[index];
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