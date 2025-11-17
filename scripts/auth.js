class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showApp();
            } catch (e) {
                console.error('Error parsing saved user:', e);
                this.showAuthModal();
            }
        } else {
            this.showAuthModal();
        }

        this.bindEvents();
    }

    bindEvents() {
        // Auth modal events
        const closeAuthModal = document.getElementById('closeAuthModal');
        const authSwitchLink = document.getElementById('authSwitchLink');

        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', () => this.showAuthModal(false));
        }

        if (authSwitchLink) {
            authSwitchLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthMode();
            });
        }

        // Auth tab events
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const authMode = e.target.dataset.auth;
                this.switchAuthForm(authMode);
            });
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Close modal when clicking outside
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target.id === 'authModal') {
                    this.showAuthModal(false);
                }
            });
        }
    }

    showAuthModal(show = true) {
        const authModal = document.getElementById('authModal');
        const app = document.getElementById('app');
        
        if (show) {
            authModal.classList.remove('hidden');
            if (app) app.classList.add('hidden');
        } else {
            authModal.classList.add('hidden');
            if (this.currentUser && app) {
                app.classList.remove('hidden');
            }
        }
    }

    switchAuthMode() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (!loginForm || !signupForm) return;

        if (loginForm.classList.contains('hidden')) {
            // Switch to login
            this.switchAuthForm('login');
        } else {
            // Switch to signup
            this.switchAuthForm('signup');
        }
    }

    switchAuthForm(authMode) {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const loginTab = document.querySelector('[data-auth="login"]');
        const signupTab = document.querySelector('[data-auth="signup"]');
        const authModalTitle = document.getElementById('authModalTitle');

        if (!loginForm || !signupForm || !loginTab || !signupTab) return;

        if (authMode === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            if (authModalTitle) authModalTitle.textContent = 'Login to Lost & Found';
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            loginTab.classList.remove('active');
            signupTab.classList.add('active');
            if (authModalTitle) authModalTitle.textContent = 'Create Account';
        }

        this.updateAuthSwitchText();
    }

    updateAuthSwitchText() {
        const authSwitchText = document.getElementById('authSwitchText');
        const loginForm = document.getElementById('loginForm');
        
        if (!authSwitchText || !loginForm) return;

        if (loginForm.classList.contains('hidden')) {
            authSwitchText.innerHTML = 'Already have an account? <a href="#" id="authSwitchLink">Login here</a>';
        } else {
            authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="authSwitchLink">Sign up here</a>';
        }

        // Re-bind the switch link event
        const newAuthSwitchLink = document.getElementById('authSwitchLink');
        if (newAuthSwitchLink) {
            newAuthSwitchLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthMode();
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('Login attempt...');
        
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Debug: Check what users exist
        console.log('All users in database:', database.getUsers());

        // Find user
        const user = database.findUserByEmail(email);
        console.log('Found user:', user);
        
        if (!user) {
            this.showNotification('User not found. Please check your email or sign up.', 'error');
            return;
        }

        console.log('Input password:', password);
        console.log('Stored password:', user.password);

        if (user.password !== password) {
            this.showNotification('Invalid password', 'error');
            return;
        }

        // Login successful
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showApp();
        this.showNotification(`Welcome back, ${user.name}!`);
    }

    async handleSignup(e) {
        e.preventDefault();
        console.log('Signup attempt...');
        
        const name = document.getElementById('signupName')?.value;
        const email = document.getElementById('signupEmail')?.value;
        const password = document.getElementById('signupPassword')?.value;
        const role = document.getElementById('userRole')?.value;

        console.log('Signup data:', { name, email, password, role });

        // Validation
        if (!name || !email || !password || !role) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        // Check if user already exists
        const existingUser = database.findUserByEmail(email);
        console.log('Existing user check:', existingUser);
        
        if (existingUser) {
            this.showNotification('User with this email already exists', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: database.generateId(),
            name,
            email,
            password, // In real app, hash this password
            role,
            createdAt: new Date().toISOString()
        };

        console.log('New user to save:', newUser);

        try {
            const savedUser = database.saveUser(newUser);
            console.log('User saved successfully:', savedUser);
            
            // Verify the user was saved
            const allUsers = database.getUsers();
            console.log('All users after save:', allUsers);
            
            this.currentUser = newUser;
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            
            this.showApp();
            this.showNotification(`Account created successfully! Welcome, ${name}`);
        } catch (error) {
            console.error('Error creating account:', error);
            this.showNotification('Error creating account. Please try again.', 'error');
        }
    }

    showApp() {
        this.showAuthModal(false);
        
        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('hidden');
        }
        
        // Update UI based on user role
        this.updateUIForUser();
        
        // Initialize the main app
        this.initializeMainApp();
    }

    initializeMainApp() {
        // Wait a bit for the DOM to update
        setTimeout(() => {
            if (typeof LostFoundApp !== 'undefined') {
                window.app = new LostFoundApp();
                window.app.init();
            } else {
                console.log('LostFoundApp not available yet');
            }
        }, 100);
    }

    updateUIForUser() {
        const userInfo = document.getElementById('userInfo');
        const adminElements = document.querySelectorAll('.admin-only');

        if (this.currentUser && userInfo) {
            userInfo.textContent = `Welcome, ${this.currentUser.name}!`;

            // Show/hide admin elements
            if (this.currentUser.role === 'admin') {
                adminElements.forEach(el => el.classList.remove('hidden'));
            } else {
                adminElements.forEach(el => el.classList.add('hidden'));
            }
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuthModal(true);
        
        const app = document.getElementById('app');
        if (app) {
            app.classList.add('hidden');
        }
        
        // Clear forms
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
        
        this.showNotification('Logged out successfully');
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notificationMessage');
        
        if (!notification || !messageEl) {
            // Fallback to alert if notification elements not found
            alert(`${type.toUpperCase()}: ${message}`);
            return;
        }

        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        // Update icon based on type
        const icon = notification.querySelector('i');
        if (icon) {
            icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        }

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth...');
    
    // Check if database is available
    if (typeof database === 'undefined') {
        console.error('Database not found. Make sure database.js is loaded first.');
        return;
    }
    
    window.auth = new Auth();
});