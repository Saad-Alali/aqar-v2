// json-service.js - Enhanced with better data management and error handling
/**
 * JSON Service
 * Handles loading and saving data from/to JSON files and localStorage
 */

// Cached data for the application
export const dataCache = {
  properties: null,
  users: null,
  initialized: false
};

/**
 * Initialize the JSON service by loading data
 * @returns {Promise<Object>} The data cache
 */
export async function initializeJsonService() {
  if (dataCache.initialized) {
    return dataCache;
  }
  
  try {
    const propertiesResponse = await fetch('data/properties.json');
    dataCache.properties = await propertiesResponse.json();
    
    const usersResponse = await fetch('data/users.json');
    dataCache.users = await usersResponse.json();
    
    syncWithLocalStorage();
    
    dataCache.initialized = true;
    return dataCache;
  } catch (error) {
    console.error('Error initializing JSON service:', error);
    
    // Load from localStorage if fetch fails
    loadFromLocalStorage();
    
    // If still not initialized, use sample data
    if (!dataCache.initialized) {
      dataCache.properties = getSampleProperties();
      dataCache.users = getSampleUsers();
      dataCache.initialized = true;
    }
    
    return dataCache;
  }
}

/**
 * Sync data with localStorage
 * This ensures any updates made in the current session are preserved
 * and any updates made in other tabs/sessions are loaded
 */
function syncWithLocalStorage() {
  const storedProperties = localStorage.getItem('aqar_properties');
  const storedUsers = localStorage.getItem('aqar_users');
  
  if (storedProperties) {
    try {
      const localProperties = JSON.parse(storedProperties);
      
      // Merge with fetched properties to ensure we have the latest data
      if (dataCache.properties) {
        dataCache.properties.forEach((property, index) => {
          const localProperty = localProperties.find(p => p.id === property.id);
          if (localProperty) {
            dataCache.properties[index] = { ...property, ...localProperty };
          }
        });
      } else {
        dataCache.properties = localProperties;
      }
    } catch (error) {
      console.error('Error parsing stored properties:', error);
    }
  }
  
  if (storedUsers) {
    try {
      const localUsers = JSON.parse(storedUsers);
      
      // Merge with fetched users
      if (dataCache.users) {
        dataCache.users.forEach((user, index) => {
          const localUser = localUsers.find(u => u.id === user.id);
          if (localUser) {
            dataCache.users[index] = { ...user, ...localUser };
          }
        });
        
        // Add any new users that were created locally
        localUsers.forEach(localUser => {
          if (!dataCache.users.some(u => u.id === localUser.id)) {
            dataCache.users.push(localUser);
          }
        });
      } else {
        dataCache.users = localUsers;
      }
    } catch (error) {
      console.error('Error parsing stored users:', error);
    }
  }
  
  // Save merged data back to localStorage
  saveToLocalStorage();
}

/**
 * Load data from localStorage
 * Used as a fallback when fetch fails
 */
function loadFromLocalStorage() {
  const storedProperties = localStorage.getItem('aqar_properties');
  const storedUsers = localStorage.getItem('aqar_users');
  
  let initialized = false;
  
  if (storedProperties) {
    try {
      dataCache.properties = JSON.parse(storedProperties);
      initialized = true;
    } catch (error) {
      console.error('Error parsing stored properties:', error);
    }
  }
  
  if (storedUsers) {
    try {
      dataCache.users = JSON.parse(storedUsers);
      initialized = true;
    } catch (error) {
      console.error('Error parsing stored users:', error);
    }
  }
  
  if (initialized) {
    dataCache.initialized = true;
  }
}

/**
 * Save data to localStorage
 * This should be called whenever data is modified
 */
export function saveToLocalStorage() {
  if (dataCache.properties) {
    localStorage.setItem('aqar_properties', JSON.stringify(dataCache.properties));
  }
  
  if (dataCache.users) {
    localStorage.setItem('aqar_users', JSON.stringify(dataCache.users));
  }
}

/**
 * Get sample properties data
 * Used as a fallback when no data is available
 * @returns {Array} Sample properties
 */
function getSampleProperties() {
  return [
    {
      id: 'prop1',
      title: "شقة حديثة",
      location: "وسط المدينة",
      price: 350000,
      priceFormatted: "$350,000",
      propertyType: "apartment",
      transactionType: "للبيع",
      features: {
        bedrooms: 2,
        bathrooms: 2,
        area: 1200
      },
      description: "شقة حديثة في قلب المدينة مع إطلالات رائعة وسهولة الوصول إلى جميع المرافق",
      imageUrl: "img/placeholder.jpg",
      dateAdded: "2023-06-15"
    },
    {
      id: 'prop2',
      title: "فيلا فاخرة",
      location: "الواجهة البحرية",
      price: 1250000,
      priceFormatted: "$1,250,000",
      propertyType: "villa",
      transactionType: "للبيع",
      features: {
        bedrooms: 5,
        bathrooms: 4,
        area: 3500
      },
      description: "فيلا فاخرة مع إطلالات بانورامية على البحر وحمام سباحة خاص",
      imageUrl: "img/placeholder.jpg",
      dateAdded: "2023-05-20"
    },
    {
      id: 'prop3',
      title: "منزل عائلي",
      location: "الضواحي",
      price: 580000,
      priceFormatted: "$580,000",
      propertyType: "house",
      transactionType: "للبيع",
      features: {
        bedrooms: 4,
        bathrooms: 3,
        area: 2400
      },
      description: "منزل عائلي واسع في حي هادئ مع حديقة كبيرة ومطبخ حديث وقريب من المدارس",
      imageUrl: "img/placeholder.jpg",
      dateAdded: "2023-04-10"
    }
  ];
}

/**
 * Get sample users data
 * Used as a fallback when no data is available
 * @returns {Array} Sample users
 */
function getSampleUsers() {
  return [
    {
      id: 'user1',
      email: "user@example.com",
      password: "password123",
      fullName: "مستخدم تجريبي",
      phone: "123456789",
      avatarUrl: "img/placeholder.jpg",
      favorites: ["prop1"]
    }
  ];
}

/**
 * Get a specific property by ID
 * @param {string} propertyId - The property ID to find
 * @returns {Promise<Object|null>} The property or null if not found
 */
export async function getPropertyById(propertyId) {
  await initializeJsonService();
  
  return dataCache.properties.find(p => p.id === propertyId) || null;
}

/**
 * Get a specific user by ID
 * @param {string} userId - The user ID to find
 * @returns {Promise<Object|null>} The user or null if not found
 */
export async function getUserById(userId) {
  await initializeJsonService();
  
  return dataCache.users.find(u => u.id === userId) || null;
}

/**
 * Get a user by email
 * @param {string} email - The email to find
 * @returns {Promise<Object|null>} The user or null if not found
 */
export async function getUserByEmail(email) {
  await initializeJsonService();
  
  return dataCache.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Add a new property
 * @param {Object} property - The property to add
 * @returns {Promise<Object>} The added property
 */
export async function addProperty(property) {
  await initializeJsonService();
  
  const newProperty = {
    ...property,
    id: 'prop' + Date.now(),
    dateAdded: new Date().toISOString()
  };
  
  dataCache.properties.push(newProperty);
  saveToLocalStorage();
  
  return newProperty;
}

/**
 * Update a property
 * @param {string} propertyId - The property ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated property
 */
export async function updateProperty(propertyId, updates) {
  await initializeJsonService();
  
  const propertyIndex = dataCache.properties.findIndex(p => p.id === propertyId);
  
  if (propertyIndex === -1) {
    throw new Error('Property not found');
  }
  
  const property = dataCache.properties[propertyIndex];
  const updatedProperty = { ...property, ...updates };
  
  dataCache.properties[propertyIndex] = updatedProperty;
  saveToLocalStorage();
  
  return updatedProperty;
}

/**
 * Delete a property
 * @param {string} propertyId - The property ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteProperty(propertyId) {
  await initializeJsonService();
  
  const propertyIndex = dataCache.properties.findIndex(p => p.id === propertyId);
  
  if (propertyIndex === -1) {
    return false;
  }
  
  dataCache.properties.splice(propertyIndex, 1);
  saveToLocalStorage();
  
  // Also remove from all users' favorites
  dataCache.users.forEach(user => {
    if (user.favorites && user.favorites.includes(propertyId)) {
      user.favorites = user.favorites.filter(id => id !== propertyId);
    }
  });
  
  return true;
}