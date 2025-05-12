document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('aqar_language') || 'ar';
    applyLanguage(savedLang);
});

function applyLanguage(lang) {
    if (!lang || (lang !== 'ar' && lang !== 'en')) {
        lang = 'ar';
    }
    
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    if (lang === 'ar') {
        document.body.style.fontFamily = "'Tajawal', sans-serif";
    } else {
        document.body.style.fontFamily = "'Poppins', sans-serif";
    }
    
    updatePageTitle(lang);
    translateElements(lang);
    translatePlaceholders(lang);
}

function updatePageTitle(lang) {
    const pagePath = window.location.pathname;
    const pageName = pagePath.split('/').pop() || 'index.html';
    const appName = lang === 'ar' ? 'عقار' : 'Aqar';
    
    const titles = {
        ar: {
            'login.html': 'تسجيل الدخول',
            'register.html': 'إنشاء حساب',
            'profile.html': 'حسابي',
            'edit-profile.html': 'تعديل الملف الشخصي',
            'favorites.html': 'المفضلة',
            'search.html': 'بحث',
            'property-details.html': 'تفاصيل العقار',
            'index.html': 'الرئيسية'
        },
        en: {
            'login.html': 'Login',
            'register.html': 'Register',
            'profile.html': 'My Profile',
            'edit-profile.html': 'Edit Profile',
            'favorites.html': 'Favorites',
            'search.html': 'Search',
            'property-details.html': 'Property Details',
            'index.html': 'Home'
        }
    };
    
    if (titles[lang] && titles[lang][pageName]) {
        document.title = `${titles[lang][pageName]} - ${appName}`;
    }
}

function translateElements(lang) {
    const translations = {
        ar: {
            'appTitle': 'عقار',
            'home': 'الرئيسية',
            'search': 'بحث',
            'favorites': 'المفضلة',
            'profile': 'حسابي',
            'loginRequired': 'تسجيل الدخول مطلوب',
            'loginToViewProfile': 'يجب تسجيل الدخول أو إنشاء حساب جديد للوصول إلى صفحة الملف الشخصي',
            'loginToViewFavorites': 'يجب تسجيل الدخول أو إنشاء حساب جديد للوصول إلى قائمة المفضلة الخاصة بك.',
            'login': 'تسجيل الدخول',
            'createAccount': 'إنشاء حساب جديد',
            'personalInfo': 'المعلومات الشخصية',
            'clearFavorites': 'حذف جميع المفضلات',
            'developerInfo': 'معلومات المطور',
            'language': 'اللغة',
            'deleteAccount': 'حذف الحساب',
            'logout': 'تسجيل الخروج',
            'appVersion': 'نسخة التطبيق: 1.0.0',
            'copyright': '© 2025 عقار - جميع الحقوق محفوظة',
            'forSale': 'للبيع',
            'forRent': 'للإيجار',
            'apartments': 'شقق',
            'villas': 'فلل',
            'houses': 'منازل',
            'commercial': 'مباني تجارية',
            'land': 'أراضي',
            'all': 'الكل',
            'noFavorites': 'لا توجد عقارات في المفضلة',
            'addFavoritesDesc': 'قم بإضافة العقارات التي تعجبك إلى المفضلة للوصول إليها لاحقًا بسهولة',
            'browseProperties': 'استعرض العقارات',
            'deleteAllFavorites': 'حذف جميع المفضلات',
            'sortByNewest': 'ترتيب حسب الأحدث',
            'sortByPrice': 'ترتيب حسب السعر',
            'featuredProperties': 'العقارات المميزة',
            'defaultSort': 'الترتيب الافتراضي',
            'priceLowToHigh': 'السعر: من الأقل للأعلى',
            'priceHighToLow': 'السعر: من الأعلى للأقل',
            'dateNewest': 'التاريخ: الأحدث أولاً',
            'dateOldest': 'التاريخ: الأقدم أولاً',
            'viewDetails': 'عرض التفاصيل',
            'bedrooms': 'غرف النوم',
            'bathrooms': 'الحمامات',
            'area': 'المساحة',
            'propertyType': 'نوع العقار',
            'transactionType': 'نوع المعاملة',
            'priceRange': 'نطاق السعر',
            'applyFilters': 'تطبيق الفلاتر',
            'searchOptions': 'خيارات البحث',
            'reset': 'إعادة تعيين',
            'searching': 'جاري البحث...',
            'noResultsFound': 'لم يتم العثور على نتائج',
            'tryChangingSearch': 'حاول تغيير مصطلحات البحث أو الفلاتر للعثور على عقارات.',
            'resetSearch': 'إعادة ضبط البحث',
            'recentSearches': 'عمليات البحث الأخيرة',
            'clearAll': 'مسح الكل',
            'propertySuggestions': 'اقتراحات عقارية',
            'viewAll': 'عرض الكل',
            'propertiesCount': '0 عقار',
            'sortBy': 'ترتيب حسب'
        },
        en: {
            'appTitle': 'Aqar',
            'home': 'Home',
            'search': 'Search',
            'favorites': 'Favorites',
            'profile': 'Profile',
            'loginRequired': 'Login Required',
            'loginToViewProfile': 'You must log in or create an account to access the profile page',
            'loginToViewFavorites': 'You must log in or create an account to access your favorites list.',
            'login': 'Login',
            'createAccount': 'Create Account',
            'personalInfo': 'Personal Information',
            'clearFavorites': 'Clear All Favorites',
            'developerInfo': 'Developer Info',
            'language': 'Language',
            'deleteAccount': 'Delete Account',
            'logout': 'Logout',
            'appVersion': 'App Version: 1.0.0',
            'copyright': '© 2025 Aqar - All Rights Reserved',
            'forSale': 'For Sale',
            'forRent': 'For Rent',
            'apartments': 'Apartments',
            'villas': 'Villas',
            'houses': 'Houses',
            'commercial': 'Commercial',
            'land': 'Land',
            'all': 'All',
            'noFavorites': 'No Favorites Found',
            'addFavoritesDesc': 'Add properties to your favorites for easy access later',
            'browseProperties': 'Browse Properties',
            'deleteAllFavorites': 'Delete All Favorites',
            'sortByNewest': 'Sort by Newest',
            'sortByPrice': 'Sort by Price',
            'featuredProperties': 'Featured Properties',
            'defaultSort': 'Default Sort',
            'priceLowToHigh': 'Price: Low to High',
            'priceHighToLow': 'Price: High to Low',
            'dateNewest': 'Date: Newest First',
            'dateOldest': 'Date: Oldest First',
            'viewDetails': 'View Details',
            'bedrooms': 'Bedrooms',
            'bathrooms': 'Bathrooms',
            'area': 'Area',
            'propertyType': 'Property Type',
            'transactionType': 'Transaction Type',
            'priceRange': 'Price Range',
            'applyFilters': 'Apply Filters',
            'searchOptions': 'Search Options',
            'reset': 'Reset',
            'searching': 'Searching...',
            'noResultsFound': 'No Results Found',
            'tryChangingSearch': 'Try changing search terms or filters to find properties.',
            'resetSearch': 'Reset Search',
            'recentSearches': 'Recent Searches',
            'clearAll': 'Clear All',
            'propertySuggestions': 'Property Suggestions',
            'viewAll': 'View All',
            'propertiesCount': '0 properties',
            'sortBy': 'Sort by'
        }
    };
    
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

function translatePlaceholders(lang) {
    const translations = {
        ar: {
            'searchPlaceholder': 'ابحث عن عقار، منطقة، أو حي...'
        },
        en: {
            'searchPlaceholder': 'Search for property, area, or neighborhood...'
        }
    };
    
    const elements = document.querySelectorAll('[data-i18n-placeholder]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
}