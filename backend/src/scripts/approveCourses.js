const mongoose = require('mongoose');

async function approveCourses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/formini');
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;

        // Approuver tous les cours
        const result = await db.collection('courses').updateMany(
            {},
            { $set: { statut: 'approuvé' } }
        );

        console.log(`✅ ${result.modifiedCount} cours approuvés`);

        // Vérifier
        const approvedCount = await db.collection('courses').countDocuments({ statut: 'approuvé' });
        console.log(`📊 Total cours approuvés: ${approvedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

approveCourses();
