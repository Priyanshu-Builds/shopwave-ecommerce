const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate total revenue from paid orders
        const revenueResult = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Get orders by status
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        // Get orders by payment status
        const ordersByPayment = await Order.aggregate([
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ]);

        // Count low stock products (stock <= 10)
        const lowStockProducts = await Product.countDocuments({ stock: { $lte: 10 } });

        // Count pending orders (processing status)
        const pendingOrders = await Order.countDocuments({ orderStatus: 'processing' });

        // Count paid orders
        const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });

        // Count delivered orders
        const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });

        // Recent orders
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue,
                ordersByStatus,
                ordersByPayment,
                lowStockProducts,
                pendingOrders,
                paidOrders,
                deliveredOrders,
                recentOrders
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find()
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: users
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
