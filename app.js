// YouTube API Key - Replace with your own API key
const API_KEY = 'AIzaSyArSm2Ls9hs2KVYtKiZ53FLujCNXf-y7Us';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const videosContainer = document.getElementById('videos-container');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const videoTitle = document.getElementById('video-title');
const closeButton = document.querySelector('.close-button');
const navItems = document.querySelectorAll('.nav-item');
const currentCategory = document.getElementById('current-category');
const parentControlModal = document.getElementById('parent-control-modal');
const pinInputs = document.querySelectorAll('.pin-input');
const submitPinButton = document.getElementById('submit-pin');
const setupPinButton = document.getElementById('setup-pin');
const pinError = document.getElementById('pin-error');
const setupPinModal = document.getElementById('setup-pin-modal');
const newPinInputs = document.querySelectorAll('.new-pin-input');
const confirmPinInputs = document.querySelectorAll('.confirm-pin-input');
const savePinButton = document.getElementById('save-pin');
const cancelSetupButton = document.getElementById('cancel-setup');
const setupError = document.getElementById('setup-error');
const profileIcon = document.querySelector('.profile-icon');
const historyModal = document.getElementById('history-modal');
const historyContainer = document.getElementById('history-container');
const closeHistoryButton = document.querySelector('.close-history-button');
const loginBtn = document.querySelector('.login-btn');
const registerBtn = document.querySelector('.register-btn');
const parentDashboardModal = document.getElementById('parent-dashboard-modal');
const closeDashboardButton = document.querySelector('.close-dashboard-button');
const dashboardTabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const dashboardHistoryContainer = document.getElementById('dashboard-history-container');
const saveTimeLimitButton = document.getElementById('save-time-limit');
const saveTimeRangeButton = document.getElementById('save-time-range');
const changePinButton = document.getElementById('change-pin');

// Profile dropdown menu elements
const accountOption = document.getElementById('account-option');
const settingsOption = document.getElementById('settings-option');
const logoutOption = document.getElementById('logout-option');
const loginOption = document.getElementById('login-option');
const registerOption = document.getElementById('register-option');

// Registration Modal Elements
const parentRegistrationModal = document.getElementById('parent-registration-modal');
const closeRegistrationButton = document.querySelector('.close-registration-button');
const registrationForm = document.getElementById('registration-form');
const parentNameInput = document.getElementById('parent-name');
const parentEmailInput = document.getElementById('parent-email');
const parentPhoneInput = document.getElementById('parent-phone');
const childNameInput = document.getElementById('child-name');
const termsCheckbox = document.getElementById('terms-checkbox');

// Default search query for initial load
const DEFAULT_QUERIES = {
    shows: 'kids shows cartoons',
    music: 'kids music songs videos',
    explore: 'kids learning educational videos',
    movies: 'kids full movies animation',
    shorts: 'kids short videos'
};

// Current active category
let activeCategory = 'shows';

// Selected video for parent control
let selectedVideo = null;

// Update UI for registered user
function updateUIForRegisteredUser() {
    // Get parent information
    const parentInfo = JSON.parse(localStorage.getItem('parentInfo'));
    if (!parentInfo) return;
    
    // Show account, settings, and logout options, hide login and register options
    const accountOption = document.getElementById('account-option');
    const settingsOption = document.getElementById('settings-option');
    const loginOption = document.getElementById('login-option');
    const registerOption = document.getElementById('register-option');
    const logoutOption = document.getElementById('logout-option');
    
    if (accountOption) accountOption.style.display = 'flex';
    if (settingsOption) settingsOption.style.display = 'flex';
    if (logoutOption) logoutOption.style.display = 'flex';
    if (loginOption) loginOption.style.display = 'none';
    if (registerOption) registerOption.style.display = 'none';
}

// Update UI for guest user
function updateUIForGuestUser() {
    // Show login and register options, hide account, settings, and logout options
    const accountOption = document.getElementById('account-option');
    const settingsOption = document.getElementById('settings-option');
    const loginOption = document.getElementById('login-option');
    const registerOption = document.getElementById('register-option');
    const logoutOption = document.getElementById('logout-option');
    
    if (accountOption) accountOption.style.display = 'none';
    if (settingsOption) settingsOption.style.display = 'none';
    if (logoutOption) logoutOption.style.display = 'none';
    if (loginOption) loginOption.style.display = 'flex';
    if (registerOption) registerOption.style.display = 'flex';
}

// Logout user
function logoutUser() {
    // Clear user data from localStorage
    localStorage.removeItem('isRegistered');
    localStorage.removeItem('parentInfo');
    localStorage.removeItem('parentPin');
    localStorage.removeItem('childProfile');
    localStorage.removeItem('watchHistory');
    localStorage.removeItem('accessExpiry');
    localStorage.removeItem('personalizedQuery');
    localStorage.removeItem('childProfilePhoto');
    localStorage.removeItem('dailyWatchLimit');
    localStorage.removeItem('watchTimeFrom');
    localStorage.removeItem('watchTimeTo');
    
    // Update UI for guest user
    updateUIForGuestUser();
    
    // Show a success message
    showToast('Logged out successfully');
    
    // Reload videos with default query
    loadVideos(DEFAULT_QUERIES[activeCategory]);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's a personalized query based on interests
    const personalizedQuery = localStorage.getItem('personalizedQuery');
    
    // Load initial videos - use personalized query if available
    if (personalizedQuery) {
        loadVideos(personalizedQuery);
    } else {
        loadVideos(DEFAULT_QUERIES[activeCategory]);
    }

    // Update UI based on login status
    updateUIBasedOnLoginStatus();

    // Setup event listeners
    setupEventListeners();

    // Setup PIN input behavior
    setupPinInputBehavior();
    
    // Initialize dropdown menu visibility
    initializeDropdownVisibility();
    
    // Check if parent is already registered and update UI accordingly
    const isRegistered = localStorage.getItem('isRegistered') === 'true';
    if (isRegistered) {
        updateUIForRegisteredUser();
    } else {
        updateUIForGuestUser();
    }
});

document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger-menu');
  const mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function() {
      mobileNav.classList.toggle('active');
    });
    // Optional: Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
        mobileNav.classList.remove('active');
      }
    });
  }
});

// Initialize dropdown menu visibility
function initializeDropdownVisibility() {
    // Check if user is logged in (using both flags)
    const isLoggedIn = (localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isRegistered') === 'true') && localStorage.getItem('parentPin') !== null;
    
    // Update UI based on login status
    updateUIBasedOnLoginStatus(isLoggedIn);
    
    // Add event listener for profile icon if not already added
    const profileIcon = document.querySelector('.profile-icon');
    if (profileIcon) {
        // Remove existing listener to avoid duplicates
        profileIcon.removeEventListener('click', toggleProfileDropdown);
        // Add the event listener
        profileIcon.addEventListener('click', toggleProfileDropdown);
    }
}

// Toggle profile dropdown visibility
function toggleProfileDropdown() {
    const dropdown = document.querySelector('.profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Function to update UI based on login status
function updateUIBasedOnLoginStatus(isLoggedIn) {
    // If isLoggedIn is not provided, check localStorage
    if (isLoggedIn === undefined) {
        isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isRegistered') === 'true';
    }
    
    const accountOption = document.getElementById('account-option');
    const settingsOption = document.getElementById('settings-option');
    const loginOption = document.getElementById('login-option');
    const registerOption = document.getElementById('register-option');
    const logoutOption = document.getElementById('logout-option');
    
    if (isLoggedIn) {
        // User is logged in - show account, settings, logout options
        if (accountOption) accountOption.style.display = 'flex';
        if (settingsOption) settingsOption.style.display = 'flex';
        if (logoutOption) logoutOption.style.display = 'flex';
        
        // Hide login and register options
        if (loginOption) loginOption.style.display = 'none';
        if (registerOption) registerOption.style.display = 'none';
        
        // Update profile icon to indicate logged in status
        const profileIcon = document.querySelector('.profile-icon');
        if (profileIcon) profileIcon.classList.add('logged-in');
    } else {
        // User is not logged in - hide account, settings, logout options
        if (accountOption) accountOption.style.display = 'none';
        if (settingsOption) settingsOption.style.display = 'none';
        if (logoutOption) logoutOption.style.display = 'none';
        
        // Show login and register options
        if (loginOption) loginOption.style.display = 'flex';
        if (registerOption) registerOption.style.display = 'flex';
        
        // Update profile icon to indicate logged out status
        const profileIcon = document.querySelector('.profile-icon');
        if (profileIcon) profileIcon.classList.remove('logged-in');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Profile dropdown menu event listeners
    setupProfileDropdownEvents();
    
    // Search button click
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            loadVideos(query);
        }
    });

    // Search input enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                loadVideos(query);
            }
        }
    });

    // Close video modal
    closeButton.addEventListener('click', () => {
        videoModal.style.display = 'none';
        videoPlayer.innerHTML = '';
        try { finalizeWatchTime(); } catch (e) { }
        // cleanup orientation listeners and exit fullscreen if needed
        try { removeVideoOrientationListeners(); } catch (e) { /* ignore */ }
        try { exitVideoLandscapeMode(); } catch (e) { /* ignore */ }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            videoModal.style.display = 'none';
            videoPlayer.innerHTML = '';
            try { finalizeWatchTime(); } catch (err) { }
            // cleanup orientation listeners and exit any landscape/fullscreen mode
            try { removeVideoOrientationListeners(); } catch (err) { }
            try { exitVideoLandscapeMode(); } catch (err) { }
        }
        if (e.target === parentControlModal) {
            parentControlModal.style.display = 'none';
            resetPinInputs();
        }
        if (e.target === setupPinModal) {
            setupPinModal.style.display = 'none';
            resetSetupPinInputs();
        }
        if (e.target === historyModal) {
            historyModal.style.display = 'none';
        }
        if (e.target === parentDashboardModal) {
            parentDashboardModal.style.display = 'none';
        }
    });

    // Navigation items click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            if (category !== activeCategory) {
                // Update active class
                document.querySelector('.nav-item.active').classList.remove('active');
                item.classList.add('active');
                
                // Update category title
                activeCategory = category;
                currentCategory.textContent = category.toUpperCase();
                
                // Load new videos for the selected category
                videosContainer.style.display = 'grid';
                loadVideos(DEFAULT_QUERIES[category]);
            }
        });
    });

    // Submit PIN button
    submitPinButton.addEventListener('click', validatePin);

    // Setup PIN button
    setupPinButton.addEventListener('click', () => {
        parentControlModal.style.display = 'none';
        setupPinModal.style.display = 'block';
    });

    // Save PIN button
    savePinButton.addEventListener('click', savePin);

    // Cancel setup button
    cancelSetupButton.addEventListener('click', () => {
        setupPinModal.style.display = 'none';
        parentControlModal.style.display = 'block';
    });

    // Profile icon click (toggle dropdown)
    profileIcon.addEventListener('click', () => {
        const dropdown = document.querySelector('.profile-dropdown');
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.matches('.profile-icon') && !e.target.closest('.profile-dropdown')) {
            const dropdown = document.querySelector('.profile-dropdown');
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    });
    
    // Account option click
    const accountOption = document.getElementById('account-option');
    if (accountOption) {
        accountOption.addEventListener('click', () => {
            document.querySelector('.profile-dropdown').classList.remove('show');
            showParentDashboard('profile');
        });
    }
    
    // Settings option click
    const settingsOption = document.getElementById('settings-option');
    if (settingsOption) {
        settingsOption.addEventListener('click', () => {
            document.querySelector('.profile-dropdown').classList.remove('show');
            showParentDashboard('settings');
        });
    }
    
    // Logout option click
    const logoutOption = document.getElementById('logout-option');
    if (logoutOption) {
        logoutOption.addEventListener('click', () => {
            document.querySelector('.profile-dropdown').classList.remove('show');
            logoutUser();
        });
    }

    // Login option click - redirect to login page
    const loginOption = document.getElementById('login-option');
    if (loginOption) {
        loginOption.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // Register option click - redirect to login page with register tab
    const registerOption = document.getElementById('register-option');
    if (registerOption) {
        registerOption.addEventListener('click', () => {
            window.location.href = 'login.html#register';
        });
    }
    
    // Close registration modal
    closeRegistrationButton.addEventListener('click', () => {
        parentRegistrationModal.style.display = 'none';
    });
    
    // Registration form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!termsCheckbox.checked) {
            registerError.textContent = 'You must agree to the Terms and Conditions';
            return;
        }
        
        const parentName = document.getElementById('parent-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('phone').value;
        const childName = document.getElementById('child-name').value;
        
        // Generate a random 4-digit PIN
        const pin = Math.floor(1000 + Math.random() * 9000);
        
        try {
            // TEMPORARY: Skip SMS verification and proceed directly
            // Store parent data in localStorage
            const parentData = {
                name: parentName,
                email: email,
                phone: phone,
                childName: childName,
                pin: pin
            };
            
            localStorage.setItem('parentData', JSON.stringify(parentData));
            
            // Show PIN setup modal
            setupPinModal.style.display = 'block';
            
            // Display the PIN in the console for testing purposes
            console.log('Your PIN for testing:', pin);
            
        } catch (error) {
            console.error('Error:', error);
            registerError.textContent = 'Error during registration. Please try again.';
        }
        
        // Update UI to reflect registered state
        updateUIForRegisteredUser();
    });

    // Close history modal
    closeHistoryButton.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    // Close dashboard modal
    closeDashboardButton.addEventListener('click', () => {
        parentDashboardModal.style.display = 'none';
    });

    // Dashboard tabs
    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');
            
            // Show corresponding content
            document.querySelector('.tab-content.active').classList.remove('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Setup event listeners for dashboard
            changePinButton.addEventListener('click', () => {
                parentDashboardModal.style.display = 'none';
                setupPinModal.style.display = 'block';
                newPinInputs[0].focus();
            });
            
            saveTimeLimitButton.addEventListener('click', () => {
                const hours = parseInt(document.getElementById('hours-limit').value) || 0;
                const minutes = parseInt(document.getElementById('minutes-limit').value) || 0;
                const totalMinutes = (hours * 60) + minutes;
                
                localStorage.setItem('dailyWatchLimit', totalMinutes);
                showToast('Daily watch limit saved');
            });
            
            saveTimeRangeButton.addEventListener('click', () => {
                const timeFrom = document.getElementById('time-from').value;
                const timeTo = document.getElementById('time-to').value;
                
                localStorage.setItem('watchTimeFrom', timeFrom);
                localStorage.setItem('watchTimeTo', timeTo);
                showToast('Watch time range saved');
            });
            
            // Profile photo upload button
            const uploadPhotoBtn = document.getElementById('upload-photo-btn');
            const photoUpload = document.getElementById('photo-upload');
            if (uploadPhotoBtn && photoUpload) {
                uploadPhotoBtn.addEventListener('click', () => {
                    photoUpload.click();
                });
                
                photoUpload.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        
                        reader.onload = (event) => {
                            const profilePhoto = document.getElementById('profile-photo');
                            if (profilePhoto) {
                                // Save the image data to localStorage
                                localStorage.setItem('childProfilePhoto', event.target.result);
                                
                                // Display the image
                                profilePhoto.innerHTML = `<img src="${event.target.result}" alt="Child's profile">`;
                                
                                showToast('Profile photo updated');
                            }
                        };
                        
                        reader.readAsDataURL(e.target.files[0]);
                    }
                });
            }
            
            // Save profile button
            const saveProfileBtn = document.getElementById('save-profile-btn');
            if (saveProfileBtn) {
                saveProfileBtn.addEventListener('click', () => {
                    // Save age group
                    const ageGroupSelect = document.getElementById('child-age-group');
                    if (ageGroupSelect) {
                        localStorage.setItem('childAgeGroup', ageGroupSelect.value);
                    }
                    
                    // Save interests
                    const interests = {
                        cartoons: document.getElementById('interest-cartoons')?.checked || false,
                        music: document.getElementById('interest-music')?.checked || false,
                        learning: document.getElementById('interest-learning')?.checked || false,
                        stories: document.getElementById('interest-stories')?.checked || false
                    };
                    
                    localStorage.setItem('childInterests', JSON.stringify(interests));
                    
                    // Update recommended videos based on interests
                    updateRecommendedVideos(interests);
                    
                    showToast('Child profile saved successfully');
                });
            }
        });
    });

    // Change PIN button
    changePinButton.addEventListener('click', () => {
        parentDashboardModal.style.display = 'none';
        setupPinModal.style.display = 'block';
        newPinInputs[0].focus();
    });
}

// Setup PIN input behavior (auto-focus next input)
function setupPinInputBehavior() {
    // Parent control PIN inputs
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            // Allow backspace to go to previous input
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });

    // New PIN inputs
    newPinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < newPinInputs.length - 1) {
                newPinInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                newPinInputs[index - 1].focus();
            }
        });
    });

    // Confirm PIN inputs
    confirmPinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < confirmPinInputs.length - 1) {
                confirmPinInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                confirmPinInputs[index - 1].focus();
            }
        });
    });
}

// Load videos from YouTube API
async function loadVideos(query) {
    // Show loading spinner
    videosContainer.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';

    try {
        // Add category-specific parameters and queries
        let additionalParams = '';
        let categorySpecificQuery = query;
        
        // Configure category-specific parameters and queries
        if (activeCategory === 'channels') {
            // For channels category, load channels instead of videos
            loadChannels();
            return; // Exit early since we're handling channels differently
        } else if (activeCategory === 'shorts') {
            // 'short' videos are less than 4 minutes
            additionalParams = '&videoDuration=short';
            categorySpecificQuery = 'short videos kids';
        } else if (activeCategory === 'movies') {
            // 'long' videos are 20+ minutes
            additionalParams = '&videoDuration=long';
            categorySpecificQuery = 'full movie kids animation';
        } else if (activeCategory === 'shows') {
            // Medium duration for shows (4-20 minutes)
            additionalParams = '&videoDuration=medium';
            categorySpecificQuery = 'cartoon episode kids show';
        } else if (activeCategory === 'music') {
            // Medium duration for music videos
            additionalParams = '&videoDuration=medium';
            categorySpecificQuery = 'kids music song video';
        } else if (activeCategory === 'explore') {
            // Medium duration for educational content
            additionalParams = '&videoDuration=medium';
            categorySpecificQuery = 'kids educational learning';
        }
        
        // Make API request to backend proxy (uses YOUTUBE_API_KEY from .env)
        const response = await fetch(
            `/api/youtube/search?part=snippet&maxResults=20&q=${encodeURIComponent(categorySpecificQuery)}&relevanceLanguage=en${additionalParams}&type=video&safeSearch=strict&videoEmbeddable=true`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }

        const data = await response.json();
        
        // For non-shorts categories, filter out videos with 'short' in the title
        let filteredItems = data.items;
        if (activeCategory !== 'shorts') {
            filteredItems = data.items.filter(item => {
                const title = item.snippet.title.toLowerCase();
                const description = item.snippet.description.toLowerCase();
                return !title.includes('short') && !description.includes('short video');
            });
        }
        
        displayVideos(filteredItems.length > 0 ? filteredItems : data.items);
    } catch (error) {
        console.error('Error fetching videos:', error);
        videosContainer.innerHTML = `<div class="error">Failed to load videos. Please try again later.</div>`;
        
        // If API key is not set, display sample videos
        if (API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            displaySampleVideos();
        }
    }
}

// Display videos in the grid
function displayVideos(videos) {
    videosContainer.innerHTML = '';
    
    // If no videos are available after filtering
    if (videos.length === 0) {
        videosContainer.innerHTML = '<div class="no-videos">No videos found for this category. Try another category!</div>';
        return;
    }

    // Choose one random "new" video on each page load
    const newIndex = Math.floor(Math.random() * videos.length);

    videos.forEach((video, idx) => {
        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const thumbnail = video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url;
        const channelTitle = video.snippet.channelTitle;

        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="thumbnail-container">
                <img src="${thumbnail}" alt="${title}" class="thumbnail">
            </div>
            <div class="video-info">
                <h3>${title}</h3>
                <p>${channelTitle}</p>
            </div>
        `;

        videoCard.addEventListener('click', () => {
            // Store selected video for parent control
            selectedVideo = {
                id: videoId,
                title: title,
                thumbnail: thumbnail,
                channelTitle: channelTitle
            };

            // Debug: log auth state to help diagnose unexpected redirects
            try {
                console.log('VIDEO CLICK auth-state', {
                    isRegistered: localStorage.getItem('isRegistered'),
                    isLoggedIn: localStorage.getItem('isLoggedIn'),
                    parentPin: localStorage.getItem('parentPin'),
                    accessExpiry: localStorage.getItem('accessExpiry'),
                    checkAccessValidity: checkAccessValidity()
                });
            } catch (e) {
                console.warn('Error reading auth state for debug', e);
            }

            // Check if parent is registered
            const isRegistered = localStorage.getItem('isRegistered') === 'true';
            if (!isRegistered) {
                // Redirect to login page with register tab open
                window.location.href = 'login.html#register';
                return;
            }

            // If access is valid, still enforce time window/daily limit
            if (checkAccessValidity()) {
                if (!canWatchNow()) {
                    return;
                }
                playVideo(selectedVideo);
                return;
            }

            // Check if PIN is set
            const pin = localStorage.getItem('parentPin');
            if (pin) {
                // Show parent control modal
                parentControlModal.style.display = 'block';
                pinInputs[0].focus();
            } else {
                // This shouldn't happen if registered, but just in case
                showToast('Parent PIN not found. Please register again.');
                parentRegistrationModal.style.display = 'block';
            }
        });

        // If this is the randomly chosen new video, add badge and prepend later
        if (idx === newIndex) {
            const badge = document.createElement('div');
            badge.className = 'new-badge';
            badge.textContent = 'NEW';
            // Position the badge inside the card
            videoCard.style.position = 'relative';
            videoCard.querySelector('.thumbnail-container').appendChild(badge);
            // Prepend to top so it appears first
            videosContainer.insertBefore(videoCard, videosContainer.firstChild);
        } else {
            videosContainer.appendChild(videoCard);
        }
    });
}

// Display sample videos when API key is not set
function displaySampleVideos() {
    const sampleVideos = [
        {
            id: 'v1Hy321zXrk',
            title: 'ABC Song | Nursery Rhymes',
            thumbnail: 'https://via.placeholder.com/480x360?text=ABC+Song',
            channelTitle: 'Kids Songs'
        },
        {
            id: 'HP-MbfHFUqs',
            title: 'Twinkle Twinkle Little Star',
            thumbnail: 'https://via.placeholder.com/480x360?text=Twinkle+Star',
            channelTitle: 'Nursery Rhymes'
        },
        {
            id: 'pZw9veQ76fo',
            title: 'Wheels on the Bus',
            thumbnail: 'https://via.placeholder.com/480x360?text=Wheels+on+Bus',
            channelTitle: 'Kids Songs'
        },
        {
            id: 'yCjJyiqpAuU',
            title: 'Baby Shark Dance',
            thumbnail: 'https://via.placeholder.com/480x360?text=Baby+Shark',
            channelTitle: 'Pinkfong'
        },
        {
            id: 'XqZsoesa55w',
            title: 'Five Little Monkeys',
            thumbnail: 'https://via.placeholder.com/480x360?text=Five+Little+Monkeys',
            channelTitle: 'Kids Songs'
        },
        {
            id: 'fN1Cyr0ZK9M',
            title: 'Old MacDonald Had a Farm',
            thumbnail: 'https://via.placeholder.com/480x360?text=Old+MacDonald',
            channelTitle: 'Nursery Rhymes'
        }
    ];

    videosContainer.innerHTML = '';

    sampleVideos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="thumbnail-container">
                <img src="${video.thumbnail}" alt="${video.title}" class="thumbnail">
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.channelTitle}</p>
            </div>
        `;

        videoCard.addEventListener('click', () => {
            // Store selected video for parent control
            selectedVideo = {
                id: video.id,
                title: video.title,
                thumbnail: video.thumbnail,
                channelTitle: video.channelTitle
            };

            // Check if PIN is set
            const pin = localStorage.getItem('parentPin');
            if (pin) {
                // Show parent control modal
                parentControlModal.style.display = 'block';
                pinInputs[0].focus();
            } else {
                // Show setup PIN modal
                setupPinModal.style.display = 'block';
                newPinInputs[0].focus();
            }
        });

        videosContainer.appendChild(videoCard);
    });
}

// Validate PIN
function validatePin() {
    const enteredPin = Array.from(pinInputs).map(input => input.value).join('');
    const storedPin = localStorage.getItem('parentPin');

    if (enteredPin === storedPin) {
        // Close parent control modal
        parentControlModal.style.display = 'none';
        resetPinInputs();

        // Set access timeout (30 minutes)
        const expiryTime = new Date().getTime() + (30 * 60 * 1000);
        localStorage.setItem('accessExpiry', expiryTime);

        // Check if we're trying to access parent dashboard
        if (localStorage.getItem('attemptingParentAccess') === 'true') {
            // Get the active tab if it was stored
            const activeTab = localStorage.getItem('dashboardActiveTab') || 'profile';
            
            // Clear the flags
            localStorage.removeItem('attemptingParentAccess');
            localStorage.removeItem('dashboardActiveTab');
            
            // Show parent dashboard with the specified tab
            showParentDashboard(activeTab);
        } else if (selectedVideo) {
            // Enforce time window and daily limit
            if (!canWatchNow()) {
                return;
            }
            // Play the video
            playVideo(selectedVideo);
            // Show a toast notification about the 30-minute limit
            showToast('Access granted for 30 minutes');
        }
    } else {
        pinError.textContent = 'Incorrect PIN. Please try again.';
        resetPinInputs();
        pinInputs[0].focus();
    }
}

// Save new PIN
function savePin() {
    const newPin = Array.from(newPinInputs).map(input => input.value).join('');
    const confirmPin = Array.from(confirmPinInputs).map(input => input.value).join('');

    // Validate PIN
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        setupError.textContent = 'PIN must be 6 digits.';
        return;
    }

    if (newPin !== confirmPin) {
        setupError.textContent = 'PINs do not match. Please try again.';
        resetSetupPinInputs();
        newPinInputs[0].focus();
        return;
    }

    // Save PIN to localStorage
    localStorage.setItem('parentPin', newPin);

    // Close setup modal
    setupPinModal.style.display = 'none';
    resetSetupPinInputs();

    // If there's a selected video, show parent control modal
    if (selectedVideo) {
        parentControlModal.style.display = 'block';
        pinInputs[0].focus();
    }
}

// Check if access is still valid
function checkAccessValidity() {
    const expiryTime = localStorage.getItem('accessExpiry');
    if (!expiryTime) {
        return false;
    }
    
    const currentTime = new Date().getTime();
    return currentTime < parseInt(expiryTime);
}

// Helpers for parental time limits
function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getUsedMinutesToday() {
    const key = `watchUsed:${getTodayKey()}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val) || 0 : 0;
}

function addUsedMinutesToday(mins) {
    const key = `watchUsed:${getTodayKey()}`;
    const used = getUsedMinutesToday();
    localStorage.setItem(key, String(used + Math.max(0, Math.floor(mins))));
}

function finalizeWatchTime() {
    const startTsStr = localStorage.getItem('watchStartTs');
    if (!startTsStr) return;
    localStorage.removeItem('watchStartTs');
    const startTs = parseInt(startTsStr);
    if (!startTs || isNaN(startTs)) return;
    const elapsedMs = Date.now() - startTs;
    const mins = elapsedMs / 60000;
    addUsedMinutesToday(mins);
}

function isWithinAllowedTimeWindow() {
    const from = localStorage.getItem('watchTimeFrom'); // e.g., "08:00"
    const to = localStorage.getItem('watchTimeTo');     // e.g., "20:30"
    if (!from || !to) return true; // no restriction
    const now = new Date();
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    const fromMin = fh * 60 + fm;
    const toMin = th * 60 + tm;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (toMin >= fromMin) {
        return nowMin >= fromMin && nowMin <= toMin;
    }
    // overnight window (e.g., 20:00 to 06:00)
    return nowMin >= fromMin || nowMin <= toMin;
}

function canWatchNow() {
    if (!isWithinAllowedTimeWindow()) {
        showToast('Watching is not allowed at this time.');
        return false;
    }
    const limit = parseInt(localStorage.getItem('dailyWatchLimit')) || 0; // minutes
    if (limit > 0) {
        const used = getUsedMinutesToday();
        if (used >= limit) {
            showToast('Daily watch limit reached.');
            return false;
        }
    }
    return true;
}

// Show toast notification
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Play video
function playVideo(video) {
    // Create embedded player
    videoPlayer.innerHTML = `
        <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/${video.id}?autoplay=1" 
            title="${video.title}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
        ></iframe>
    `;

    // Set video title
    videoTitle.textContent = video.title;

    // Also add an overlay title on top of the video for better visibility
    try {
        // Remove any existing overlay first
        const existing = videoPlayer.querySelector('.video-title-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'video-title-overlay';
        overlay.textContent = video.title;
        videoPlayer.appendChild(overlay);
    } catch (e) {
        console.warn('Could not create video title overlay', e);
    }

    // Show video modal
    videoModal.style.display = 'block';
    // Add orientation listeners so the player can go fullscreen on landscape
    try {
        addVideoOrientationListeners();
    } catch (e) {
        console.warn('Orientation listeners could not be added', e);
    }

    // Track start time for daily limit accounting
    try {
        localStorage.setItem('watchStartTs', String(Date.now()));
    } catch (e) { }

    // Log watched video
    logWatchedVideo(video);

    // Send notification to parent (Twilio integration would go here)
    sendParentNotification(video.title);
}

// Log watched video to localStorage
function logWatchedVideo(video) {
    // Get existing watch history
    let watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];

    // Add current video to history with timestamp
    watchHistory.unshift({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        timestamp: new Date().toISOString()
    });

    // Limit history to 50 items
    if (watchHistory.length > 50) {
        watchHistory = watchHistory.slice(0, 50);
    }

    // Save updated history
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
}

// Show watch history
function showWatchHistory() {
    // Get watch history from localStorage
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];

    // Clear history container
    historyContainer.innerHTML = '';

    if (watchHistory.length === 0) {
        historyContainer.innerHTML = '<p>No watch history available.</p>';
    } else {
        // Display each history item
        watchHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            // Format date
            const date = new Date(item.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

            historyItem.innerHTML = `
                <img src="${item.thumbnail}" alt="${item.title}">
                <div class="history-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.channelTitle} • ${formattedDate}</p>
                </div>
            `;

            historyContainer.appendChild(historyItem);
        });
    }

    // Show history modal
    historyModal.style.display = 'block';
}

/*
 Orientation helpers for video playback
 - When device orientation becomes landscape, attempt to make the iframe fullscreen.
 - When returning to portrait or closing the modal, exit fullscreen and restore layout.
*/

let _videoOrientationHandler = null;

function addVideoOrientationListeners() {
    // If already added, skip
    if (_videoOrientationHandler) return;

    _videoOrientationHandler = function () {
        try {
            const isLandscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;
            if (isLandscape) {
                enterVideoLandscapeMode();
            } else {
                exitVideoLandscapeMode();
            }
        } catch (e) {
            console.warn('Orientation change handling error', e);
        }
    };

    // Listen to orientationchange and resize for broader support
    window.addEventListener('orientationchange', _videoOrientationHandler);
    window.addEventListener('resize', _videoOrientationHandler);

    // Run once to set initial state
    _videoOrientationHandler();
}

function removeVideoOrientationListeners() {
    if (!_videoOrientationHandler) return;
    window.removeEventListener('orientationchange', _videoOrientationHandler);
    window.removeEventListener('resize', _videoOrientationHandler);
    _videoOrientationHandler = null;
}

async function enterVideoLandscapeMode() {
    // Prefer requesting fullscreen on the iframe so native controls and rotation are handled by the browser
    const iframe = videoPlayer.querySelector('iframe');
    if (!iframe) return;

    // If already fullscreen, nothing to do
    if (document.fullscreenElement) return;

    try {
        if (iframe.requestFullscreen) {
            await iframe.requestFullscreen();
        } else if (videoModal.requestFullscreen) {
            await videoModal.requestFullscreen();
        } else {
            // Fallback: apply a CSS class that makes the modal cover the viewport
            videoModal.classList.add('landscape-fullscreen');
            document.body.style.overflow = 'hidden';
        }
    } catch (err) {
        // If requestFullscreen fails or is denied, use fallback CSS
        videoModal.classList.add('landscape-fullscreen');
        document.body.style.overflow = 'hidden';
    }
}

async function exitVideoLandscapeMode() {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
    } catch (e) {
        // ignore
    }

    // Remove fallback class and restore scrolling
    videoModal.classList.remove('landscape-fullscreen');
    document.body.style.overflow = '';
}

// Helpers with try/catch wrappers called from other code
function exitVideoLandscapeModeSafe() { try { exitVideoLandscapeMode(); } catch (e) {} }
function removeVideoOrientationListenersSafe() { try { removeVideoOrientationListeners(); } catch (e) {} }


// Show parent dashboard
function showParentDashboard(activeTab = 'profile') {
    // Check if PIN is set
    const pin = localStorage.getItem('parentPin');
    if (!pin) {
        // If no PIN set, show setup PIN modal
        setupPinModal.style.display = 'block';
        newPinInputs[0].focus();
        return;
    }

    // Check if user is already authenticated
    if (checkAccessValidity()) {
        // Load dashboard data and show dashboard
        loadDashboardData();
        
        // Activate the specified tab
        const tabs = document.querySelectorAll('.dashboard-tabs .tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Remove active class from all tabs and contents
        tabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activate the specified tab
        const tabToActivate = document.querySelector(`.tab[data-tab="${activeTab}"]`);
        if (tabToActivate) {
            tabToActivate.classList.add('active');
            const contentToActivate = document.getElementById(`${activeTab}-tab`);
            if (contentToActivate) {
                contentToActivate.classList.add('active');
            }
        }
        
        // Show the dashboard modal
        parentDashboardModal.style.display = 'block';
    } else {
        // Need authentication first
        parentControlModal.style.display = 'block';
        pinInputs[0].focus();
        // Store that we're trying to access parent dashboard and which tab to show
        localStorage.setItem('attemptingParentAccess', 'true');
        localStorage.setItem('dashboardActiveTab', activeTab);
    }
}

// Load dashboard data
function loadDashboardData() {
    // Load child profile data
    loadChildProfile();
    
    // Load watch history for dashboard
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];
    dashboardHistoryContainer.innerHTML = '';

    if (watchHistory.length === 0) {
        dashboardHistoryContainer.innerHTML = '<p>No watch history available.</p>';
    } else {
        // Display each history item
        watchHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            // Format date
            const date = new Date(item.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

            historyItem.innerHTML = `
                <img src="${item.thumbnail}" alt="${item.title}">
                <div class="history-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.channelTitle} • ${formattedDate}</p>
                </div>
            `;

            dashboardHistoryContainer.appendChild(historyItem);
        });
    }

    // Load time limits
    const dailyWatchLimit = localStorage.getItem('dailyWatchLimit');
    if (dailyWatchLimit) {
        const hours = Math.floor(dailyWatchLimit / 60);
        const minutes = dailyWatchLimit % 60;
        document.getElementById('hours-limit').value = hours;
        document.getElementById('minutes-limit').value = minutes;
    }

    const timeFrom = localStorage.getItem('watchTimeFrom');
    if (timeFrom) {
        document.getElementById('time-from').value = timeFrom;
    }

    const timeTo = localStorage.getItem('watchTimeTo');
    if (timeTo) {
        document.getElementById('time-to').value = timeTo;
    }
}

// Load child profile data
function loadChildProfile() {
    // Get parent information from localStorage
    const parentInfo = JSON.parse(localStorage.getItem('parentInfo')) || {};
    const childName = parentInfo.childName || '';
    const parentName = parentInfo.name || '';
    
    // Set child's name in the profile
    const childNameDisplay = document.getElementById('child-name-display');
    if (childNameDisplay) {
        childNameDisplay.textContent = childName;
    }
    
    // Set parent's name if available
    const parentNameDisplay = document.getElementById('parent-name-display');
    if (parentNameDisplay) {
        parentNameDisplay.textContent = parentName;
    }
    
    // Update profile header with child's name
    const profileHeader = document.querySelector('.dashboard-content h2');
    if (profileHeader && childName) {
        profileHeader.textContent = `${childName}'s Profile`;
    }
    
    // Load profile photo if exists
    const profilePhoto = document.getElementById('profile-photo');
    const savedPhoto = localStorage.getItem('childProfilePhoto');
    if (savedPhoto && profilePhoto) {
        profilePhoto.innerHTML = `<img src="${savedPhoto}" alt="${childName}'s profile">`;
    }
    
    // Load age group if exists
    const ageGroup = localStorage.getItem('childAgeGroup');
    const ageGroupSelect = document.getElementById('child-age-group');
    if (ageGroup && ageGroupSelect) {
        ageGroupSelect.value = ageGroup;
    }
    
    // Load interests if exist
    const interests = JSON.parse(localStorage.getItem('childInterests')) || {};
    if (interests) {
        // Set checkbox states based on saved interests
        if (document.getElementById('interest-cartoons')) {
            document.getElementById('interest-cartoons').checked = interests.cartoons || false;
        }
        if (document.getElementById('interest-music')) {
            document.getElementById('interest-music').checked = interests.music || false;
        }
        if (document.getElementById('interest-learning')) {
            document.getElementById('interest-learning').checked = interests.learning || false;
        }
        if (document.getElementById('interest-stories')) {
            document.getElementById('interest-stories').checked = interests.stories || false;
        }
    }
}

// Send PIN via SMS using Twilio
function sendPinViaSMS(phoneNumber, pin, childName) {
    // In a real implementation, you would make an API call to your backend
    // which would then use Twilio to send the PIN via SMS
    console.log(`Sending PIN ${pin} to ${phoneNumber} for child ${childName}`);
    
    // Simulate API call to Twilio
    const message = `Your Kiddotubes PIN for ${childName} is: ${pin}. Use this PIN to allow your child to watch videos.`;
    
    // For demonstration purposes, we'll log the message
    console.log(`SMS Message: ${message}`);
    
    // In a production environment, you would use a backend API to make this call
    /*
    fetch('/api/send-sms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            accountSid: TWILIO_ACCOUNT_SID,
            authToken: TWILIO_AUTH_TOKEN,
            from: TWILIO_PHONE_NUMBER,
            to: phoneNumber,
            message: message
        }),
    });
    */
}

// Update recommended videos based on child's interests
function updateRecommendedVideos(interests) {
    // Build a query based on selected interests
    let query = '';
    
    if (interests.cartoons) {
        query += 'cartoons ';
    }
    
    if (interests.music) {
        query += 'music songs ';
    }
    
    if (interests.learning) {
        query += 'educational learning ';
    }
    
    if (interests.stories) {
        query += 'stories ';
    }
    
    // If no interests selected, use a default query
    if (!query) {
        query = 'kids videos';
    } else {
        query += 'for kids';
    }
    
    // Save the personalized query to localStorage
    localStorage.setItem('personalizedQuery', query);
    
    // If user is on the homepage, load videos with the new query
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        loadVideos(query);
    }
}

// Send notification to parent (Twilio integration)
function sendParentNotification(videoTitle) {
    // Get parent information from localStorage
    const parentInfo = JSON.parse(localStorage.getItem('parentInfo'));
    if (!parentInfo) return;
    
    const childName = parentInfo.childName || 'Your child';
    const phoneNumber = parentInfo.phone;
    
    // Log the notification for demonstration
    console.log(`Sending notification: ${childName} watched ${videoTitle}`);
    
    // Send notification via Twilio API
    fetch('http://localhost:3000/api/send-notification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            phoneNumber: phoneNumber,
            childName: childName,
            videoTitle: videoTitle
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Notification sent successfully');
            showToast('Parent notified via SMS');
        } else {
            console.error('Error sending notification:', data.error);
        }
    })
    .catch(error => {
        console.error('Error sending notification:', error);
        // The server might not be running, just log the error
    });
}

// Reset PIN inputs
function resetPinInputs() {
    pinInputs.forEach(input => {
        input.value = '';
    });
    pinError.textContent = '';
}

// Reset setup PIN inputs
function resetSetupPinInputs() {
    newPinInputs.forEach(input => {
        input.value = '';
    });
    confirmPinInputs.forEach(input => {
        input.value = '';
    });
    setupError.textContent = '';
}

// Example: Array of video objects (add more as needed)
const allVideos = [
  { title: "ABC Song | Nursery Rhymes", thumbnail: "https://via.placeholder.com/480x360?text=ABC+Song" },
  { title: "Twinkle Twinkle Little Star", thumbnail: "https://via.placeholder.com/480x360?text=Twinkle+Star" },
  { title: "Wheels on the Bus", thumbnail: "https://via.placeholder.com/480x360?text=Wheels+on+Bus" },
  { title: "Baby Shark Dance", thumbnail: "https://via.placeholder.com/480x360?text=Baby+Shark" },
  { title: "Five Little Monkeys", thumbnail: "https://via.placeholder.com/480x360?text=Five+Little+Monkeys" },
  { title: "Old MacDonald Had a Farm", thumbnail: "https://via.placeholder.com/480x360?text=Old+MacDonald" },
  { title: "Colors Song", thumbnail: "https://via.placeholder.com/480x360?text=Colors+Song" },
  { title: "Numbers Song", thumbnail: "https://via.placeholder.com/480x360?text=Numbers+Song" },
  { title: "Alphabet Phonics", thumbnail: "https://via.placeholder.com/480x360?text=Alphabet+Phonics" },
  { title: "Dinosaur Dance", thumbnail: "https://via.placeholder.com/480x360?text=Dinosaur+Dance" },
  { title: "Bedtime Lullabies", thumbnail: "https://via.placeholder.com/480x360?text=Bedtime+Lullabies" },
  { title: "Animal Sounds", thumbnail: "https://via.placeholder.com/480x360?text=Animal+Sounds" },
  { title: "Super Simple Songs", thumbnail: "https://via.placeholder.com/480x360?text=Super+Simple+Songs" },
  { title: "Counting to 10", thumbnail: "https://via.placeholder.com/480x360?text=Counting+to+10" },
  { title: "Shapes Song", thumbnail: "https://via.placeholder.com/480x360?text=Shapes+Song" },
  { title: "Learning Colors", thumbnail: "https://via.placeholder.com/480x360?text=Learning+Colors" },
  // --- Add these new videos below ---
  { title: "The Finger Family", thumbnail: "https://via.placeholder.com/480x360?text=Finger+Family" },
  { title: "Baa Baa Black Sheep", thumbnail: "https://via.placeholder.com/480x360?text=Baa+Baa+Black+Sheep" },
  { title: "If You're Happy and You Know It", thumbnail: "https://via.placeholder.com/480x360?text=If+Youre+Happy" },
  { title: "London Bridge is Falling Down", thumbnail: "https://via.placeholder.com/480x360?text=London+Bridge" },
  { title: "Row Row Row Your Boat", thumbnail: "https://via.placeholder.com/480x360?text=Row+Your+Boat" },
  { title: "Itsy Bitsy Spider", thumbnail: "https://via.placeholder.com/480x360?text=Itsy+Bitsy+Spider" },
  { title: "Head Shoulders Knees and Toes", thumbnail: "https://via.placeholder.com/480x360?text=Head+Shoulders+Knees+Toes" },
  { title: "Mary Had a Little Lamb", thumbnail: "https://via.placeholder.com/480x360?text=Mary+Had+a+Little+Lamb" },
  { title: "Hickory Dickory Dock", thumbnail: "https://via.placeholder.com/480x360?text=Hickory+Dickory+Dock" },
  { title: "Jack and Jill", thumbnail: "https://via.placeholder.com/480x360?text=Jack+and+Jill" },
  { title: "Pat-a-Cake", thumbnail: "https://via.placeholder.com/480x360?text=Pat-a-Cake" },
  { title: "Ring a Ring o' Roses", thumbnail: "https://via.placeholder.com/480x360?text=Ring+o+Roses" },
  { title: "Humpty Dumpty", thumbnail: "https://via.placeholder.com/480x360?text=Humpty+Dumpty" },
  { title: "Little Miss Muffet", thumbnail: "https://via.placeholder.com/480x360?text=Little+Miss+Muffet" },
  { title: "Three Blind Mice", thumbnail: "https://via.placeholder.com/480x360?text=Three+Blind+Mice" }
];

// Show more videos per page if you want
const videosPerPage = 8; // Increase to 10, 12, etc. if you want more at once

// Channel-related functions removed as requested

// Close modals when ESC key is pressed
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (videoModal.style.display === 'flex') {
            videoModal.style.display = 'none';
            videoPlayer.innerHTML = '';
            try { finalizeWatchTime(); } catch (e2) {}
        }
        if (parentControlModal.style.display === 'flex') {
            parentControlModal.style.display = 'none';
            resetPinInputs();
        }
        if (setupPinModal.style.display === 'flex') {
            setupPinModal.style.display = 'none';
            resetSetupPinInputs();
        }
        if (historyModal.style.display === 'flex') {
            historyModal.style.display = 'none';
        }
        if (parentDashboardModal.style.display === 'flex') {
            parentDashboardModal.style.display = 'none';
        }
    }
});

// Setup profile dropdown menu events
function setupProfileDropdownEvents() {
    // Login option click
    const loginOption = document.getElementById('login-option');
    if (loginOption) {
        loginOption.addEventListener('click', () => {
            // Close dropdown
            const dropdown = document.querySelector('.profile-dropdown');
            if (dropdown) dropdown.classList.remove('show');
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
    
    // Register option click
    const registerOption = document.getElementById('register-option');
    if (registerOption) {
        registerOption.addEventListener('click', () => {
            // Close dropdown
            const dropdown = document.querySelector('.profile-dropdown');
            if (dropdown) dropdown.classList.remove('show');
            // Redirect to register page with register tab active
            window.location.href = 'login.html#register';
        });
    }
    
    // Logout option click
    const logoutOption = document.getElementById('logout-option');
    if (logoutOption) {
        logoutOption.addEventListener('click', () => {
            // Perform logout
            handleLogout();
        });
    }
    
    // Account option click
    const accountOption = document.getElementById('account-option');
    if (accountOption) {
        accountOption.addEventListener('click', () => {
            // Close dropdown
            const dropdown = document.querySelector('.profile-dropdown');
            if (dropdown) dropdown.classList.remove('show');
            // Show parent dashboard
            if (parentDashboardModal) {
                parentDashboardModal.style.display = 'flex';
            }
        });
    }
    
    // Settings option click
    const settingsOption = document.getElementById('settings-option');
    if (settingsOption) {
        settingsOption.addEventListener('click', () => {
            // Close dropdown
            const dropdown = document.querySelector('.profile-dropdown');
            if (dropdown) dropdown.classList.remove('show');
            // Show settings section in dashboard
            if (parentDashboardModal) {
                parentDashboardModal.style.display = 'flex';
                // Activate settings tab if available
                const settingsTab = document.querySelector('.tab[data-tab="settings"]');
                if (settingsTab) {
                    // Deactivate all tabs
                    document.querySelectorAll('.tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    // Hide all tab contents
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    // Activate settings tab
                    settingsTab.classList.add('active');
                    // Show settings content
                    const settingsContent = document.querySelector('.tab-content[data-tab="settings"]');
                    if (settingsContent) {
                        settingsContent.classList.add('active');
                    }
                }
            }
        });
    }
}

// Handle logout
function handleLogout() {
    // Keep child profile data but remove login status
    localStorage.removeItem('isRegistered');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('accessExpiry');
    
    // Update UI to reflect logged out state
    updateUIBasedOnLoginStatus(false);
    
    // Close any open modals
    if (parentDashboardModal) {
        parentDashboardModal.style.display = 'none';
    }
    
    // Hide dropdown menu
    const dropdown = document.querySelector('.profile-dropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // Show logout confirmation
    alert('You have been successfully logged out.');
    
    // Redirect to home page
    window.location.href = 'index.html';
}
