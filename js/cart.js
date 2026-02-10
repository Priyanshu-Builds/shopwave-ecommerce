// ShopWave Cart Module
const Cart = {
    // Add item to cart
    async addItem(productId, quantity = 1) {
        if (!Auth.isLoggedIn()) {
            alert('Please login to add items to cart');
            const loginUrl = window.location.pathname.includes('sub-pages')
                ? 'login.html'
                : 'sub-pages/login.html';
            window.location.href = loginUrl;
            return;
        }

        try {
            const response = await API.post('/cart', { productId, quantity });
            if (response.success) {
                this.showNotification('Item added to cart!');
                this.updateCartBadge(response.data.items.length);
            } else {
                alert(response.message || 'Failed to add item to cart');
            }
        } catch (error) {
            alert(error.message || 'Failed to add item to cart');
        }
    },

    // Get cart contents
    async getCart() {
        try {
            const response = await API.get('/cart');
            return response;
        } catch (error) {
            console.error('Error fetching cart:', error);
            return { success: false, message: error.message };
        }
    },

    // Load cart count for badge
    async loadCartCount() {
        if (!Auth.isLoggedIn()) {
            this.updateCartBadge(0);
            return;
        }
        try {
            const response = await this.getCart();
            if (response.success && response.data.items) {
                const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
                this.updateCartBadge(totalItems);
            }
        } catch (error) {
            console.error('Error loading cart count:', error);
        }
    },

    // Update cart badge on all cart icons
    updateCartBadge(count) {
        // Find all cart/bag icons
        const cartIcons = document.querySelectorAll('.fa-bag-shopping, .fa-shopping-bag');

        cartIcons.forEach(icon => {
            const parent = icon.parentElement;
            if (!parent) return;

            // Remove existing badge
            const existingBadge = parent.querySelector('.cart-badge');
            if (existingBadge) existingBadge.remove();

            // Add new badge if count > 0
            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'cart-badge';
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #088178;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 50%;
          min-width: 18px;
          text-align: center;
        `;
                parent.style.position = 'relative';
                parent.appendChild(badge);
            }
        });
    },

    // Update item quantity
    async updateQuantity(productId, quantity) {
        try {
            const response = await API.put(`/cart/${productId}`, { quantity });
            if (response.success) {
                this.renderCart(response.data);
                const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
                this.updateCartBadge(totalItems);
            }
            return response;
        } catch (error) {
            alert(error.message || 'Failed to update quantity');
            return { success: false, message: error.message };
        }
    },

    // Remove item from cart
    async removeItem(productId) {
        try {
            const response = await API.delete(`/cart/${productId}`);
            if (response.success) {
                this.renderCart(response.data);
                const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
                this.updateCartBadge(totalItems);
                this.showNotification('Item removed from cart');
            }
            return response;
        } catch (error) {
            alert(error.message || 'Failed to remove item');
            return { success: false, message: error.message };
        }
    },

    // Clear entire cart
    async clearCart() {
        try {
            const response = await API.delete('/cart');
            if (response.success) {
                this.renderCart({ items: [] });
                this.updateCartBadge(0);
                this.showNotification('Cart cleared');
            }
            return response;
        } catch (error) {
            alert(error.message || 'Failed to clear cart');
            return { success: false, message: error.message };
        }
    },

    // Calculate cart totals
    calculateTotals(items) {
        let subtotal = 0;
        items.forEach(item => {
            if (item.product) {
                subtotal += item.product.price * item.quantity;
            }
        });
        return {
            subtotal,
            shipping: 0, // Free shipping
            total: subtotal
        };
    },

    // Render cart on cart page
    renderCart(cart) {
        const tbody = document.querySelector('#cart table tbody');
        const subtotalContainer = document.getElementById('sub-total');

        if (!tbody) return;

        if (!cart.items || cart.items.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            Your cart is empty. <a href="${window.location.pathname.includes('sub-pages') ? 'shop.html' : 'sub-pages/shop.html'}">Continue shopping</a>
          </td>
        </tr>
      `;
            if (subtotalContainer) {
                this.renderTotals({ subtotal: 0, shipping: 0, total: 0 });
            }
            return;
        }

        const basePath = window.location.pathname.includes('sub-pages') ? '..' : '.';

        let html = '';
        cart.items.forEach(item => {
            if (!item.product) return;

            const imagePath = item.product.images?.[0] || '/assets/products/f1.jpg';
            const fullImagePath = imagePath.startsWith('/') ? basePath + imagePath : imagePath;
            const itemSubtotal = item.product.price * item.quantity;

            html += `
        <tr data-product-id="${item.product._id}">
          <td>
            <a href="#" onclick="Cart.removeItem('${item.product._id}'); return false;">
              <i class="fa-regular fa-circle-xmark"></i>
            </a>
          </td>
          <td><img src="${fullImagePath}" alt="${item.product.name}"></td>
          <td>${item.product.name}</td>
          <td>$${item.product.price.toFixed(2)}</td>
          <td>
            <input type="number" value="${item.quantity}" min="1" max="${item.product.stock || 99}"
              onchange="Cart.updateQuantity('${item.product._id}', parseInt(this.value))">
          </td>
          <td>$${itemSubtotal.toFixed(2)}</td>
        </tr>
      `;
        });

        tbody.innerHTML = html;

        // Update totals
        const totals = this.calculateTotals(cart.items);
        this.renderTotals(totals);
    },

    // Render totals section
    renderTotals(totals) {
        const container = document.getElementById('sub-total');
        if (!container) return;

        container.innerHTML = `
      <h3>Cart Totals</h3>
      <table>
        <tr>
          <td>Cart Subtotal</td>
          <td>$${totals.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Shipping</td>
          <td>${totals.shipping === 0 ? 'Free' : '$' + totals.shipping.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Total</strong></td>
          <td><strong>$${totals.total.toFixed(2)}</strong></td>
        </tr>
      </table>
      <button class="normal" onclick="Cart.proceedToCheckout()">Proceed to checkout</button>
    `;
    },

    // Load cart on cart page
    async loadCart() {
        if (!Auth.isLoggedIn()) {
            const tbody = document.querySelector('#cart table tbody');
            if (tbody) {
                tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px;">
              Please <a href="login.html">login</a> to view your cart.
            </td>
          </tr>
        `;
            }
            return;
        }

        try {
            const response = await this.getCart();
            if (response.success) {
                this.renderCart(response.data);
                const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
                this.updateCartBadge(totalItems);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    },

    // Navigate to checkout
    proceedToCheckout() {
        if (!Auth.isLoggedIn()) {
            alert('Please login to checkout');
            window.location.href = 'login.html';
            return;
        }
        window.location.href = 'checkout.html';
    },

    // Show notification
    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.cart-notification');
        if (existing) existing.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #088178;
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Initialize cart on cart page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('cart.html')) {
        Cart.loadCart();
    }
    // Load cart count on all pages if logged in
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        Cart.loadCartCount();
    }
});
