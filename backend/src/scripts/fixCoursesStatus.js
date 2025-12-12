const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/formini')
    .then(() => console.log('✅ Connecté'))
    .catch(err => console.error('❌ Erreur:', err));

async function fixCoursesStatus() {
    try {
        const db = mongoose.connection.db;

        // Mettre à jour tous les cours sans statut
        const result = await db.collection('courses').updateMany(
            { statut: { $exists: false } },
            { $set: { statut: 'approuvé' } }
        );

        console.log(`✅ ${result.modifiedCount} cours mis à jour avec statut "approuvé"`);

        // Vérifier
        const courses = await db.collection('courses').find({}).toArray();
        console.log('\n📚 Cours après mise à jour:\n');
        courses.forEach((c, idx) => {
            console.log(`${idx + 1}. ${c.titre} - Statut: ${c.statut}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

setTimeout(fixCoursesStatus, 1000);
