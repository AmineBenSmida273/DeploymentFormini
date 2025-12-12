// Script pour supprimer et recréer la collection courses sans validation
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/formini';

async function resetCoursesCollection() {
    try {
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;

        // Vérifier si la collection existe
        const collections = await db.listCollections({ name: 'courses' }).toArray();

        if (collections.length > 0) {
            console.log('📋 Collection courses trouvée');

            // Compter les documents
            const count = await db.collection('courses').countDocuments();
            console.log(`📊 Nombre de cours actuels: ${count}`);

            if (count > 0) {
                const response = 'y'; // Auto-confirm pour le script
                console.log('⚠️  ATTENTION: La collection contient des cours qui seront supprimés');
                console.log('✅ Suppression confirmée automatiquement');
            }

            // Supprimer la collection
            await db.collection('courses').drop();
            console.log('🗑️  Collection courses supprimée');
        } else {
            console.log('ℹ️  Collection courses n\'existe pas encore');
        }

        // Recréer la collection sans validation
        await db.createCollection('courses');
        console.log('✅ Collection courses recréée sans validation');

        await mongoose.connection.close();
        console.log('\n✅ Terminé - Vous pouvez maintenant créer des cours');
        console.log('💡 Les cours seront créés avec le statut "en_attente" par défaut');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

resetCoursesCollection();
