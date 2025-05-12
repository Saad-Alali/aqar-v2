// Initialize Cordova features
document.addEventListener('deviceready', function() {
    // Handle back button
    document.addEventListener('backbutton', function(e) {
        // Navigate back if possible, otherwise exit app
        if (window.history.length > 1) {
            window.history.back();
        } else {
            navigator.app.exitApp();
        }
    }, false);

    // Handle network status
    document.addEventListener('online', function() {
        // App is online
        console.log('App is online');
    }, false);
    
    document.addEventListener('offline', function() {
        // App is offline
        console.log('App is offline');
        showToast('أنت غير متصل بالإنترنت', 'warning');
    }, false);

    // Initialize statusbar
    if (window.StatusBar) {
        StatusBar.styleDefault();
    }
}, false);

// Replace localStorage with Cordova file storage for larger data
function initializeStorage() {
    // Implementation depends on your storage needs
    // Use cordova-plugin-file for file-based storage
}