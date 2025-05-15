document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const splashScreen = document.getElementById('splashScreen');
        const onboardingContainer = document.getElementById('onboardingContainer');

        splashScreen.style.opacity = '0';
        splashScreen.style.transform = 'scale(1.1)';

        onboardingContainer.style.opacity = '1';

        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }, 3000);
    
    document.getElementById('skipButton').addEventListener('click', goToLogin);
});

let currentSlide = 1;
const totalSlides = 4;

function nextSlide() {
    if (currentSlide < totalSlides) {
        document.getElementById(`slide${currentSlide}`).classList.remove('active');
        currentSlide++;
        document.getElementById(`slide${currentSlide}`).classList.add('active');
    }
}

function previousSlide() {
    if (currentSlide > 1) {
        document.getElementById(`slide${currentSlide}`).classList.remove('active');
        currentSlide--;
        document.getElementById(`slide${currentSlide}`).classList.add('active');
    }
}

function goToLogin() {
    localStorage.setItem('has_seen_splash', 'true');
    window.location.href = 'login.html';
}