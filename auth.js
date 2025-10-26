/**
 * Kiddotubes Authentication System
 * Handles user registration, login, and session management
 */

const Auth = {
    // Check if user is logged in
    isLoggedIn: function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const accessExpiry = localStorage.getItem('accessExpiry');
        
        // Check if access has expired
        if (isLoggedIn && accessExpiry) {
            const currentTime = new Date().getTime();
            if (currentTime > parseInt(accessExpiry)) {
                // Access has expired, log out
                this.logout();
                return false;
            }
            return true;
        }
        return false;
    },
    
    // Check if user is registered
    isRegistered: function() {
        return localStorage.getItem('isRegistered') === 'true';
    },
    
    // Get parent information
    getParentInfo: function() {
        const parentInfo = localStorage.getItem('parentInfo');
        return parentInfo ? JSON.parse(parentInfo) : null;
    },
    
    // Get child name
    getChildName: function() {
        const parentInfo = this.getParentInfo();
        return parentInfo ? parentInfo.childName : 'Child';
    },
    
    // Request OTP for login
    requestOTP: function(phoneNumber, childName) {
        return new Promise((resolve, reject) => {
            fetch('/api/generate-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,
                    childName
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data);
                } else {
                    reject(data.error || 'Failed to send OTP');
                }
            })
            .catch(error => {
                reject(error.message || 'Network error');
            });
        });
    },
    
    // Verify OTP and login
    verifyOTP: function(phoneNumber, otp) {
        return new Promise((resolve, reject) => {
            fetch('/api/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,
                    otp
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Set access timeout (30 minutes)
                    const expiryTime = new Date().getTime() + (30 * 60 * 1000);
                    localStorage.setItem('accessExpiry', expiryTime);
                    localStorage.setItem('isLoggedIn', 'true');
                    resolve(data);
                } else {
                    reject(data.error || 'OTP verification failed');
                }
            })
            .catch(error => {
                reject(error.message || 'Network error');
            });
        });
    },
    
    // Logout user
    logout: function() {
        // If Firebase is available, sign out there too
        if (typeof FirebaseAuthWrapper !== 'undefined' && FirebaseAuthWrapper.signOut) {
            FirebaseAuthWrapper.signOut().catch(() => {});
        }

        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('accessExpiry');
        // We don't remove registration info so they can log back in
    },
    
    // Register new user
    register: function(parentInfo) {
        // Save parent information to localStorage
        localStorage.setItem('parentInfo', JSON.stringify(parentInfo));
        localStorage.setItem('isRegistered', 'true');
        
        // Return the phone number for OTP verification
        return parentInfo.phone;
    },

    // Hash a password using SHA-256 (returns hex string)
    hashPassword: async function(password) {
        if (!password) return null;
        // Use Web Crypto API
        const enc = new TextEncoder();
        const data = enc.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // Register using email & password (client-side sample)
    registerWithEmail: async function(parentInfo, password) {
        // Prefer Firebase auth when initialized
        if (typeof FirebaseAuthWrapper !== 'undefined' && FirebaseAuthWrapper && FirebaseAuthWrapper.register) {
            try {
                const res = await FirebaseAuthWrapper.register(parentInfo.email, password);
                // On success, keep a minimal parentInfo locally (without passwordHash)
                const toStore = Object.assign({}, parentInfo, { uid: res.user && res.user.uid });
                localStorage.setItem('parentInfo', JSON.stringify(toStore));
                localStorage.setItem('isRegistered', 'true');
                // Generate and store a PIN for compatibility with existing flows/UI
                const pin = Math.floor(100000 + Math.random() * 900000).toString();
                localStorage.setItem('parentPin', pin);
                return { success: true, uid: res.user && res.user.uid, pin };
            } catch (err) {
                // Fall back to local implementation on error
                console.warn('Firebase register failed, falling back:', err && err.message);
            }
        }

        if (!parentInfo || !parentInfo.email) {
            throw new Error('parentInfo with email is required');
        }
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const passwordHash = await this.hashPassword(password);
        // Store passwordHash alongside parentInfo
        const infoToStore = Object.assign({}, parentInfo, { passwordHash });
        localStorage.setItem('parentInfo', JSON.stringify(infoToStore));
        localStorage.setItem('isRegistered', 'true');

        // Generate a random 6-digit PIN for backward compatibility (keeps existing flows)
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem('parentPin', pin);

        return { success: true, pin };
    },

    // Login using email & password (client-side sample)
    loginWithEmail: async function(email, password) {
        // Try Firebase auth first (if available)
        if (typeof FirebaseAuthWrapper !== 'undefined' && FirebaseAuthWrapper && FirebaseAuthWrapper.login) {
            try {
                const res = await FirebaseAuthWrapper.login(email, password);
                // On successful Firebase login store minimal parentInfo stub
                const stored = localStorage.getItem('parentInfo');
                const parentInfo = stored ? JSON.parse(stored) : {};
                parentInfo.email = email;
                parentInfo.uid = res.user && res.user.uid;
                localStorage.setItem('parentInfo', JSON.stringify(parentInfo));
                const expiryTime = new Date().getTime() + (30 * 60 * 1000);
                localStorage.setItem('accessExpiry', expiryTime);
                localStorage.setItem('isLoggedIn', 'true');
                // Mark as registered so legacy checks in the app pass
                localStorage.setItem('isRegistered', 'true');
                // Ensure a parentPin exists for compatibility with UI that checks its presence
                if (!localStorage.getItem('parentPin')) {
                    const pin = Math.floor(100000 + Math.random() * 900000).toString();
                    localStorage.setItem('parentPin', pin);
                }
                // Send login notification to parent's phone (without password)
                try {
                    const parentInfoStored = localStorage.getItem('parentInfo');
                    const parentInfoObj = parentInfoStored ? JSON.parse(parentInfoStored) : {};
                    if (parentInfoObj && parentInfoObj.phone) {
                        fetch('/api/send-login-notification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phoneNumber: parentInfoObj.phone, email })
                        }).catch(() => {});
                    }
                } catch (e) { /* ignore notification errors */ }
                return { success: true };
            } catch (err) {
                console.warn('Firebase login failed, falling back:', err && err.message);
                // continue to fallback
            }
        }

        const stored = localStorage.getItem('parentInfo');
        if (!stored) return { success: false, error: 'No account found. Please register.' };

        const parentInfo = JSON.parse(stored);
        if (!parentInfo.email || parentInfo.email.toLowerCase() !== (email || '').toLowerCase()) {
            return { success: false, error: 'No account found for that email' };
        }

        const passwordHash = await this.hashPassword(password);
        if (!parentInfo.passwordHash || parentInfo.passwordHash !== passwordHash) {
            return { success: false, error: 'Invalid email or password' };
        }

        // Set access timeout (30 minutes)
        const expiryTime = new Date().getTime() + (30 * 60 * 1000);
        localStorage.setItem('accessExpiry', expiryTime);
        localStorage.setItem('isLoggedIn', 'true');

        // After local fallback login success, send login notification to parent phone (if available)
        try {
            const parentInfoStored = localStorage.getItem('parentInfo');
            const parentInfoObj = parentInfoStored ? JSON.parse(parentInfoStored) : {};
            if (parentInfoObj && parentInfoObj.phone) {
                fetch('/api/send-login-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber: parentInfoObj.phone, email })
                }).catch(() => {});
            }
        } catch (e) { /* ignore notification errors */ }

        return { success: true };
    },
    
    // Extend session
    extendSession: function() {
        if (this.isLoggedIn()) {
            // Extend for another 30 minutes
            const expiryTime = new Date().getTime() + (30 * 60 * 1000);
            localStorage.setItem('accessExpiry', expiryTime);
            return true;
        }
        return false;
    },
    
    // Get remaining session time in minutes
    getRemainingSessionTime: function() {
        if (this.isLoggedIn()) {
            const accessExpiry = localStorage.getItem('accessExpiry');
            const currentTime = new Date().getTime();
            const remainingTime = parseInt(accessExpiry) - currentTime;
            
            if (remainingTime > 0) {
                return Math.floor(remainingTime / (60 * 1000));
            }
        }
        return 0;
    },
    
    // Check if user has parental controls enabled
    hasParentalControls: function() {
        return localStorage.getItem('parentalControls') === 'true';
    },
    
    // Toggle parental controls
    toggleParentalControls: function(enabled) {
        localStorage.setItem('parentalControls', enabled ? 'true' : 'false');
    },
    
    // Save watch history
    addToWatchHistory: function(videoData) {
        let history = localStorage.getItem('watchHistory');
        history = history ? JSON.parse(history) : [];
        
        // Add timestamp
        videoData.watchedAt = new Date().toISOString();
        
        // Add to beginning of array
        history.unshift(videoData);
        
        // Limit history to 50 items
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('watchHistory', JSON.stringify(history));
        
        // If notification is enabled, send to parent
        if (this.hasParentalControls()) {
            this.sendWatchNotification(videoData);
        }
    },
    
    // Get watch history
    getWatchHistory: function() {
        const history = localStorage.getItem('watchHistory');
        return history ? JSON.parse(history) : [];
    },
    
    // Send notification to parent about watched video
    sendWatchNotification: function(videoData) {
        const parentInfo = this.getParentInfo();
        
        if (parentInfo && parentInfo.phone) {
            fetch('/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: parentInfo.phone,
                    childName: parentInfo.childName,
                    videoTitle: videoData.title
                })
            })
            .then(response => response.json())
            .then(data => console.log('Notification sent:', data))
            .catch(error => console.error('Error sending notification:', error));
        }
    }
};

// Initialize auth system
document.addEventListener('DOMContentLoaded', function() {
    // Update UI based on auth status
    const updateAuthUI = function() {
        const isLoggedIn = Auth.isLoggedIn();
        const isRegistered = Auth.isRegistered();
        
        // Get UI elements
        const loginBtn = document.querySelector('.login-btn');
        const profileIcon = document.querySelector('.profile-icon');
        
        if (loginBtn) {
            if (isLoggedIn) {
                loginBtn.textContent = 'My Account';
                loginBtn.classList.add('logged-in');
            } else if (isRegistered) {
                loginBtn.textContent = 'Login';
                loginBtn.classList.remove('logged-in');
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.classList.remove('logged-in');
            }
        }
        
        if (profileIcon && isLoggedIn) {
            profileIcon.classList.add('logged-in');
        } else if (profileIcon) {
            profileIcon.classList.remove('logged-in');
        }
    };
    
    // Update UI on load
    updateAuthUI();
    
    // Set up logout functionality
    const logoutOption = document.getElementById('logout-option');
    if (logoutOption) {
        logoutOption.addEventListener('click', function() {
            Auth.logout();
            updateAuthUI();
            alert('You have been logged out.');
            window.location.reload();
        });
    }
    
    // Redirect to login page if trying to access protected content
    const protectedContent = document.querySelector('.videos-container');
    if (protectedContent && !Auth.isLoggedIn() && Auth.isRegistered()) {
        window.location.href = 'login.html';
    }
});

window.Auth = Auth;
