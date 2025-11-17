class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
        } else {
            this.showAuthModal();
        }

        this.bindEvents();
    }

    bindEvents() {
        // Auth modal events
        document.getElementById('closeAuthModal').addEventListener('click', () => this.showAuthModal(false));
        document.getElementById('authSwitchLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthMode();
        });

        // Auth tab events
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const authMode = e.target.dataset.auth;
                this.switchAuthForm(authMode);
            });
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Close modal when clicking outside
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.showAuthModal(false);
            }
        });
    }

    showAuthModal(show = true) {
        const authModal = document.getElementById('authModal');
        const app = document.getElementById('app');
        
        if (show) {
            authModal.classList.remove('hidden');
            app.classList.add('hidden');
        } else {
            authModal.classList.add('hidden');
            if (this.currentUser) {
                app.classList.remove('hidden');
            }
        }
    }

    switchAuthMode() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const authSwitchText = document.getElementById('authSwitchText');
        const authSwitchLink = document.getElementById('authSwitchLink');
        const loginTab = document.querySelector('[data-auth="login"]');
        const signupTab = document.querySelector('[data-auth="signup"]');

        if (loginForm.classList.contains('hidden')) {
            // Switch to login
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="authSwitchLink">Sign up here</a>';
            document.getElementById('authModalTitle').textContent = 'Login to Lost & Found';
        } else {
            // Switch to signup
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            loginTab.classList.remove('active');
            signupTab.classList.add('active');
            authSwitchText.innerHTML = 'Already have an account? <a href="#" id="authSwitchLink">Login here</a>';
            document.getElementById('authModalTitle').textContent = 'Create Account';
        }

        // Re-bind the switch link event
        document.getElementById('authSwitchLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthMode();
        });
    }

    switchAuthForm(authMode) {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const loginTab = document.querySelector('[data-auth="login"]');
        const signupTab = document.querySelector('[data-auth="signup"]');

        if (authMode === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            document.getElementById('authModalTitle').textContent = 'Login to Lost & Found';
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            loginTab.classList.remove('active');
            signupTab.classList.add('active');
            document.getElementById('authModalTitle').textContent = 'Create Account';
        }

        this.updateAuthSwitchText();
    }

    updateAuthSwitchText() {
        const authSwitchText = document.getElementById('authSwitchText');
        const loginForm = document.getElementById('loginForm');
        
        if (loginForm.classList.contains('hidden')) {
            authSwitchText.innerHTML = 'Already have an account? <a href="#" id="authSwitchLink">Login here</a>';
        } else {
            authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="authSwitchLink">Sign up here</a>';
        }

        // Re-bind the switch link event
        document.getElementById('authSwitchLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthMode();
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Simple validation
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Find user
        const user = database.findUserByEmail(email);
        
        if (!user || user.password !== password) { // In real app, compare hashed passwords
            this.showNotification('Invalid email or password', 'error');
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
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const role = document.getElementById('userRole').value;

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
        if (database.findUserByEmail(email)) {
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

        database.saveUser(newUser);
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.showApp();
        this.showNotification(`Account created successfully! Welcome, ${name}`);
    }

    showApp() {
    this.showAuthModal(false);
    document.getElementById('app').classList.remove('hidden');
    
    // Update UI based on user role
    this.updateUIForUser();
    
    // Initialize the main app
    setTimeout(() => {
        initializeMainApp();
    }, 100);
}
    updateUIForUser() {
        const userInfo = document.getElementById('userInfo');
        const adminElements = document.querySelectorAll('.admin-only');

        if (this.currentUser) {
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
        document.getElementById('app').classList.add('hidden');
        
        // Clear forms
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
        
        this.showNotification('Logged out successfully');
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notificationMessage');
        
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        // Update icon based on type
        const icon = notification.querySelector('i');
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';

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

function initializeMainApp() {
    if (typeof LostFoundApp !== 'undefined') {
        window.app = new LostFoundApp();
        window.app.init();
    } else {
        console.error('LostFoundApp not found');
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});