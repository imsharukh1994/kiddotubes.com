document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabs = document.querySelectorAll('.login-tab');
    const contents = document.querySelectorAll('.login-content');
    
    // Check for hash fragment to determine which tab to show
    const showTab = (tabName) => {
        // Find the tab
        const tab = document.querySelector(`.login-tab[data-tab="${tabName}"]`);
        if (!tab) return;
        
    };
    
    const loginTab = document.querySelector('.login-tab[data-tab="login"]');
    const registerTab = document.querySelector('.login-tab[data-tab="register"]');
    const loginContent = document.querySelector('.login-content#login-content');
    const registerContent = document.querySelector('.login-content#register-content');
    
    if (loginTab) {
        loginTab.addEventListener('click', function() {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginContent.classList.add('active');
            registerContent.classList.remove('active');
        });
    }
    
    if (registerTab) {
        registerTab.addEventListener('click', function() {
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
            input.addEventListener('keyup', function(e) {
                // If a number is entered, move to the next input
                if (e.key >= 0 && e.key <= 9) {
                    if (index < pinInputs.length - 1) {
                        pinInputs[index + 1].focus();
                    }
                }
                // If backspace is pressed, move to the previous input
                else if (e.key === 'Backspace') {
                    if (index > 0) {
                        pinInputs[index - 1].focus();
                    }
                }
            });
        });
    }
    
    // PIN Login Implementation
    const loginSubmit = document.getElementById('login-submit');
    const loginError = document.getElementById('login-error');
    
    if (loginSubmit) {
        // Handle PIN input auto-focus and navigation
        pinInputs.forEach((input, index) => {
            // Focus on input when clicked
            input.addEventListener('click', function() {
                this.select();
            });
            
            // Handle input changes
            input.addEventListener('input', function() {
                if (this.value.length === 1) {
                    // Move to next input if available
                    if (index < pinInputs.length - 1) {
                        pinInputs[index + 1].focus();
                        pinInputs[index + 1].select();
                    }
                }
            });
            
            // Handle backspace key
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && this.value === '' && index > 0) {
                    // Move to previous input if current is empty
                    pinInputs[index - 1].focus();
                    pinInputs[index - 1].select();
                }
            });
        });
        
        // Login button click handler
        loginSubmit.addEventListener('click', function() {
            let enteredOtp = '';
            pinInputs.forEach(input => {
                enteredOtp += input.value;
            });
            
            // Replace with your actual OTP validation logic
            if (enteredOtp === '1234') { // Example OTP
                if(loginError) loginError.textContent = '';
                alert('Login successful!');
                // Redirect to the main page or dashboard
                window.location.href = 'index.html'; 
            } else {
                if(loginError) loginError.textContent = 'Invalid PIN. Please try again.';
            }
        });
    }

    // Login and Register form submission
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if(loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add login logic here
            console.log('Login form submitted');
            window.location.href = 'index.html';
        });
    }

    if(registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add registration logic here
            console.log('Register form submitted');
            window.location.href = 'index.html';
        });
    }
});
