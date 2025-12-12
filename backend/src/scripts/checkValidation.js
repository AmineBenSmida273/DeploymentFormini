const mongoose = require('mongoose');
require('dotenv').config();

async function checkValidation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;

        // Obtenir les informations de la collection
        const collections = await db.listCollections({ name: 'courses' }).toArray();

        if (collections.length > 0) {
            console.log('📋 Collection courses trouvée');
            console.log('\n=== OPTIONS DE LA COLLECTION ===');
            console.log(JSON.stringify(collections[0].options, null, 2));

            // Compter les documents
            const count = await db.collection('courses').countDocuments();
            console.log(`\n📊 Nombre de cours: ${count}`);

            // Afficher un exemple de document
            if (count > 0) {
                const sample = await db.collection('courses').findOne();
                console.log('\n📄 Exemple de document:');
                console.log(JSON.stringify(sample, null, 2));
            }
        } else {
            console.log('⚠️ Collection courses non trouvée');
        }

        await mongoose.disconnect();
        console.log('\n✅ Déconnecté de MongoDB');
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkValidation();
