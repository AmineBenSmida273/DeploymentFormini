// Script pour supprimer la validation stricte de la collection courses
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/formini';

async function fixCoursesValidation() {
    try {
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        const db = mongoose.connection.db;

        // Vérifier la collection
        const collections = await db.listCollections({ name: 'courses' }).toArray();

        if (collections.length > 0) {
            console.log('📋 Collection courses trouvée');
            console.log('📊 Validation actuelle:', JSON.stringify(collections[0].options.validator, null, 2));

            // Supprimer la validation stricte
            console.log('\n🔧 Suppression de la validation stricte...');
            await db.command({
                collMod: 'courses',
                validator: {},
                validationLevel: 'off',
                validationAction: 'warn'
            });
            console.log('✅ Validation supprimée avec succès !');

            // Vérifier que la validation a été supprimée
            const updatedCollections = await db.listCollections({ name: 'courses' }).toArray();
            console.log('\n📊 Nouvelle configuration:');
            console.log('  - validationLevel:', updatedCollections[0].options.validationLevel || 'off');
            console.log('  - validationAction:', updatedCollections[0].options.validationAction || 'warn');
        } else {
            console.log('⚠️  Collection courses n\'existe pas');
            console.log('✅ Elle sera créée automatiquement lors de la première insertion');
        }

        await mongoose.connection.close();
        console.log('\n✅ Terminé !');
        console.log('💡 Vous pouvez maintenant créer des cours sans erreur de validation');
        console.log('📝 Les cours seront créés avec le statut "en_attente"');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error);
        process.exit(1);
    }
}

fixCoursesValidation();
