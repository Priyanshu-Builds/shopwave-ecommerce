// ShopWave API Service
const API = {
    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    // Build headers with optional auth
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return headers;
    },

    // Generic fetch wrapper with retry for cold starts
    async request(endpoint, options = {}, retries = 2) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.auth !== false),
            ...options
        };

        // Don't include body for GET/HEAD requests
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Add 45s timeout for Render cold starts
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000);
                config.signal = controller.signal;

                const response = await fetch(url, config);
                clearTimeout(timeoutId);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Request failed');
                }

                return data;
            } catch (error) {
                clearTimeout && clearTimeout;
                if (attempt < retries && (error.name === 'AbortError' || error.message === 'Failed to fetch')) {
                    console.log(`API retry ${attempt + 1}/${retries} for ${endpoint}...`);
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                console.error('API Error:', error);
                throw error;
            }
        }
    },

    // GET request
    async get(endpoint, auth = true) {
        return this.request(endpoint, { method: 'GET', auth });
    },

    // POST request
    async post(endpoint, body, auth = true) {
        return this.request(endpoint, { method: 'POST', body, auth });
    },

    // PUT request
    async put(endpoint, body, auth = true) {
        return this.request(endpoint, { method: 'PUT', body, auth });
    },

    // DELETE request
    async delete(endpoint, auth = true) {
        return this.request(endpoint, { method: 'DELETE', auth });
    }
};
