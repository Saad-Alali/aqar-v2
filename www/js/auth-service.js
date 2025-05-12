// auth-service.js with Firebase integration
import { dataCache, saveToLocalStorage } from './json-service.js';

const LOCAL_STORAGE_USER_KEY = 'aqar_current_user';
let currentUserCache = null;
let firebaseInitialized = false;
let firebaseInitPromise = null;

/**
 * Initialize Firebase authentication - improved implementation
 */
export async function initializeFirebase() {
  // Return existing promise if already initializing
  if (firebaseInitPromise) {
    return firebaseInitPromise;
  }
  
  // Return immediately if already initialized
  if (firebaseInitialized) {
    return Promise.resolve(true);
  }
  
  // Create a new promise for initialization
  firebaseInitPromise = new Promise((resolve) => {
    const checkFirebase = () => {
      if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.firebase) {
        console.log("Firebase plugin is available");
        firebaseInitialized = true;
        resolve(true);
        return true;
      }
      return false;
    };
    
    // Check immediately if Cordova is already loaded
    if (checkFirebase()) {
      return;
    }
    
    // Otherwise wait for deviceready event
    document.addEventListener('deviceready', () => {
      if (checkFirebase()) {
        return;
      }
      
      console.warn("Firebase plugin not available after deviceready, falling back to local auth");
      resolve(false);
    }, false);
    
    // Timeout after 5 seconds to prevent hanging
    setTimeout(() => {
      if (!firebaseInitialized) {
        console.warn("Firebase initialization timed out, falling back to local auth");
        resolve(false);
      }
    }, 5000);
  });
  
  return firebaseInitPromise;
}

/**
 * Register a new user
 */
export async function registerUser(email, password, fullName, phone) {
  try {
    const firebaseAvailable = await initializeFirebase();
    
    if (firebaseAvailable) {
      // Using Firebase Auth
      return new Promise((resolve, reject) => {
        cordova.plugins.firebase.auth.createUserWithEmailAndPassword(email, password)
          .then(async (userCredential) => {
            // Create the user profile
            const newUser = {
              id: userCredential.uid,
              email: email,
              fullName: fullName,
              phone: phone || '',
              avatarUrl: 'img/placeholder.jpg',
              favorites: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Save to dataCache if available
            if (dataCache && dataCache.users) {
              dataCache.users.push(newUser);
              saveToLocalStorage();
            }
            
            // Set as current user
            setCurrentUser(newUser);
            
            resolve(newUser);
          })
          .catch((error) => {
            console.error("Firebase registration error:", error);
            if (error.code === 'auth/email-already-in-use') {
              reject(new Error('البريد الإلكتروني مستخدم بالفعل'));
            } else {
              reject(new Error('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.'));
            }
          });
      });
    } else {
      // Fallback to local auth
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
    }
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Log in a user
 */
export async function loginUser(email, password) {
  try {
    const firebaseAvailable = await initializeFirebase();
    
    if (firebaseAvailable) {
      // Using Firebase Auth
      return new Promise((resolve, reject) => {
        cordova.plugins.firebase.auth.signInWithEmailAndPassword(email, password)
          .then(async (userCredential) => {
            let user = null;
            
            // Try to find user in local cache
            if (dataCache && dataCache.users) {
              user = dataCache.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            }
            
            if (!user) {
              // Create basic user object if not found
              user = {
                id: userCredential.uid,
                email: email,
                fullName: email.split('@')[0],
                avatarUrl: 'img/placeholder.jpg',
                favorites: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              // Add to dataCache if available
              if (dataCache && dataCache.users) {
                dataCache.users.push(user);
                saveToLocalStorage();
              }
            }
            
            // Set as current user
            setCurrentUser(user);
            
            resolve(user);
          })
          .catch((error) => {
            console.error("Firebase login error:", error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
              reject(new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة'));
            } else {
              reject(new Error('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.'));
            }
          });
      });
    } else {
      // Fallback to local auth
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
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Log out the current user
 */
export async function logoutUser() {
  try {
    const firebaseAvailable = await initializeFirebase();
    
    if (firebaseAvailable) {
      // Using Firebase Auth
      return new Promise((resolve, reject) => {
        cordova.plugins.firebase.auth.signOut()
          .then(() => {
            currentUserCache = null;
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            resolve(true);
          })
          .catch((error) => {
            console.error("Firebase logout error:", error);
            reject(error);
          });
      });
    } else {
      // Fallback to local auth
      currentUserCache = null;
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      return true;
    }
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}

/**
 * Get the current logged in user
 */
export async function getCurrentUser() {
  if (currentUserCache) {
    return { ...currentUserCache, password: undefined };
  }
  
  try {
    const firebaseAvailable = await initializeFirebase();
    
    if (firebaseAvailable) {
      // Using Firebase Auth
      return new Promise((resolve) => {
        cordova.plugins.firebase.auth.getCurrentUser()
          .then((user) => {
            if (user) {
              // Try to get detailed user info from local storage
              const userData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
              
              if (userData) {
                try {
                  const localUser = JSON.parse(userData);
                  currentUserCache = localUser;
                  resolve({ ...localUser, password: undefined });
                  return;
                } catch (e) {
                  console.error('Error parsing stored user:', e);
                }
              }
              
              // Create basic user if not found in local storage
              const basicUser = {
                id: user.uid,
                email: user.email,
                fullName: user.displayName || user.email.split('@')[0],
                avatarUrl: user.photoURL || 'img/placeholder.jpg',
                favorites: []
              };
              
              currentUserCache = basicUser;
              resolve(basicUser);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.error("Error getting current user from Firebase:", error);
            resolve(null);
          });
      });
    } else {
      // Fallback to local storage
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
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updatedData) {
  try {
    const firebaseAvailable = await initializeFirebase();
    
    // Always update local cache
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
    
    if (firebaseAvailable) {
      // For now, we only update the user display name
      // Firebase has more limited profile data
      if (updatedData.fullName) {
        return new Promise((resolve, reject) => {
          cordova.plugins.firebase.auth.updateProfile({
            displayName: updatedData.fullName
          })
            .then(() => {
              // User is already updated in local cache above
              const updatedUser = currentUserCache;
              resolve({ ...updatedUser, password: undefined });
            })
            .catch((error) => {
              console.error("Error updating Firebase profile:", error);
              reject(new Error('حدث خطأ أثناء تحديث الملف الشخصي'));
            });
        });
      }
    }
    
    throw new Error('المستخدم غير موجود');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Toggle a property as favorite
 */
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

/**
 * Delete a user account
 */
export async function deleteUserAccount(userId) {
  try {
    const firebaseAvailable = await initializeFirebase();
    
    if (firebaseAvailable) {
      // Using Firebase Auth
      return new Promise((resolve, reject) => {
        cordova.plugins.firebase.auth.deleteUser()
          .then(() => {
            // Also delete from local cache
            if (dataCache && dataCache.users) {
              dataCache.users = dataCache.users.filter(u => u.id !== userId);
              saveToLocalStorage();
            }
            
            currentUserCache = null;
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            resolve(true);
          })
          .catch((error) => {
            console.error("Firebase delete user error:", error);
            reject(new Error('حدث خطأ أثناء حذف الحساب'));
          });
      });
    } else {
      // Fallback to local auth
      if (dataCache && dataCache.users) {
        dataCache.users = dataCache.users.filter(u => u.id !== userId);
        saveToLocalStorage();
      }
      
      currentUserCache = null;
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      return true;
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Set the current user in localStorage and cache
 */
function setCurrentUser(user) {
  if (window.cordova && window.NativeStorage) {
    try {
      window.NativeStorage.setItem('currentUser', JSON.stringify(user),
        function() { console.log('User saved to native storage'); },
        function(error) { console.error('Error saving user', error); }
      );
    } catch (e) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    }
  } else {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  }
  currentUserCache = user;
}