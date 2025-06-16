document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const loginTab = document.querySelector('.login-tab[data-tab="login"]');
    const registerTab = document.querySelector('.login-tab[data-tab="register"]');
    const loginContent = document.querySelector('.login-content#login-content');
    const registerContent = document.querySelector('.login-content#register-content');

    if (loginTab && registerTab && loginContent && registerContent) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginContent.classList.add('active');
            registerContent.classList.remove('active');
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerContent.classList.add('active');
            loginContent.classList.remove('active');
        });
    }

    // Handle PIN input for OTP
    const pinInputs = document.querySelectorAll('.pin-input');
    if (pinInputs.length > 0) {
        pinInputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                if (e.key >= 0 && e.key <= 9) {
                    if (index < pinInputs.length - 1) {
                        pinInputs[index + 1].focus();
                    }
                } else if (e.key === 'Backspace') {
                    if (index > 0) {
                        pinInputs[index - 1].focus();
                    }
                }
            });

            input.addEventListener('click', function() {
                this.select();
            });

            input.addEventListener('input', function() {
                if (this.value.length === 1) {
                    if (index < pinInputs.length - 1) {
                        pinInputs[index + 1].focus();
                        pinInputs[index + 1].select();
                    }
                }
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && this.value === '' && index > 0) {
                    pinInputs[index - 1].focus();
                    pinInputs[index - 1].select();
                }
            });
        });
    }

    // PIN Login Implementation
    const loginSubmit = document.getElementById('login-submit');
    const loginError = document.getElementById('login-error');
    if (loginSubmit) {
        loginSubmit.addEventListener('click', () => {
            let enteredOtp = '';
            pinInputs.forEach(input => {
                enteredOtp += input.value;
            });

            if (enteredOtp.length !== 6) {
                if(loginError) loginError.textContent = 'Please enter the 6-digit OTP.';
                return;
            }

            const parentInfo = JSON.parse(localStorage.getItem('parentInfo'));
            if (!parentInfo || !parentInfo.phone) {
                if(loginError) loginError.textContent = 'Could not find registration details. Please register again.';
                return;
            }

            loginSubmit.disabled = true;
            loginSubmit.textContent = 'Verifying...';
            if(loginError) loginError.textContent = '';

            fetch('http://localhost:3000/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: parentInfo.phone,
                    otp: enteredOtp
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const expiryTime = new Date().getTime() + (30 * 60 * 1000);
                    localStorage.setItem('accessExpiry', expiryTime);
                    localStorage.setItem('isLoggedIn', 'true');
                    alert('Login successful! Redirecting to the main page.');
                    window.location.href = 'index.html';
                } else {
                    if(loginError) loginError.textContent = data.error || 'Incorrect OTP. Please try again.';
                    pinInputs.forEach(input => input.value = '');
                    if(pinInputs.length > 0) pinInputs[0].focus();
                    loginSubmit.disabled = false;
                    loginSubmit.textContent = 'Login';
                }
            })
            .catch(error => {
                if(loginError) loginError.textContent = 'An error occurred during verification.';
                loginSubmit.disabled = false;
                loginSubmit.textContent = 'Login';
                console.error('Error:', error);
            });
        });
    }

    // Handle forgot PIN link
    const forgotPinLink = document.querySelector('.forgot-pin');
    if (forgotPinLink) {
        forgotPinLink.addEventListener('click', (e) => {
            e.preventDefault();

            const parentInfo = JSON.parse(localStorage.getItem('parentInfo'));
            if (!parentInfo || !parentInfo.phone) {
                if(loginError) loginError.textContent = 'No account found. Please register first.';
                return;
            }

            if(loginError) loginError.textContent = 'Requesting a new OTP...';

            fetch('http://localhost:3000/api/generate-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: parentInfo.phone,
                    childName: parentInfo.childName
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('A new OTP has been sent to your registered phone number.');
                    if(loginError) loginError.textContent = '';
                } else {
                    if(loginError) loginError.textContent = data.error || 'Could not send a new OTP.';
                }
            })
            .catch(error => {
                if(loginError) loginError.textContent = 'An error occurred while requesting a new OTP.';
                console.error('Error:', error);
            });
        });
    }

    // Registration form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const parentName = document.getElementById('parent-name').value.trim();
            const parentEmail = document.getElementById('parent-email').value.trim();
            const parentPhone = document.getElementById('parent-phone').value.trim();
            const childName = document.getElementById('child-name').value.trim();
            const termsChecked = document.getElementById('terms-checkbox').checked;
            const registerError = document.getElementById('register-error');
            
            if (!termsChecked) {
                if(registerError) registerError.textContent = 'Please agree to the Terms and Conditions';
                return;
            }
            
            if (!parentPhone) {
                if(registerError) registerError.textContent = 'Phone number is required for verification';
                return;
            }
            
            const registerSubmit = document.querySelector('#register-form button[type="submit"]');
            registerSubmit.disabled = true;
            registerSubmit.textContent = 'Processing...';
            if(registerError) registerError.textContent = '';
            
            const parentInfo = {
                name: parentName,
                email: parentEmail,
                phone: parentPhone,
                childName: childName,
                registrationDate: new Date().toISOString()
            };
            
            localStorage.setItem('parentInfo', JSON.stringify(parentInfo));
            localStorage.setItem('isRegistered', 'true');

            fetch('http://localhost:3000/api/generate-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: parentPhone,
                    childName: childName
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Registration successful! An OTP has been sent to your phone.');
                    window.location.hash = 'login';
                    window.location.reload();
                } else {
                    if(registerError) registerError.textContent = data.error || 'Could not send OTP.';
                    registerSubmit.disabled = false;
                    registerSubmit.textContent = 'Register';
                }
            })
            .catch(error => {
                if(registerError) registerError.textContent = 'An error occurred during registration.';
                registerSubmit.disabled = false;
                registerSubmit.textContent = 'Register';
                console.error('Error:', error);
            });
        });
    }
});
