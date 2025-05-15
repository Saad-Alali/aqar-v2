import { initializeJsonService, dataCache } from './json-service.js';

export async function getAllProperties() {
  try {
    await initializeJsonService();
    return dataCache.properties;
  } catch (error) {
    console.error("Error getting all properties:", error);
    return [];
  }
}

export async function getProperty(propertyId) {
  try {
    await initializeJsonService();
    
    const property = dataCache.properties.find(p => p.id === propertyId);
    
    if (!property) {
      throw new Error("العقار غير موجود");
    }
    
    return property;
  } catch (error) {
    console.error("Error getting property:", error);
    throw error;
  }
}

export async function searchProperties(query) {
  try {
    await initializeJsonService();
    
    if (!query) {
      return dataCache.properties;
    }
    
    const normalizedQuery = query.toLowerCase();
    
    return dataCache.properties.filter(property => {
      const searchText = `${property.title} ${property.location} ${property.description}`.toLowerCase();
      return searchText.includes(normalizedQuery);
    });
  } catch (error) {
    console.error("Error searching properties:", error);
    return [];
  }
}

export async function filterProperties(filters) {
  try {
    await initializeJsonService();
    
    let filtered = [...dataCache.properties];
    
    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType);
    }
    
    if (filters.transactionType) {
      filtered = filtered.filter(p => p.transactionType === filters.transactionType);
    }
    
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= filters.minPrice);
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice);
    }
    
    if (filters.minBedrooms) {
      filtered = filtered.filter(p => p.features && p.features.bedrooms >= filters.minBedrooms);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'date-newest':
          filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
          break;
        case 'date-oldest':
          filtered.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
          break;
      }
    }
    
    return filtered;
  } catch (error) {
    console.error("Error filtering properties:", error);
    return [];
  }
}