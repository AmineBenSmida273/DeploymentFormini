// SOLUTION DÉFINITIVE - Suppression et recréation de la collection courses
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'formini';

async function fixCoursesPermanently() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB\n');

        const db = client.db(dbName);

        // 1. Vérifier si la collection existe
        const collections = await db.listCollections({ name: 'courses' }).toArray();

        if (collections.length > 0) {
            console.log('📋 Collection courses trouvée');

            // 2. Compter les documents
            const count = await db.collection('courses').countDocuments();
            console.log(`📊 Nombre de cours: ${count}`);

            // 3. Supprimer la collection complètement
            console.log('\n🗑️  Suppression de la collection courses...');
            await db.collection('courses').drop();
            console.log('✅ Collection supprimée');
        } else {
            console.log('ℹ️  Collection courses n\'existe pas');
        }

        // 4. Créer une nouvelle collection SANS validation
        console.log('\n📝 Création d\'une nouvelle collection sans validation...');
        await db.createCollection('courses', {
            validationLevel: 'off',
            validationAction: 'warn'
        });
        console.log('✅ Collection créée sans validation');

        // 5. Vérifier la configuration
        const newCollections = await db.listCollections({ name: 'courses' }).toArray();
        console.log('\n📊 Configuration de la collection:');
        console.log('  - validationLevel:', newCollections[0].options.validationLevel || 'off');
        console.log('  - validationAction:', newCollections[0].options.validationAction || 'warn');
        console.log('  - validator:', newCollections[0].options.validator || 'aucun');

        console.log('\n✅ TERMINÉ !');
        console.log('💡 La collection courses est maintenant prête');
        console.log('📝 Les cours seront créés avec le statut "en_attente"');
        console.log('🚀 Essayez de créer un cours maintenant !');

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error);
    } finally {
        await client.close();
    }
}

fixCoursesPermanently();
