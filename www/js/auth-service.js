// auth-service.js - Enhanced with user data management
import { initializeJsonService, dataCache, saveToLocalStorage } from './json-service.js';

const LOCAL_STORAGE_USER_KEY = 'aqar_current_user';
let currentUserCache = null;

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User's full name
 * @param {string} phone - User's phone number
 * @returns {Promise<Object>} The created user object without password
 */
export async function registerUser(email, password, fullName, phone) {
  try {
    await initializeJsonService();
    
    // Check if email already exists
    const existingUser = dataCache.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('البريد الإلكتروني مستخدم بالفعل');
    }
    
    // Create new user
    const newUser = {
      id: 'user' + Date.now(),
      email: email,
      password: password, // In a real app, this should be hashed
      fullName: fullName,
      phone: phone || '',
      avatarUrl: 'img/placeholder.jpg',
      favorites: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to users array
    dataCache.users.push(newUser);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Set as current user
    setCurrentUser(newUser);
    
    return { ...newUser, password: undefined };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} The user object without password
 */
export async function loginUser(email, password) {
  try {
    await initializeJsonService();
    
    // Find user by email and password
    const user = dataCache.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (!user) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    
    // Set as current user
    setCurrentUser(user);
    
    return { ...user, password: undefined };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Logout the current user
 * @returns {Promise<boolean>} Success status
 */
export async function logoutUser() {
  try {
    // Clear current user
    currentUserCache = null;
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}

/**
 * Get the current logged in user
 * @returns {Promise<Object|null>} The current user or null if not logged in
 */
export async function getCurrentUser() {
  // Return from cache if available
  if (currentUserCache) {
    return { ...currentUserCache, password: undefined };
  }
  
  // Try to get from localStorage
  try {
    const userData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (userData) {
      const user = JSON.parse(userData);
      currentUserCache = user;
      return { ...user, password: undefined };
    }
  } catch (error) {
    console.error('Error getting current user from localStorage:', error);
  }
  
  return null;
}

/**
 * Update user profile information
 * @param {string} userId - The user ID
 * @param {Object} updatedData - The updated user data
 * @returns {Promise<Object>} The updated user without password
 */
export async function updateUserProfile(userId, updatedData) {
  try {
    await initializeJsonService();
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('المستخدم غير موجود');
    }
    
    // Update user data
    const user = dataCache.users[userIndex];
    const updatedUser = {
      ...user,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    // Replace in array
    dataCache.users[userIndex] = updatedUser;
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update current user if it's the logged in user
    if (currentUserCache && currentUserCache.id === userId) {
      setCurrentUser(updatedUser);
    }
    
    return { ...updatedUser, password: undefined };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update user avatar
 * @param {string} userId - The user ID
 * @param {File} avatarFile - The avatar file
 * @returns {Promise<Object>} The updated user without password
 */
export async function updateUserAvatar(userId, avatarFile) {
  try {
    await initializeJsonService();
    
    // In a real implementation, we would upload the file to a server
    // For now, we'll just pretend we updated the avatar
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('المستخدم غير موجود');
    }
    
    // Update user data
    const user = dataCache.users[userIndex];
    const updatedUser = {
      ...user,
      avatarUrl: 'img/placeholder.jpg', // In a real app, this would be the uploaded image URL
      updatedAt: new Date().toISOString()
    };
    
    // Replace in array
    dataCache.users[userIndex] = updatedUser;
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update current user if it's the logged in user
    if (currentUserCache && currentUserCache.id === userId) {
      setCurrentUser(updatedUser);
    }
    
    return { ...updatedUser, password: undefined };
  } catch (error) {
    console.error('Error updating user avatar:', error);
    throw error;
  }
}

/**
 * Delete user's profile avatar (reset to default)
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The updated user without password
 */
export async function deleteUserAvatar(userId) {
  try {
    await initializeJsonService();
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('المستخدم غير موجود');
    }
    
    // Update user data to reset avatar
    const user = dataCache.users[userIndex];
    const updatedUser = {
      ...user,
      avatarUrl: 'img/default-avatar.jpg', // Default avatar
      updatedAt: new Date().toISOString()
    };
    
    // Replace in array
    dataCache.users[userIndex] = updatedUser;
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update current user if it's the logged in user
    if (currentUserCache && currentUserCache.id === userId) {
      setCurrentUser(updatedUser);
    }
    
    return { ...updatedUser, password: undefined };
  } catch (error) {
    console.error('Error deleting user avatar:', error);
    throw error;
  }
}

/**
 * Delete a user's account completely
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUserAccount(userId) {
  try {
    await initializeJsonService();
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('المستخدم غير موجود');
    }
    
    // Remove user from array
    dataCache.users.splice(userIndex, 1);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Logout if it's the current user
    if (currentUserCache && currentUserCache.id === userId) {
      await logoutUser();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Toggle a property as favorite for a user
 * @param {string} userId - The user ID
 * @param {string} propertyId - The property ID
 * @returns {Promise<boolean>} True if added, false if removed
 */
export async function toggleFavorite(userId, propertyId) {
  try {
    await initializeJsonService();
    
    const userIndex = dataCache.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('المستخدم غير موجود');
    }
    
    const user = dataCache.users[userIndex];
    const favorites = [...(user.favorites || [])];
    const isFavorite = favorites.includes(propertyId);
    
    if (isFavorite) {
      // Remove from favorites
      const index = favorites.indexOf(propertyId);
      favorites.splice(index, 1);
    } else {
      // Add to favorites
      favorites.push(propertyId);
    }
    
    // Update user data
    const updatedUser = {
      ...user,
      favorites,
      updatedAt: new Date().toISOString()
    };
    
    // Replace in array
    dataCache.users[userIndex] = updatedUser;
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update current user if it's the logged in user
    if (currentUserCache && currentUserCache.id === userId) {
      setCurrentUser(updatedUser);
    }
    
    return !isFavorite; // Return whether it was added (true) or removed (false)
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

/**
 * Set the current user in localStorage and cache
 * @param {Object} user - The user to set as current
 */
function setCurrentUser(user) {
  currentUserCache = user;
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
}

// Add to auth-service.js
function setCurrentUser(user) {
    // If Cordova is available, use native storage
    if (window.cordova && window.NativeStorage) {
        window.NativeStorage.setItem('currentUser', JSON.stringify(user),
            function() { console.log('User saved to native storage'); },
            function(error) { console.error('Error saving user', error); }
        );
    } else {
        // Fallback to localStorage
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    }
    currentUserCache = user;
}
