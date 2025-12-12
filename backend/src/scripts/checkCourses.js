const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/formini')
    .then(() => console.log('✅ Connecté'))
    .catch(err => console.error('❌ Erreur:', err));

async function checkCourses() {
    try {
        const db = mongoose.connection.db;

        // Compter les cours
        const count = await db.collection('courses').countDocuments();
        console.log(`\n📊 Nombre total de cours: ${count}`);

        if (count > 0) {
            // Afficher tous les cours
            const courses = await db.collection('courses').find({}).toArray();

            console.log('\n📚 Liste des cours:\n');
            courses.forEach((course, idx) => {
                console.log(`${idx + 1}. ${course.titre}`);
                console.log(`   ID: ${course._id}`);
                console.log(`   Catégorie: ${course.categorie}`);
                console.log(`   Niveau: ${course.niveau}`);
                console.log(`   Prix: ${course.prix} TND`);
                console.log(`   Statut: ${course.statut || 'non défini'}`);
                console.log(`   FormateurID: ${course.formateurid}`);
                console.log('');
            });
        } else {
            console.log('\n⚠️  Aucun cours dans la base de données!');
            console.log('💡 Exécutez: node src/scripts/seedCourses.js');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

setTimeout(checkCourses, 1000);
