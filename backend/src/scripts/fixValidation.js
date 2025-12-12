require('dotenv').config();
const mongoose = require('mongoose');

async function fixValidation() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('courses');

        // Supprimer toute validation
        try {
            await db.command({
                collMod: 'courses',
                validator: {},
                validationLevel: 'off'
            });
            console.log('✅ Validation MongoDB supprimée');
        } catch (err) {
            console.log('ℹ️ Pas de validation à supprimer ou erreur:', err.message);
        }

        // Vérifier le nombre de documents
        const count = await collection.countDocuments();
        console.log(`📊 Nombre de cours dans la base: ${count}`);

        await mongoose.connection.close();
        console.log('✅ Terminé');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

fixValidation();
