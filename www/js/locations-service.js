// www/js/locations-service.js
const API_KEY = 'AIzaSyDzluJAdmR0E6C6S4fu7MH9eL7JFtxr9wo';
const API_BASE_URL = 'https://real-estate-api.example.com/api';

export async function getCities() {
    try {
        // In a real implementation, this would be an API call
        // For now, we'll fetch from the local JSON file
        const response = await fetch('data/locations.json');
        const data = await response.json();
        
        // Add image URLs to each city
        return data.cities.map(city => ({
            ...city,
            imageUrl: getCityImageUrl(city.nameEn)
        }));
    } catch (error) {
        console.error('Error fetching cities:', error);
        throw error;
    }
}

export async function getNeighborhoods(cityId) {
    try {
        // In a real implementation, this would be an API call with cityId parameter
        const response = await fetch('data/locations.json');
        const data = await response.json();
        
        const city = data.cities.find(c => c.id === cityId);
        if (!city) return [];
        
        // Add image URLs to each neighborhood
        return city.neighborhoods.map(neighborhood => ({
            ...neighborhood,
            imageUrl: getNeighborhoodImageUrl(city.nameEn, neighborhood.nameEn)
        }));
    } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        throw error;
    }
}

export function getCityImageUrl(cityName) {
    // This would be a call to a real image API in production
    // Using a more specific and controlled image service
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${getPhotoReference(cityName)}&key=${API_KEY}`;
}

export function getNeighborhoodImageUrl(cityName, neighborhoodName) {
    // Similar to above but for neighborhoods
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${getPhotoReference(cityName + " " + neighborhoodName)}&key=${API_KEY}`;
}

// This function simulates getting a photo reference
// In a real implementation, this would be fetched from the Places API
function getPhotoReference(name) {
    // Creating a deterministic but seemingly random string based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return `photo_ref_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}