document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    if (navigator.splashscreen) {
        navigator.splashscreen.hide();
    }
    
    console.log('Device is ready');
    localStorage.setItem('app_initialized', 'true');
}