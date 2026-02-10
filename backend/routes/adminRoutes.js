const express = require('express');
const { getDashboardStats, getAllUsers } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth and admin role
router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);

module.exports = router;
