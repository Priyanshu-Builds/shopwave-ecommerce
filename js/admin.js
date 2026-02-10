// ShopWave Admin Module - Enhanced with Image Upload
const Admin = {
  // Global storage for categories
  categories: [],

  // Check if user is admin
  checkAdminAccess() {
    if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
      alert('Access denied. Admin privileges required.');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  // Load dashboard stats
  async loadDashboard() {
    if (!this.checkAdminAccess()) return;

    try {
      const response = await API.get('/admin/stats');
      if (response.success) {
        this.renderDashboard(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  },

  // Render dashboard with clean UI
  renderDashboard(data) {
    const statsContainer = document.getElementById('admin-stats');
    if (statsContainer) {
      // Calculate real data
      const lowStockCount = data.lowStockProducts || 0;
      const pendingCount = data.pendingOrders || 0;
      const paidCount = data.paidOrders || 0;

      // Stock badge
      const stockBadgeClass = lowStockCount > 0 ? 'warning' : 'success';
      const stockBadgeText = lowStockCount > 0 ? `${lowStockCount} Low` : 'In Stock';

      // Orders badge
      const orderBadgeClass = pendingCount > 0 ? 'warning' : 'success';
      const orderBadgeText = pendingCount > 0 ? `${pendingCount} Pending` : 'Fulfilled';

      statsContainer.innerHTML = `
        <div class="stat-card stat-users">
          <div class="stat-icon">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="stat-info">
            <h3>${data.totalUsers}</h3>
            <p>Registered Users</p>
          </div>
        </div>
        <div class="stat-card stat-products">
          <div class="stat-icon">
            <i class="fa-solid fa-box"></i>
          </div>
          <div class="stat-info">
            <h3>${data.totalProducts}</h3>
            <p>Products</p>
          </div>
          <span class="stat-badge ${stockBadgeClass}">${stockBadgeText}</span>
        </div>
        <div class="stat-card stat-orders">
          <div class="stat-icon">
            <i class="fa-solid fa-shopping-cart"></i>
          </div>
          <div class="stat-info">
            <h3>${data.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
          <span class="stat-badge ${orderBadgeClass}">${orderBadgeText}</span>
        </div>
        <div class="stat-card stat-revenue">
          <div class="stat-icon">
            <i class="fa-solid fa-dollar-sign"></i>
          </div>
          <div class="stat-info">
            <h3>$${data.totalRevenue.toFixed(2)}</h3>
            <p>Revenue</p>
          </div>
          <span class="stat-badge success">${paidCount} Paid</span>
        </div>
      `;
    }

    // Render recent orders with improved UI
    const recentOrdersContainer = document.getElementById('recent-orders');
    if (recentOrdersContainer && data.recentOrders) {
      let html = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3><i class="fa-solid fa-clock-rotate-left"></i> Recent Orders</h3>
            <a href="#" onclick="showAdminSection('orders'); return false;" class="view-all-link">
              View All <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
          <div class="orders-list">
      `;

      if (data.recentOrders.length === 0) {
        html += `
          <div class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p>No orders yet</p>
          </div>
        `;
      } else {
        data.recentOrders.forEach(order => {
          const statusClass = order.orderStatus || 'processing';
          const paymentClass = order.paymentStatus || 'pending';
          const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          html += `
            <div class="order-card">
              <div class="order-card-header">
                <div class="order-id">
                  <i class="fa-solid fa-receipt"></i>
                  <span>#${order._id.slice(-8).toUpperCase()}</span>
                </div>
                <span class="order-date">${orderDate}</span>
              </div>
              <div class="order-card-body">
                <div class="customer-info">
                  <i class="fa-solid fa-user"></i>
                  <span>${order.user?.name || 'Guest'}</span>
                </div>
                <div class="order-amount">
                  <span class="amount">$${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <div class="order-card-footer">
                <span class="status-pill status-${statusClass}">${statusClass}</span>
                <span class="status-pill payment-${paymentClass}">${paymentClass}</span>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
      recentOrdersContainer.innerHTML = html;
    }
  },

  // Load categories
  async loadCategories() {
    try {
      const response = await API.get('/categories', false);
      if (response.success) {
        this.categories = response.data;
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  },

  // Load all products for admin
  async loadProducts() {
    try {
      await this.loadCategories();
      const response = await API.get('/products?limit=100', false);
      if (response.success) {
        this.renderAdminProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  },

  // Render admin products table
  renderAdminProducts(products) {
    const container = document.getElementById('admin-products');
    if (!container) return;

    const basePath = '..';

    let html = `
      <div class="admin-toolbar">
        <button class="btn-primary" onclick="Admin.showProductForm()">
          <i class="fa-solid fa-plus"></i> Add New Product
        </button>
        <div class="search-box">
          <input type="text" id="product-search" placeholder="Search products..." onkeyup="Admin.filterProducts(this.value)">
          <i class="fa-solid fa-search"></i>
        </div>
      </div>
      
      <div class="table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="products-tbody">
    `;

    products.forEach(product => {
      const imagePath = product.images?.[0] || '/assets/products/f1.jpg';
      const fullImagePath = imagePath.startsWith('/') ? basePath + imagePath : imagePath;
      const stockClass = product.stock <= 5 ? 'low-stock' : product.stock <= 20 ? 'medium-stock' : 'in-stock';

      html += `
        <tr data-product-id="${product._id}" class="product-row">
          <td>
            <div class="product-image-cell">
              <img src="${fullImagePath}" alt="${product.name}" onerror="this.src='../assets/products/f1.jpg'">
            </div>
          </td>
          <td>
            <div class="product-name-cell">
              <strong>${product.name}</strong>
              <small>${product.brand || 'No brand'}</small>
            </div>
          </td>
          <td><span class="price-badge">$${product.price.toFixed(2)}</span></td>
          <td>
            <div class="stock-cell">
              <input type="number" value="${product.stock}" min="0" 
                class="stock-input ${stockClass}"
                onchange="Admin.updateStock('${product._id}', this.value)">
              <span class="stock-status ${stockClass}">
                ${product.stock <= 5 ? 'Low' : product.stock <= 20 ? 'Medium' : 'In Stock'}
              </span>
            </div>
          </td>
          <td>${product.category?.name || 'Uncategorized'}</td>
          <td>
            <div class="status-badges">
              ${product.isFeatured ? '<span class="badge badge-featured">Featured</span>' : ''}
              ${product.isNewArrival ? '<span class="badge badge-new">New</span>' : ''}
              ${!product.isFeatured && !product.isNewArrival ? '<span class="badge badge-normal">Normal</span>' : ''}
            </div>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="Admin.editProduct('${product._id}')" class="btn-icon btn-edit" title="Edit">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="Admin.previewProduct('${product._id}')" class="btn-icon btn-view" title="Preview">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button onclick="Admin.deleteProduct('${product._id}')" class="btn-icon btn-delete" title="Delete">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
    window.allProducts = products;
  },

  // Filter products
  filterProducts(query) {
    if (!window.allProducts) return;
    const filtered = window.allProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand?.toLowerCase().includes(query.toLowerCase())
    );

    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products found</td></tr>';
      return;
    }

    // Re-render filtered products
    const basePath = '..';
    let html = '';
    filtered.forEach(product => {
      const imagePath = product.images?.[0] || '/assets/products/f1.jpg';
      const fullImagePath = imagePath.startsWith('/') ? basePath + imagePath : imagePath;
      const stockClass = product.stock <= 5 ? 'low-stock' : product.stock <= 20 ? 'medium-stock' : 'in-stock';

      html += `
        <tr data-product-id="${product._id}">
          <td><div class="product-image-cell"><img src="${fullImagePath}" alt="${product.name}" onerror="this.src='../assets/products/f1.jpg'"></div></td>
          <td><div class="product-name-cell"><strong>${product.name}</strong><small>${product.brand || ''}</small></div></td>
          <td><span class="price-badge">$${product.price.toFixed(2)}</span></td>
          <td><div class="stock-cell"><input type="number" value="${product.stock}" class="stock-input ${stockClass}" onchange="Admin.updateStock('${product._id}', this.value)"><span class="stock-status ${stockClass}">${product.stock <= 5 ? 'Low' : product.stock <= 20 ? 'Medium' : 'In Stock'}</span></div></td>
          <td>${product.category?.name || 'Uncategorized'}</td>
          <td><div class="status-badges">${product.isFeatured ? '<span class="badge badge-featured">Featured</span>' : ''}${product.isNewArrival ? '<span class="badge badge-new">New</span>' : ''}</div></td>
          <td><div class="action-buttons"><button onclick="Admin.editProduct('${product._id}')" class="btn-icon btn-edit"><i class="fa-solid fa-pen-to-square"></i></button><button onclick="Admin.deleteProduct('${product._id}')" class="btn-icon btn-delete"><i class="fa-solid fa-trash"></i></button></div></td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  },

  // Update stock inline
  async updateStock(productId, newStock) {
    try {
      const response = await API.put(`/products/${productId}`, { stock: parseInt(newStock) });
      if (response.success) {
        this.showNotification('Stock updated successfully!', 'success');
        const input = document.querySelector(`tr[data-product-id="${productId}"] .stock-input`);
        if (input) {
          const stockClass = newStock <= 5 ? 'low-stock' : newStock <= 20 ? 'medium-stock' : 'in-stock';
          input.className = `stock-input ${stockClass}`;
          const statusSpan = input.nextElementSibling;
          if (statusSpan) {
            statusSpan.className = `stock-status ${stockClass}`;
            statusSpan.textContent = newStock <= 5 ? 'Low' : newStock <= 20 ? 'Medium' : 'In Stock';
          }
        }
      }
    } catch (error) {
      this.showNotification('Failed to update stock', 'error');
    }
  },

  // Show product form with image upload
  showProductForm(product = null) {
    const isEdit = !!product;
    const basePath = '..';

    const categoryOptions = this.categories.map(cat =>
      `<option value="${cat._id}" ${product?.category?._id === cat._id || product?.category === cat._id ? 'selected' : ''}>${cat.name}</option>`
    ).join('');

    const currentImage = product?.images?.[0] || '/assets/products/f1.jpg';
    const fullImagePath = currentImage.startsWith('/') ? basePath + currentImage : currentImage;
    const productId = product?._id || '';

    const modalHtml = `
      <div id="product-modal" class="admin-modal" onclick="if(event.target === this) Admin.closeModal()">
        <div class="modal-content modal-large" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2><i class="fa-solid fa-${isEdit ? 'pen-to-square' : 'plus'}"></i> ${isEdit ? 'Edit Product' : 'Add New Product'}</h2>
            <button type="button" class="modal-close" id="close-modal-btn">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="form-row">
              <div class="form-col">
                <div class="form-group">
                  <label><i class="fa-solid fa-tag"></i> Product Name *</label>
                  <input type="text" id="product-name" value="${product?.name || ''}" required placeholder="Enter product name">
                </div>
                
                <div class="form-group">
                  <label><i class="fa-solid fa-building"></i> Brand *</label>
                  <input type="text" id="product-brand" value="${product?.brand || ''}" required placeholder="Enter brand name">
                </div>
                
                <div class="form-row-inline">
                  <div class="form-group">
                    <label><i class="fa-solid fa-dollar-sign"></i> Price *</label>
                    <input type="number" id="product-price" step="0.01" min="0" value="${product?.price || ''}" required placeholder="0.00">
                  </div>
                  <div class="form-group">
                    <label><i class="fa-solid fa-boxes-stacked"></i> Stock *</label>
                    <input type="number" id="product-stock" min="0" value="${product?.stock ?? 0}" required placeholder="0">
                  </div>
                </div>
                
                <div class="form-group">
                  <label><i class="fa-solid fa-folder"></i> Category *</label>
                  <select id="product-category" required>
                    <option value="">Select Category</option>
                    ${categoryOptions}
                  </select>
                </div>
                
                <div class="form-group" id="sizes-section" style="display: none;">
                  <label><i class="fa-solid fa-ruler"></i> Sizes with Stock</label>
                  <div id="sizes-container" class="sizes-grid">
                    <!-- Sizes will be populated dynamically based on category -->
                  </div>
                  <small>Enter stock quantity for each size (leave 0 for unavailable sizes)</small>
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="product-featured" ${product?.isFeatured ? 'checked' : ''}>
                    <span><i class="fa-solid fa-star"></i> Featured Product</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="product-new-arrival" ${product?.isNewArrival ? 'checked' : ''}>
                    <span><i class="fa-solid fa-sparkles"></i> New Arrival</span>
                  </label>
                </div>
              </div>
              
              <div class="form-col">
                <div class="form-group">
                  <label><i class="fa-solid fa-image"></i> Product Image</label>
                  <div class="image-upload-container">
                    <div class="image-preview-box" id="image-preview-box">
                      <img id="image-preview" src="${fullImagePath}" alt="Preview" onerror="this.src='../assets/products/f1.jpg'">
                      <div class="image-overlay" id="image-overlay-click">
                        <i class="fa-solid fa-camera"></i>
                        <span>Change Image</span>
                      </div>
                    </div>
                    <input type="file" id="image-upload" accept="image/*" style="display: none">
                    <input type="hidden" id="image-path" value="${currentImage}">
                    
                    <div class="upload-options">
                      <button type="button" class="btn-upload" id="upload-btn">
                        <i class="fa-solid fa-upload"></i> Upload from Device
                      </button>
                      <span class="upload-divider">or</span>
                      <input type="text" id="image-url-input" placeholder="Enter image path" value="${currentImage}">
                    </div>
                    <small>Supported: JPG, PNG, GIF (Max 5MB)</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group full-width">
              <label><i class="fa-solid fa-align-left"></i> Description *</label>
              <textarea id="product-description" required rows="4" placeholder="Enter product description...">${product?.description || ''}</textarea>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="cancel-btn">
              <i class="fa-solid fa-xmark"></i> Cancel
            </button>
            <button type="button" class="btn-primary" id="save-product-btn" data-product-id="${productId}">
              <i class="fa-solid fa-save"></i> ${isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';

    // Attach event listeners after DOM insertion
    const modal = document.getElementById('product-modal');

    // Close button
    document.getElementById('close-modal-btn').addEventListener('click', () => Admin.closeModal());
    document.getElementById('cancel-btn').addEventListener('click', () => Admin.closeModal());

    // Image upload triggers
    document.getElementById('upload-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('image-upload').click();
    });

    document.getElementById('image-overlay-click').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('image-upload').click();
    });

    document.getElementById('image-preview-box').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('image-upload').click();
    });

    // Image file selection
    document.getElementById('image-upload').addEventListener('change', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Admin.handleImageUpload(e.target);
    });

    // Image URL input
    document.getElementById('image-url-input').addEventListener('change', (e) => {
      Admin.updateImagePreview(e.target.value);
      document.getElementById('image-path').value = e.target.value;
    });

    // Category change - update sizes
    const categorySelect = document.getElementById('product-category');
    categorySelect.addEventListener('change', (e) => {
      Admin.updateSizesForCategory(e.target.value, product?.sizes);
    });

    // Trigger initial sizes display if editing
    if (product && product.category) {
      const catId = product.category._id || product.category;
      Admin.updateSizesForCategory(catId, product.sizes);
    }

    // Save button - calls saveProduct
    document.getElementById('save-product-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Admin.saveProductFromModal(productId);
    });
  },

  // Update sizes based on category
  updateSizesForCategory(categoryId, existingSizes = []) {
    const sizesSection = document.getElementById('sizes-section');
    const sizesContainer = document.getElementById('sizes-container');

    if (!categoryId || !sizesContainer) {
      if (sizesSection) sizesSection.style.display = 'none';
      return;
    }

    // Find category name
    const category = this.categories.find(c => c._id === categoryId);
    if (!category) {
      sizesSection.style.display = 'none';
      return;
    }

    // Define sizes based on category
    let sizes = [];
    const catSlug = category.slug?.toLowerCase() || category.name?.toLowerCase();

    if (catSlug.includes('t-shirt') || catSlug.includes('shirt')) {
      sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    } else if (catSlug.includes('pant')) {
      sizes = ['28', '30', '32', '34', '36', '38', '40', '42'];
    } else if (catSlug.includes('shoe')) {
      sizes = ['6', '7', '8', '9', '10', '11', '12', '13'];
    } else {
      sizes = ['S', 'M', 'L', 'XL'];
    }

    // Create size inputs
    let html = '';
    sizes.forEach(size => {
      const existingSize = existingSizes?.find(s => s.size === size);
      const stock = existingSize?.stock || 0;
      html += `
        <div class="size-input-group">
          <label class="size-label">${size}</label>
          <input type="number" class="size-stock-input" data-size="${size}" min="0" value="${stock}" placeholder="0">
        </div>
      `;
    });

    sizesContainer.innerHTML = html;
    sizesSection.style.display = 'block';
  },

  // Handle image upload
  async handleImageUpload(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification('Image size must be less than 5MB', 'error');
      return;
    }

    // Show uploading state
    const previewBox = document.getElementById('image-preview-box');
    if (previewBox) {
      previewBox.classList.add('uploading');
    }

    // Create FormData and upload
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem(CONFIG.TOKEN_KEY);
      const response = await fetch(CONFIG.API_BASE_URL + '/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update preview and hidden input
        const preview = document.getElementById('image-preview');
        const pathInput = document.getElementById('image-path');
        const urlInput = document.getElementById('image-url-input');

        if (preview) preview.src = '..' + result.data.path;
        if (pathInput) pathInput.value = result.data.path;
        if (urlInput) urlInput.value = result.data.path;

        this.showNotification('Image uploaded! Now fill the form and click Save.', 'info');
      } else {
        this.showNotification(result.message || 'Failed to upload image', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to upload image: ' + error.message, 'error');
    } finally {
      if (previewBox) {
        previewBox.classList.remove('uploading');
      }
      // Reset file input so same file can be selected again
      input.value = '';
    }
  },

  // Update image preview
  updateImagePreview(imagePath) {
    const preview = document.getElementById('image-preview');
    if (preview) {
      const basePath = '..';
      const fullPath = imagePath.startsWith('/') ? basePath + imagePath : imagePath;
      preview.src = fullPath;
    }
  },

  // Close modal
  closeModal() {
    const modal = document.getElementById('product-modal') || document.getElementById('confirm-modal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
  },

  // Save product from modal (reads fields by ID)
  async saveProductFromModal(productId) {
    // Get values from form fields
    const name = document.getElementById('product-name')?.value?.trim();
    const brand = document.getElementById('product-brand')?.value?.trim();
    const price = document.getElementById('product-price')?.value;
    const stock = document.getElementById('product-stock')?.value;
    const category = document.getElementById('product-category')?.value;
    const description = document.getElementById('product-description')?.value?.trim();
    const imagePath = document.getElementById('image-path')?.value || '/assets/products/f1.jpg';
    const isFeatured = document.getElementById('product-featured')?.checked || false;
    const isNewArrival = document.getElementById('product-new-arrival')?.checked || false;

    // Validate required fields
    if (!name || !brand || !price || !category || !description) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Collect sizes data
    const sizesInputs = document.querySelectorAll('.size-stock-input');
    const sizes = [];
    let totalStock = 0;
    sizesInputs.forEach(input => {
      const sizeStock = parseInt(input.value) || 0;
      if (sizeStock > 0) {
        sizes.push({
          size: input.dataset.size,
          stock: sizeStock
        });
        totalStock += sizeStock;
      }
    });

    // Use total from sizes if sizes are provided, otherwise use manual stock
    const finalStock = sizes.length > 0 ? totalStock : (parseInt(stock) || 0);

    const productData = {
      name,
      brand,
      description,
      price: parseFloat(price),
      stock: finalStock,
      category,
      rating: 4.5,
      images: [imagePath],
      sizes,
      isFeatured,
      isNewArrival
    };

    try {
      let response;
      if (productId) {
        response = await API.put(`/products/${productId}`, productData);
      } else {
        response = await API.post('/products', productData);
      }

      if (response.success) {
        this.showNotification(`Product ${productId ? 'updated' : 'created'} successfully!`, 'success');
        this.closeModal();
        this.loadProducts();
      } else {
        this.showNotification(response.message || 'Failed to save product', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to save product: ' + error.message, 'error');
    }
  },

  // Edit product
  async editProduct(productId) {
    try {
      const response = await API.get(`/products/${productId}`, false);
      if (response.success) {
        this.showProductForm(response.data);
      }
    } catch (error) {
      this.showNotification('Failed to load product', 'error');
    }
  },

  // Preview product
  async previewProduct(productId) {
    try {
      const response = await API.get(`/products/${productId}`, false);
      if (response.success) {
        const product = response.data;
        const basePath = '..';
        const imagePath = product.images?.[0] || '/assets/products/f1.jpg';
        const fullImagePath = imagePath.startsWith('/') ? basePath + imagePath : imagePath;

        const previewHtml = `
          <div id="product-modal" class="admin-modal">
            <div class="modal-content modal-preview">
              <div class="modal-header">
                <h2><i class="fa-solid fa-eye"></i> Product Preview</h2>
                <button class="modal-close" onclick="Admin.closeModal()">&times;</button>
              </div>
              <div class="modal-body preview-body">
                <div class="preview-image">
                  <img src="${fullImagePath}" alt="${product.name}">
                </div>
                <div class="preview-details">
                  <h3>${product.name}</h3>
                  <p class="preview-brand">${product.brand}</p>
                  <p class="preview-price">$${product.price.toFixed(2)}</p>
                  <p class="preview-stock">Stock: ${product.stock} units</p>
                  <div class="preview-badges">
                    ${product.isFeatured ? '<span class="badge badge-featured">Featured</span>' : ''}
                    ${product.isNewArrival ? '<span class="badge badge-new">New Arrival</span>' : ''}
                  </div>
                  <p class="preview-description">${product.description}</p>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" onclick="Admin.closeModal()">Close</button>
                <button class="btn-primary" onclick="Admin.closeModal(); Admin.editProduct('${product._id}');">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', previewHtml);
        document.body.style.overflow = 'hidden';
      }
    } catch (error) {
      this.showNotification('Failed to load product preview', 'error');
    }
  },

  // Delete product
  async deleteProduct(productId) {
    const confirmHtml = `
      <div id="confirm-modal" class="admin-modal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h2><i class="fa-solid fa-triangle-exclamation" style="color: #dc3545;"></i> Confirm Delete</h2>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="Admin.closeModal()">Cancel</button>
            <button class="btn-danger" onclick="Admin.confirmDelete('${productId}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', confirmHtml);
  },

  async confirmDelete(productId) {
    this.closeModal();
    try {
      const response = await API.delete(`/products/${productId}`);
      if (response.success) {
        this.showNotification('Product deleted successfully!', 'success');
        this.loadProducts();
      }
    } catch (error) {
      this.showNotification('Failed to delete product', 'error');
    }
  },

  // Load all orders for admin
  async loadAllOrders() {
    try {
      const response = await API.get('/orders');
      if (response.success) {
        this.renderAdminOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  },

  // Render admin orders
  renderAdminOrders(orders) {
    const container = document.getElementById('admin-orders');
    if (!container) return;

    let html = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (orders.length === 0) {
      html += '<tr><td colspan="7" style="text-align: center;">No orders found</td></tr>';
    } else {
      orders.forEach(order => {
        html += `
          <tr>
            <td>#${order._id.slice(-8).toUpperCase()}</td>
            <td>${order.user?.name || 'Unknown'}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td><span class="price-badge">$${order.totalPrice.toFixed(2)}</span></td>
            <td><span class="status-pill payment-${order.paymentStatus}">${order.paymentStatus}</span></td>
            <td>
              <select onchange="Admin.updateOrderStatus('${order._id}', this.value)" class="status-select">
                <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td>
              <button onclick="Orders.showOrderDetails('${order._id}')" class="btn-icon btn-view" title="View">
                <i class="fa-solid fa-eye"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const response = await API.put(`/orders/${orderId}/status`, { orderStatus: status });
      if (response.success) {
        this.showNotification('Order status updated!', 'success');
      }
    } catch (error) {
      this.showNotification('Failed to update order status', 'error');
    }
  },

  // Load all users
  async loadUsers() {
    try {
      const response = await API.get('/admin/users');
      if (response.success) {
        this.renderUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  },

  // Render users
  renderUsers(users) {
    const container = document.getElementById('admin-users');
    if (!container) return;

    let html = `
      <table class="admin-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
        </thead>
        <tbody>
    `;

    users.forEach(user => {
      html += `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td><span class="badge badge-${user.role}">${user.role}</span></td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  // Show notification
  showNotification(message, type = 'info') {
    const existing = document.querySelector('.admin-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `admin-notification notification-${type}`;
    notification.innerHTML = `
      <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
};

// Initialize admin on page load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('admin.html')) {
    Admin.loadDashboard();
  }
});
