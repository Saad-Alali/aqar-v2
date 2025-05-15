document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Simply initialize the app without any splash screen logic
    console.log('Device is ready');
    localStorage.setItem('app_initialized', 'true');
    
    // Let our custom splash screen handle the experience
    // No need to manipulate any native splash screen
}