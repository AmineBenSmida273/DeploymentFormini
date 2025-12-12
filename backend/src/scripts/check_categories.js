const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/course.model'); // Corrected path

dotenv.config();

const checkCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const categories = await Course.distinct('categorie');
        console.log('Current categories:', categories);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkCategories();
