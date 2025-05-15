document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Get the current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Only keep splash screen for index.html and splash-screen.html
    if (currentPage !== 'index.html' && currentPage !== 'splash-screen.html') {
        if (navigator.splashscreen) {
            navigator.splashscreen.hide();
            console.log('Hiding splash screen for non-index page: ' + currentPage);
        }
    } else {
        // For index.html, check if we should keep it
        const keepSplash = sessionStorage.getItem('keep_cordova_splash');
        if (!keepSplash && navigator.splashscreen) {
            setTimeout(function() {
                navigator.splashscreen.hide();
                console.log('Hiding splash after timeout for index page');
            }, 500);
        } else {
            console.log('Keeping splash screen for index page');
        }
    }
    
    console.log('Device is ready');
    localStorage.setItem('app_initialized', 'true');
}