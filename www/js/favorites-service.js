// favorites-service.js - Enhanced with better error handling and management functions
import { initializeJsonService, dataCache, saveToLocalStorage } from './json-service.js';

/**
 * Get all favorites for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of favorite properties
 */
export async function getUserFavorites(userId) {
  try {
    await initializeJsonService();
    
    const user = dataCache.users.find(u => u.id === userId);
    
    if (!user) {
      return [];
    }
    
    const favoriteIds = user.favorites || [];
    
    if (favoriteIds.length === 0) {
      return [];
    }
    
    const properties = dataCache.properties.filter(p => favoriteIds.includes(p.id));
    
    return properties;
  } catch (error) {
    console.error("Error getting user favorites:", error);
    return [];
  }
}

/**
 * Add a property to user's favorites
 * @param {string} userId - The user ID
 * @param {string} propertyId - The property ID
 * @returns {Promise<boolean>} Success status
 */
export async function addToFavorites(userId, propertyId) {
  try {
    await initializeJsonService();
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return false;
    }
    
    const user = dataCache.users[userIndex];
    const favorites = [...(user.favorites || [])];
    
    if (!favorites.includes(propertyId)) {
      favorites.push(propertyId);
      
      dataCache.users[userIndex].favorites = favorites;
      
      // Save to localStorage
      saveToLocalStorage();
    }
    
    return true;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return false;
  }
}

/**
 * Remove a property from user's favorites
 * @param {string} userId - The user ID
 * @param {string} propertyId - The property ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeFromFavorites(userId, propertyId) {
  try {
    await initializeJsonService();
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return false;
    }
    
    const user = dataCache.users[userIndex];
    let favorites = [...(user.favorites || [])];
    
    favorites = favorites.filter(id => id !== propertyId);
    
    dataCache.users[userIndex].favorites = favorites;
    
    // Save to localStorage
    saveToLocalStorage();
    
    return true;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return false;
  }
}

/**
 * Clear all favorites for a user
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllFavorites(userId) {
  try {
    await initializeJsonService();
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return false;
    }
    
    // Set favorites to empty array
    dataCache.users[userIndex].favorites = [];
    
    // Save to localStorage
    saveToLocalStorage();
    
    return true;
  } catch (error) {
    console.error("Error clearing all favorites:", error);
    return false;
  }
}

/**
 * Check if a property is in a user's favorites
 * @param {string} userId - The user ID
 * @param {string} propertyId - The property ID
 * @returns {Promise<boolean>} True if favorite, false otherwise
 */
export async function isFavorite(userId, propertyId) {
  try {
    await initializeJsonService();
    
    const user = dataCache.users.find(u => u.id === userId);
    
    if (!user) {
      return false;
    }
    
    const favorites = user.favorites || [];
    return favorites.includes(propertyId);
  } catch (error) {
    console.error("Error checking if property is favorite:", error);
    return false;
  }
}

/**
 * Get the count of favorites for a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} The count of favorites
 */
export async function getFavoritesCount(userId) {
  try {
    await initializeJsonService();
    
    const user = dataCache.users.find(u => u.id === userId);
    
    if (!user) {
      return 0;
    }
    
    return (user.favorites || []).length;
  } catch (error) {
    console.error("Error getting favorites count:", error);
    return 0;
  }
}