// ShopWave Products Module
const Products = {
    // Generate star rating HTML
    generateStars(rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < Math.floor(rating)) {
                stars += '<i class="fa-solid fa-star"></i>';
            } else if (i < rating) {
                stars += '<i class="fa-solid fa-star-half-alt"></i>';
            } else {
                stars += '<i class="fa-regular fa-star"></i>';
            }
        }
        return stars;
    },

    // Generate product card HTML (matches existing .pro structure)
    generateProductCard(product) {
        const imagePath = product.images[0] || '/assets/products/f1.jpg';
        // Fix image path for different page locations
        const basePath = window.location.pathname.includes('sub-pages') ? '..' : '.';
        const fullImagePath = imagePath.startsWith('/') ? basePath + imagePath : imagePath;
        const productLink = window.location.pathname.includes('sub-pages')
            ? `sproduct.html?id=${product._id}`
            : `sub-pages/sproduct.html?id=${product._id}`;

        return `
      <div class="pro" onclick="window.location.href='${productLink}'">
        <img src="${fullImagePath}" alt="${product.name}">
        <div class="des">
          <span>${product.brand}</span>
          <h5>${product.name}</h5>
          <div class="star">
            ${this.generateStars(product.rating)}
          </div>
          <h4>$${product.price}</h4>
        </div>
        <a href="#" class="cart" onclick="event.stopPropagation(); Cart.addItem('${product._id}'); return false;">
          <i class="fa-solid fa-cart-shopping"></i>
        </a>
      </div>
    `;
    },

    // Fetch and display featured products
    async loadFeatured(containerId = 'featured-products') {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<p>Loading products...</p>';
            const response = await API.get('/products/featured?limit=8', false);

            if (response.success && response.data.length > 0) {
                container.innerHTML = response.data.map(p => this.generateProductCard(p)).join('');
            } else {
                container.innerHTML = '<p>No featured products available.</p>';
            }
        } catch (error) {
            container.innerHTML = '<p>Error loading products. Please try again.</p>';
            console.error('Error loading featured products:', error);
        }
    },

    // Fetch and display new arrivals
    async loadNewArrivals(containerId = 'new-arrivals') {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<p>Loading products...</p>';
            const response = await API.get('/products/new-arrivals?limit=8', false);

            if (response.success && response.data.length > 0) {
                container.innerHTML = response.data.map(p => this.generateProductCard(p)).join('');
            } else {
                container.innerHTML = '<p>No new arrivals available.</p>';
            }
        } catch (error) {
            container.innerHTML = '<p>Error loading products. Please try again.</p>';
            console.error('Error loading new arrivals:', error);
        }
    },

    // Fetch and display all products (for shop page)
    async loadAll(containerId = 'products-container', page = 1, filters = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            container.innerHTML = '<p>Loading products...</p>';

            // Build query string
            let query = `?page=${page}&limit=12`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            if (filters.category) query += `&category=${filters.category}`;
            if (filters.brand) query += `&brand=${encodeURIComponent(filters.brand)}`;

            const response = await API.get(`/products${query}`, false);

            if (response.success && response.data.length > 0) {
                container.innerHTML = response.data.map(p => this.generateProductCard(p)).join('');
                this.updatePagination(response.page, response.pages, filters);
            } else {
                container.innerHTML = '<p>No products found.</p>';
            }
        } catch (error) {
            container.innerHTML = '<p>Error loading products. Please try again.</p>';
            console.error('Error loading products:', error);
        }
    },

    // Update pagination controls
    updatePagination(currentPage, totalPages, filters = {}) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        let html = '';

        // Previous button
        if (currentPage > 1) {
            html += `<a href="#" onclick="Products.loadAll('products-container', ${currentPage - 1}, ${JSON.stringify(filters).replace(/"/g, "'")}); return false;"><i class="fa-solid fa-arrow-left"></i></a>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<a href="#" class="active">${i}</a>`;
            } else {
                html += `<a href="#" onclick="Products.loadAll('products-container', ${i}, ${JSON.stringify(filters).replace(/"/g, "'")}); return false;">${i}</a>`;
            }
        }

        // Next button
        if (currentPage < totalPages) {
            html += `<a href="#" onclick="Products.loadAll('products-container', ${currentPage + 1}, ${JSON.stringify(filters).replace(/"/g, "'")}); return false;"><i class="fa-solid fa-arrow-right"></i></a>`;
        }

        paginationContainer.innerHTML = html;
    },

    // Get single product details
    async getProduct(productId) {
        try {
            const response = await API.get(`/products/${productId}`, false);
            return response;
        } catch (error) {
            console.error('Error fetching product:', error);
            return { success: false, message: error.message };
        }
    },

    // Load product details page
    async loadProductDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            console.error('No product ID provided');
            return;
        }

        try {
            const response = await this.getProduct(productId);

            if (response.success) {
                const product = response.data;
                const basePath = window.location.pathname.includes('sub-pages') ? '..' : '.';

                // Update main image
                const mainImg = document.getElementById('mainImg');
                if (mainImg && product.images[0]) {
                    mainImg.src = basePath + product.images[0];
                }

                // Generate size options based on product sizes or category
                let sizeOptions = '<option value="">Select Size</option>';
                if (product.sizes && product.sizes.length > 0) {
                    // Use product-specific sizes with stock
                    product.sizes.forEach(s => {
                        if (s.stock > 0) {
                            sizeOptions += `<option value="${s.size}">${s.size} (${s.stock} in stock)</option>`;
                        }
                    });
                } else {
                    // Fall back to category-based sizes
                    const catSlug = product.category?.slug?.toLowerCase() || product.category?.name?.toLowerCase() || '';
                    let defaultSizes = [];

                    if (catSlug.includes('t-shirt') || catSlug.includes('shirt')) {
                        defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                    } else if (catSlug.includes('pant')) {
                        defaultSizes = ['28', '30', '32', '34', '36', '38', '40', '42'];
                    } else if (catSlug.includes('shoe')) {
                        defaultSizes = ['6', '7', '8', '9', '10', '11', '12', '13'];
                    } else {
                        defaultSizes = ['S', 'M', 'L', 'XL'];
                    }

                    defaultSizes.forEach(size => {
                        sizeOptions += `<option value="${size}">${size}</option>`;
                    });
                }

                // Update product details
                const detailsContainer = document.querySelector('.single-pro-details');
                if (detailsContainer) {
                    detailsContainer.innerHTML = `
            <h5>Home / ${product.category?.name || 'Product'}</h5>
            <h4>${product.name}</h4>
            <h2>$${product.price.toFixed(2)}</h2>
            <select id="product-size">
              ${sizeOptions}
            </select>
            <input type="number" id="product-quantity" value="1" min="1" max="${product.stock}">
            <button class="normal" onclick="Cart.addItem('${product._id}', parseInt(document.getElementById('product-quantity').value), document.getElementById('product-size').value)">Add to cart</button>
            <h4>Product Details</h4>
            <span>${product.description}</span>
            <p><strong>Brand:</strong> ${product.brand}</p>
            <p><strong>Stock:</strong> ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</p>
          `;
                }

                // Store product data for later use
                window.currentProduct = product;

                // Load related products from same category
                if (product.category) {
                    const categoryId = product.category._id || product.category;
                    this.loadRelatedProducts(categoryId, product._id);
                }
            }
        } catch (error) {
            console.error('Error loading product details:', error);
        }
    },

    // Load related products from same category
    async loadRelatedProducts(categoryId, excludeProductId) {
        const container = document.querySelector('#product1 .pro-container');
        if (!container) return;

        try {
            container.innerHTML = '<p>Loading related products...</p>';
            const response = await API.get(`/products?category=${categoryId}&limit=4`, false);

            if (response.success && response.data.length > 0) {
                // Filter out current product and limit to 4
                const related = response.data
                    .filter(p => p._id !== excludeProductId)
                    .slice(0, 4);

                if (related.length > 0) {
                    container.innerHTML = related.map(p => this.generateProductCard(p)).join('');
                } else {
                    // If no related products, show featured
                    const featuredResponse = await API.get('/products/featured?limit=4', false);
                    if (featuredResponse.success) {
                        const featured = featuredResponse.data.filter(p => p._id !== excludeProductId).slice(0, 4);
                        container.innerHTML = featured.map(p => this.generateProductCard(p)).join('');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    },

    // Load categories for filter dropdown
    async loadCategories(selectId = 'category-filter') {
        const select = document.getElementById(selectId);
        if (!select) return;

        try {
            const response = await API.get('/categories', false);
            if (response.success) {
                let options = '<option value="">All Categories</option>';
                response.data.forEach(cat => {
                    options += `<option value="${cat._id}">${cat.name}</option>`;
                });
                select.innerHTML = options;
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
};

// Initialize products on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on and load appropriate products
    const path = window.location.pathname;

    if (path.includes('sproduct.html')) {
        Products.loadProductDetails();
    }
});
