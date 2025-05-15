document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    const keepCordovaSplash = sessionStorage.getItem('keep_cordova_splash');
    
    if (!keepCordovaSplash && navigator.splashscreen) {
        navigator.splashscreen.hide();
    }
    
    console.log('Device is ready');
    localStorage.setItem('app_initialized', 'true');
}