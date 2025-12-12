const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/course.model'); // Corrected path

dotenv.config();

const fixTypo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Course.updateMany(
            { categorie: "Développment web" },
            { $set: { categorie: "développement web" } }
        );

        // Also check for "Développement Web" or other variations if needed, but user specified "Développment web"

        console.log(`Updated ${result.modifiedCount} courses.`);

        // Log distinct categories to verify
        const categories = await Course.distinct('categorie');
        console.log('Current categories:', categories);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixTypo();
