const { body, validationResult } = require('express-validator');

// Handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array().map(err => err.msg).join(', ')
        });
    }
    next();
};

// Auth validators
const registerValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
];

const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

// Product validators
const productValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required'),
    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
        .notEmpty().withMessage('Category is required'),
    body('brand')
        .trim()
        .notEmpty().withMessage('Brand is required'),
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    validate
];

// Order validators
const orderValidator = [
    body('shippingAddress.address')
        .trim()
        .notEmpty().withMessage('Address is required'),
    body('shippingAddress.city')
        .trim()
        .notEmpty().withMessage('City is required'),
    body('shippingAddress.postalCode')
        .trim()
        .notEmpty().withMessage('Postal code is required'),
    body('shippingAddress.country')
        .trim()
        .notEmpty().withMessage('Country is required'),
    validate
];

module.exports = {
    registerValidator,
    loginValidator,
    productValidator,
    orderValidator
};
