document.addEventListener('DOMContentLoaded', function() {
    // Initialize app
    if (typeof cordova !== 'undefined') {
        document.addEventListener('deviceready', onDeviceReady, false);
    } else {
        // If cordova is not available (browser environment), 
        // proceed with normal initialization
        onDeviceReady();
    }
});

function onDeviceReady() {
    // Hide the native splash screen if it exists
    if (navigator.splashscreen) {
        navigator.splashscreen.hide();
    }
    
    // Continue with app initialization
    console.log('Device is ready');
    
    // Check if the app is opening for the first time
    const firstLaunch = !localStorage.getItem('app_initialized');
    
    // If first launch, redirect to HTML splash screen
    if (firstLaunch) {
        localStorage.setItem('app_initialized', 'true');
        window.location.href = 'splash-screen.html';
    }
    
    // Initialize app services
    initApp();
}

function initApp() {
    // Initialize your application services here
    console.log('App initialized');
    
    // Configure StatusBar if available
    if (window.StatusBar) {
        StatusBar.styleDefault();
    }
}