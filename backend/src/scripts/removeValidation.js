const mongoose = require('mongoose');
require('dotenv').config();

async function removeValidation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;

        // Obtenir les informations de la collection
        const collections = await db.listCollections({ name: 'courses' }).toArray();

        if (collections.length > 0) {
            console.log('📋 Collection courses trouvée');
            console.log('Validation actuelle:', JSON.stringify(collections[0].options.validator, null, 2));

            // Supprimer la validation
            await db.command({
                collMod: 'courses',
                validator: {},
                validationLevel: 'off'
            });

            console.log('✅ Validation supprimée de la collection courses');
        } else {
            console.log('⚠️ Collection courses non trouvée');
        }

        await mongoose.disconnect();
        console.log('✅ Déconnecté de MongoDB');
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

removeValidation();
