// Alternative: Script Node.js simple pour supprimer la validation
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'formini';

async function removeValidation() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB');

        const db = client.db(dbName);

        // Supprimer la validation
        const result = await db.command({
            collMod: 'courses',
            validator: {},
            validationLevel: 'off',
            validationAction: 'warn'
        });

        console.log('✅ Validation supprimée:', result);
        console.log('\n💡 Vous pouvez maintenant créer des cours !');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.close();
    }
}

removeValidation();
