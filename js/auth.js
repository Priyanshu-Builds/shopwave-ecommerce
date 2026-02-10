// ShopWave Authentication Module
const Auth = {
    // Check if user is logged in
    isLoggedIn() {
        return !!localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    // Get current user data
    getUser() {
        const userData = localStorage.getItem(CONFIG.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    // Check if user is admin
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // Save auth data to localStorage
    saveAuth(token, user) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    },

    // Register new user
    async register(name, email, password) {
        try {
            const response = await API.post('/auth/register', { name, email, password }, false);
            if (response.success) {
                this.saveAuth(response.token, response.data);
                this.updateNavbar();
                return { success: true, data: response.data };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Login user
    async login(email, password) {
        try {
            const response = await API.post('/auth/login', { email, password }, false);
            if (response.success) {
                this.saveAuth(response.token, response.data);
                this.updateNavbar();
                return { success: true, data: response.data };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Logout user
    logout() {
        this.clearAuth();
        this.updateNavbar();
        window.location.href = window.location.pathname.includes('sub-pages')
            ? '../index.html'
            : './index.html';
    },

    // Get user profile
    async getProfile() {
        try {
            const response = await API.get('/auth/me');
            return response;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Update profile
    async updateProfile(data) {
        try {
            const response = await API.put('/auth/profile', data);
            if (response.success) {
                const user = this.getUser();
                this.saveAuth(localStorage.getItem(CONFIG.TOKEN_KEY), { ...user, ...response.data });
            }
            return response;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Update navbar based on auth state
    updateNavbar() {
        const isLoggedIn = this.isLoggedIn();
        const user = this.getUser();
        const isAdmin = this.isAdmin();
        const isSubPage = window.location.pathname.includes('sub-pages');
        const prefix = isSubPage ? '' : 'sub-pages/';

        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        // Find or create auth link parent
        let authParent = navbar.querySelector('.auth-link-parent');

        // If we don't have an auth-link-parent, try to find by text "Login"
        if (!authParent) {
            const allLinks = navbar.querySelectorAll('li a');
            allLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'Login' || text === 'My Profile' || text.includes('Profile')) {
                    link.parentElement.classList.add('auth-link-parent');
                    authParent = link.parentElement;
                }
            });
        }

        // If still no auth parent, create one before close button
        if (!authParent) {
            const closeBtn = navbar.querySelector('#close');
            const cartItem = navbar.querySelector('.lg-bag');
            authParent = document.createElement('li');
            authParent.className = 'auth-link-parent';

            if (closeBtn) {
                navbar.insertBefore(authParent, closeBtn);
            } else if (cartItem) {
                cartItem.after(authParent);
            } else {
                navbar.appendChild(authParent);
            }
        }

        // Remove any previously added admin/logout links
        const existingAdminLink = navbar.querySelector('.admin-link-parent');
        if (existingAdminLink) existingAdminLink.remove();

        const existingLogoutLink = navbar.querySelector('.logout-link-parent');
        if (existingLogoutLink) existingLogoutLink.remove();

        if (isLoggedIn) {
            // Replace login with profile icon
            authParent.innerHTML = `
        <a href="${prefix}profile.html" class="auth-link" style="display: flex; align-items: center; gap: 5px;">
          <i class="fa-solid fa-user-circle" style="font-size: 18px;"></i>
          <span>${user.name.split(' ')[0]}</span>
        </a>
      `;

            // Add admin link if admin
            if (isAdmin) {
                const adminLi = document.createElement('li');
                adminLi.className = 'admin-link-parent';
                adminLi.innerHTML = `<a href="${prefix}admin.html" style="color: #088178; font-weight: 600;"><i class="fa-solid fa-gear"></i> Admin</a>`;
                authParent.after(adminLi);
            }

            // Add logout link
            const logoutLi = document.createElement('li');
            logoutLi.className = 'logout-link-parent';
            logoutLi.innerHTML = `<a href="#" onclick="Auth.logout(); return false;" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></a>`;

            const lastInserted = navbar.querySelector('.admin-link-parent') || authParent;
            lastInserted.after(logoutLi);

        } else {
            // Show login link
            authParent.innerHTML = `<a href="${prefix}login.html" class="auth-link">Login</a>`;
        }

        // Update footer My Account section
        const footerLinks = document.querySelectorAll('footer .col a');
        footerLinks.forEach(link => {
            if (link.textContent.trim() === 'Sign In' && isLoggedIn) {
                link.textContent = 'My Profile';
                link.href = link.href.replace('login.html', 'profile.html');
            } else if (link.textContent.trim() === 'My Profile' && !isLoggedIn) {
                link.textContent = 'Sign In';
                link.href = link.href.replace('profile.html', 'login.html');
            }
        });
    },

    // Initialize auth state on page load
    init() {
        this.updateNavbar();
        // Load cart count on init if Cart module exists
        setTimeout(() => {
            if (typeof Cart !== 'undefined' && this.isLoggedIn()) {
                Cart.loadCartCount();
            }
        }, 100);
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
