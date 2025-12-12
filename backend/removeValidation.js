// Script pour supprimer la validation MongoDB de la collection courses
const mongoose = require('mongoose');

// URI de connexion MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/formini';

async function removeValidation() {
    try {
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;

        // Supprimer la validation de la collection courses
        try {
            await db.command({
                collMod: 'courses',
                validator: {},
                validationLevel: 'off'
            });
            console.log('✅ Validation MongoDB supprimée de la collection courses');
        } catch (err) {
            console.log('ℹ️  Pas de validation à supprimer ou collection inexistante');
        }

        await mongoose.connection.close();
        console.log('✅ Terminé - Vous pouvez maintenant créer des cours');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

removeValidation();
