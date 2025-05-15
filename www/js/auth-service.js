// auth-service.js
import { dataCache, saveToLocalStorage } from './json-service.js';

const LOCAL_STORAGE_USER_KEY = 'aqar_current_user';
let currentUserCache = null;

export async function registerUser(email, password, fullName, phone) {
  try {
    if (dataCache && dataCache.users) {
      const existingUser = dataCache.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }
      
      const newUser = {
        id: 'user' + Date.now(),
        email: email,
        password: password,
        fullName: fullName,
        phone: phone || '',
        avatarUrl: 'img/placeholder.jpg',
        favorites: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      dataCache.users.push(newUser);
      saveToLocalStorage();
      setCurrentUser(newUser);
      
      return { ...newUser, password: undefined };
    } else {
      throw new Error('نظام المصادقة غير متوفر حالياً');
    }
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    if (dataCache && dataCache.users) {
      const user = dataCache.users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (!user) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
      
      setCurrentUser(user);
      
      return { ...user, password: undefined };
    } else {
      throw new Error('نظام المصادقة غير متوفر حالياً');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    currentUserCache = null;
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}

export async function getCurrentUser() {
  if (currentUserCache) {
    return { ...currentUserCache, password: undefined };
  }
  
  try {
    const userData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        currentUserCache = user;
        return { ...user, password: undefined };
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function updateUserProfile(userId, updatedData) {
  try {
    if (dataCache && dataCache.users) {
      const userIndex = dataCache.users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        const user = dataCache.users[userIndex];
        const updatedUser = {
          ...user,
          ...updatedData,
          updatedAt: new Date().toISOString()
        };
        
        dataCache.users[userIndex] = updatedUser;
        saveToLocalStorage();
        
        if (currentUserCache && currentUserCache.id === userId) {
          setCurrentUser(updatedUser);
        }
        
        return { ...updatedUser, password: undefined };
      }
    }
    
    throw new Error('المستخدم غير موجود');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function toggleFavorite(userId, propertyId) {
  try {
    if (dataCache && dataCache.users) {
      const userIndex = dataCache.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('المستخدم غير موجود');
      }
      
      const user = dataCache.users[userIndex];
      const favorites = [...(user.favorites || [])];
      const isFavorite = favorites.includes(propertyId);
      
      if (isFavorite) {
        const index = favorites.indexOf(propertyId);
        favorites.splice(index, 1);
      } else {
        favorites.push(propertyId);
      }
      
      const updatedUser = {
        ...user,
        favorites,
        updatedAt: new Date().toISOString()
      };
      
      dataCache.users[userIndex] = updatedUser;
      saveToLocalStorage();
      
      if (currentUserCache && currentUserCache.id === userId) {
        setCurrentUser(updatedUser);
      }
      
      return !isFavorite;
    }
    
    throw new Error('نظام المفضلة غير متوفر حالياً');
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

export async function deleteUserAccount(userId) {
  try {
    if (dataCache && dataCache.users) {
      dataCache.users = dataCache.users.filter(u => u.id !== userId);
      saveToLocalStorage();
    }
    
    currentUserCache = null;
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  currentUserCache = user;
}