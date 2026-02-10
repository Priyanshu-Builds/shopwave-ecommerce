const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

const connectDB = require('./config/db');

// Product data based on existing images
const categories = [
    { name: 'T-Shirts', slug: 't-shirts' },
    { name: 'Shoes', slug: 'shoes' },
    { name: 'Pants', slug: 'pants' }
];

const products = [
    // Featured Products (f1-f8)
    {
        name: 'Cartoon Astronaut T-Shirt',
        description: 'This stylish men\'s fashion t-shirt boasts a modern and sleek design, perfect for the contemporary urban wardrobe. The unique graphic print on the front adds an eye-catching element.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f1.jpg'],
        stock: 50,
        rating: 5,
        numReviews: 120,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Classic White T-Shirt',
        description: 'A timeless classic white t-shirt made from premium cotton. Perfect for everyday wear with exceptional comfort and durability.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f2.jpg'],
        stock: 45,
        rating: 5,
        numReviews: 95,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Urban Street T-Shirt',
        description: 'Modern streetwear inspired t-shirt with bold graphics. Made from soft, breathable fabric for all-day comfort.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f3.jpg'],
        stock: 35,
        rating: 5,
        numReviews: 88,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Vintage Style T-Shirt',
        description: 'Retro-inspired vintage style t-shirt with unique wash effect. A must-have for fashion enthusiasts.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f4.jpg'],
        stock: 40,
        rating: 5,
        numReviews: 75,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Premium Cotton T-Shirt',
        description: 'High-quality premium cotton t-shirt with superior stitching. Designed for maximum comfort and style.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f5.jpg'],
        stock: 55,
        rating: 5,
        numReviews: 102,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Graphic Print T-Shirt',
        description: 'Eye-catching graphic print t-shirt with vibrant colors. Stand out from the crowd with this unique design.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f6.jpg'],
        stock: 30,
        rating: 5,
        numReviews: 67,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Minimalist Design T-Shirt',
        description: 'Clean and minimalist t-shirt design for the modern man. Versatile piece that goes with everything.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f7.jpg'],
        stock: 60,
        rating: 5,
        numReviews: 58,
        isFeatured: true,
        isNewArrival: false
    },
    {
        name: 'Sport Performance T-Shirt',
        description: 'Athletic performance t-shirt with moisture-wicking technology. Perfect for workouts and active lifestyle.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/f8.jpg'],
        stock: 48,
        rating: 5,
        numReviews: 83,
        isFeatured: true,
        isNewArrival: false
    },
    // New Arrivals (n1-n8)
    {
        name: 'Summer Collection T-Shirt',
        description: 'Fresh from our summer collection, this lightweight t-shirt offers the perfect blend of style and comfort for warm days.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n1.jpg'],
        stock: 70,
        rating: 5,
        numReviews: 42,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Limited Edition T-Shirt',
        description: 'Exclusive limited edition design with premium materials. Grab yours before they\'re gone!',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n2.jpg'],
        stock: 25,
        rating: 5,
        numReviews: 38,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Designer Collection T-Shirt',
        description: 'From our designer collaboration collection. Unique patterns and premium quality fabrics.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n3.jpg'],
        stock: 35,
        rating: 5,
        numReviews: 29,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Eco-Friendly T-Shirt',
        description: 'Made from 100% organic cotton. Sustainable fashion without compromising on style.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n4.jpg'],
        stock: 42,
        rating: 5,
        numReviews: 56,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Trendy Pattern T-Shirt',
        description: 'Stay on trend with this fashionable pattern t-shirt. Perfect for casual outings and social events.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n5.jpg'],
        stock: 38,
        rating: 5,
        numReviews: 44,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Casual Everyday T-Shirt',
        description: 'Your go-to casual t-shirt for everyday wear. Comfortable, stylish, and affordable.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n6.jpg'],
        stock: 65,
        rating: 5,
        numReviews: 71,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Fashion Forward T-Shirt',
        description: 'Lead the fashion pack with this cutting-edge t-shirt design. Bold statement for the confident dresser.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n7.jpg'],
        stock: 32,
        rating: 5,
        numReviews: 35,
        isFeatured: false,
        isNewArrival: true
    },
    {
        name: 'Modern Lifestyle T-Shirt',
        description: 'Designed for the modern lifestyle. Versatile t-shirt that transitions from day to night effortlessly.',
        price: 78,
        brand: 'Adidas',
        images: ['/assets/products/n8.jpg'],
        stock: 55,
        rating: 5,
        numReviews: 62,
        isFeatured: false,
        isNewArrival: true
    }
];

// Admin user
const adminUser = {
    name: 'Admin User',
    email: 'admin@shopwave.com',
    password: 'admin123',
    role: 'admin'
};

const importData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();

        console.log('Data cleared...');

        // Create admin user
        await User.create(adminUser);
        console.log('Admin user created: admin@shopwave.com / admin123');

        // Create categories
        const createdCategories = await Category.insertMany(categories);
        console.log('Categories created...');

        // Get T-Shirts category ID
        const tshirtCategory = createdCategories.find(c => c.slug === 't-shirts');

        // Add category to products
        const productsWithCategory = products.map(p => ({
            ...p,
            category: tshirtCategory._id
        }));

        // Create products
        await Product.insertMany(productsWithCategory);
        console.log('Products created...');

        console.log('Data import complete!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();

        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();

        console.log('Data destroyed!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Run seeder based on command line argument
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
