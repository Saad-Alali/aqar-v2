// Modified locations-service.js to handle API failures
import { getCurrentUser } from './auth-service.js';

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
        
        try {
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
            // Fallback to mock data when API fails
            console.warn('Error fetching neighborhood details from API, using fallback data:', error);
            return getMockNeighborhoodDetails(neighborhood);
        }
    } catch (error) {
        console.error('Error fetching neighborhood details:', error);
        throw error;
    }
}

export async function getWeatherData(location) {
    try {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&units=metric&appid=3b00f1c4ff5c5848f8fc0347b3835025&lang=${localStorage.getItem('aqar_language') || 'ar'}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            return await response.json();
        } catch (error) {
            // Fallback to mock weather data
            console.warn('Error fetching weather data, using fallback data:', error);
            return getMockWeatherData(location);
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

export async function getNearbyPlaces(location) {
    try {
        const currentLang = localStorage.getItem('aqar_language') || 'ar';
        
        try {
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
            // Fallback to mock data when API fails
            console.warn('Error fetching nearby places from API, using fallback data:', error);
            return getMockNearbyPlaces(location);
        }
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        throw error;
    }
}

// Mock data generators for fallback scenarios
function getMockNeighborhoodDetails(neighborhood) {
    const cityNameToPopulation = {
        'Riyadh': { min: 80000, max: 200000 },
        'Jeddah': { min: 70000, max: 180000 },
        'Dammam': { min: 50000, max: 120000 },
        'Makkah': { min: 60000, max: 150000 },
        'Medinah': { min: 50000, max: 120000 },
        'default': { min: 40000, max: 100000 }
    };
    
    const cityName = neighborhood.nameEn.split(' ')[0];
    const popRange = cityNameToPopulation[cityName] || cityNameToPopulation.default;
    const population = Math.floor(Math.random() * (popRange.max - popRange.min + 1)) + popRange.min;
    
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

function getMockWeatherData(location) {
    const temp = Math.floor(Math.random() * 15) + 20; // 20-35 degrees
    const descriptions = ['صافي', 'غائم جزئياً', 'غائم', 'غيوم متفرقة'];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
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

function getWeatherIcon(description) {
    const iconMap = {
        'صافي': '01d',
        'غائم جزئياً': '02d',
        'غائم': '03d',
        'غيوم متفرقة': '04d'
    };
    
    return iconMap[description] || '01d';
}

function getMockNearbyPlaces(location) {
    const placeTypes = ['restaurant', 'school', 'hospital', 'park', 'shopping_mall', 'mosque'];
    const restaurantNames = ['مطعم الشرق', 'بيتزا هت', 'مطعم البيك', 'برجر كينج', 'ستاربكس'];
    const schoolNames = ['مدرسة الأمل', 'مدرسة النور', 'مدرسة الرياض', 'المدرسة السعودية'];
    const hospitalNames = ['مستشفى المملكة', 'مستشفى الدكتور سليمان الحبيب', 'المستشفى السعودي الألماني'];
    const parkNames = ['حديقة الملك عبدالله', 'منتزه السلام', 'حديقة الأمير فيصل'];
    const mallNames = ['العثيم مول', 'النخيل مول', 'الرياض بارك', 'حياة مول'];
    const mosqueNames = ['مسجد الملك فهد', 'مسجد النور', 'مسجد التقوى', 'جامع الراجحي'];
    
    const namesByType = {
        'restaurant': restaurantNames,
        'school': schoolNames,
        'hospital': hospitalNames,
        'park': parkNames,
        'shopping_mall': mallNames,
        'mosque': mosqueNames
    };
    
    const places = [];
    
    // Generate 6-10 random places
    const numPlaces = Math.floor(Math.random() * 5) + 6;
    
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

function getCityDescription(neighborhood) {
    const descriptions = {
        'ar': [
            `يعتبر حي ${neighborhood.name} من الأحياء الحيوية في المدينة، ويتميز بموقعه الاستراتيجي وقربه من مراكز التسوق والخدمات الأساسية.`,
            `يقع حي ${neighborhood.name} في منطقة مميزة ويوفر بيئة سكنية هادئة مع سهولة الوصول إلى الخدمات الرئيسية والمرافق العامة.`,
            `يتميز حي ${neighborhood.name} بتنوع الخيارات السكنية والتجارية، ويعد وجهة مفضلة للعائلات الباحثة عن الاستقرار.`,
            `يشتهر حي ${neighborhood.name} بشوارعه الواسعة وتخطيطه العمراني المميز، مما يجعله خياراً مثالياً للسكن والاستثمار العقاري.`
        ],
        'en': [
            `${neighborhood.nameEn} is one of the vibrant neighborhoods in the city, characterized by its strategic location and proximity to shopping centers and essential services.`,
            `${neighborhood.nameEn} is located in a distinguished area and provides a quiet residential environment with easy access to main services and public facilities.`,
            `${neighborhood.nameEn} is characterized by a variety of residential and commercial options, and is a preferred destination for families looking for stability.`,
            `${neighborhood.nameEn} is known for its wide streets and distinctive urban planning, making it an ideal choice for housing and real estate investment.`
        ]
    };
    
    const currentLang = localStorage.getItem('aqar_language') || 'ar';
    const descArray = descriptions[currentLang] || descriptions.ar;
    
    return descArray[Math.floor(Math.random() * descArray.length)];
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
        'Abha': 'https://images.unsplash.com/photo-1582767604854-ac59ad28580d?q=80&w=1000'
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
        'Al Hamra': 'https://images.unsplash.com/photo-1591604122308-903ac45b38af?q=80&w=1000'
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