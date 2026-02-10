// ShopWave Orders Module
const Orders = {
    // Create order from cart
    async createOrder(shippingAddress) {
        try {
            const response = await API.post('/orders', { shippingAddress });
            return response;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Get user's orders
    async getMyOrders() {
        try {
            const response = await API.get('/orders/myorders');
            return response;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Get single order
    async getOrder(orderId) {
        try {
            const response = await API.get(`/orders/${orderId}`);
            return response;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Get status badge class
    getStatusBadge(status) {
        const colors = {
            'processing': '#f0ad4e',
            'shipped': '#5bc0de',
            'delivered': '#5cb85c',
            'cancelled': '#d9534f',
            'pending': '#f0ad4e',
            'paid': '#5cb85c',
            'failed': '#d9534f'
        };
        return `background-color: ${colors[status] || '#888'}; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px;`;
    },

    // Render orders list
    renderOrders(orders, containerId = 'orders-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h3>No orders yet</h3>
          <p>Start shopping and your orders will appear here.</p>
          <a href="shop.html" class="normal" style="display: inline-block; margin-top: 20px;">Browse Products</a>
        </div>
      `;
            return;
        }

        let html = `
      <table width="100%">
        <thead>
          <tr>
            <td>Order ID</td>
            <td>Date</td>
            <td>Items</td>
            <td>Total</td>
            <td>Payment</td>
            <td>Status</td>
          </tr>
        </thead>
        <tbody>
    `;

        orders.forEach(order => {
            html += `
        <tr onclick="Orders.showOrderDetails('${order._id}')" style="cursor: pointer;">
          <td>#${order._id.slice(-8).toUpperCase()}</td>
          <td>${this.formatDate(order.createdAt)}</td>
          <td>${order.items.length} item(s)</td>
          <td>$${order.totalPrice.toFixed(2)}</td>
          <td><span style="${this.getStatusBadge(order.paymentStatus)}">${order.paymentStatus}</span></td>
          <td><span style="${this.getStatusBadge(order.orderStatus)}">${order.orderStatus}</span></td>
        </tr>
      `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    // Show order details modal
    async showOrderDetails(orderId) {
        try {
            const response = await this.getOrder(orderId);
            if (!response.success) {
                alert('Failed to load order details');
                return;
            }

            const order = response.data;
            const basePath = window.location.pathname.includes('sub-pages') ? '..' : '.';

            let itemsHtml = '';
            order.items.forEach(item => {
                const imagePath = item.image || '/assets/products/f1.jpg';
                const fullImagePath = imagePath.startsWith('/') ? basePath + imagePath : imagePath;
                itemsHtml += `
          <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; border-bottom: 1px solid #eee;">
            <img src="${fullImagePath}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px;">
            <div style="flex: 1;">
              <h4 style="margin: 0;">${item.name}</h4>
              <p style="margin: 5px 0; color: #666;">Qty: ${item.quantity} × $${item.price.toFixed(2)}</p>
            </div>
            <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
          </div>
        `;
            });

            const modalHtml = `
        <div id="order-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="margin: 0;">Order #${order._id.slice(-8).toUpperCase()}</h2>
              <button onclick="document.getElementById('order-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p><strong>Date:</strong> ${this.formatDate(order.createdAt)}</p>
              <p><strong>Payment Status:</strong> <span style="${this.getStatusBadge(order.paymentStatus)}">${order.paymentStatus}</span></p>
              <p><strong>Order Status:</strong> <span style="${this.getStatusBadge(order.orderStatus)}">${order.orderStatus}</span></p>
            </div>

            <h3>Shipping Address</h3>
            <p>${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}</p>

            <h3>Items</h3>
            ${itemsHtml}

            <div style="text-align: right; font-size: 18px; margin-top: 20px;">
              <strong>Total: $${order.totalPrice.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (error) {
            console.error('Error showing order details:', error);
        }
    },

    // Load orders on orders page
    async loadOrders() {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        const container = document.getElementById('orders-list');
        if (container) {
            container.innerHTML = '<p>Loading orders...</p>';
        }

        try {
            const response = await this.getMyOrders();
            if (response.success) {
                this.renderOrders(response.data);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }
};

// Initialize orders on orders page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('orders.html')) {
        Orders.loadOrders();
    }
});
