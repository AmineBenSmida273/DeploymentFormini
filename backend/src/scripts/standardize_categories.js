const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/course.model');

dotenv.config();

const standardizeCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses. Processing...`);

        let updatedCount = 0;
        for (const course of courses) {
            if (course.categorie && course.categorie !== course.categorie.toLowerCase()) {
                course.categorie = course.categorie.toLowerCase();
                await course.save();
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} courses to lowercase categories.`);

        const distinctCategories = await Course.distinct('categorie');
        console.log('Final distinct categories:', distinctCategories);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

standardizeCategories();
