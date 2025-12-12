const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/formini')
    .then(() => console.log('✅ Connecté'))
    .catch(err => console.error('❌ Erreur:', err));

const Course = require('../models/course.model');
const User = require('../models/user.model');

async function testInsert() {
    try {
        const instructor = await User.findOne({ role: 'instructor' });
        if (!instructor) {
            console.log('❌ Aucun formateur trouvé');
            process.exit(1);
        }

        console.log('Formateur:', instructor.email);

        const testCourse = {
            titre: "Test Course React",
            description: "Ceci est une description de test pour le cours React",
            categorie: "développement web",
            formateur: instructor._id,
            programme: "Chapitre 1. Chapitre 2. Chapitre 3.",
            niveau: "débutant",
            prix: 0,
            duree: 5,
            objectifs: ["Objectif 1", "Objectif 2"],
            prerequis: ["Prérequis 1"],
            chapitres: [
                {
                    titre: "Chapitre 1",
                    contenu: "Contenu du chapitre 1",
                    duree: 30,
                    ressources: []
                }
            ]
        };

        console.log('\n📝 Tentative d\'insertion...\n');
        const course = new Course(testCourse);
        await course.save();

        console.log('✅ Cours inséré avec succès!');
        console.log('ID:', course._id);
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERREUR DÉTAILLÉE:\n');
        console.error('Message:', error.message);
        console.error('\nType:', error.name);

        if (error.errors) {
            console.log('\n📋 Erreurs de validation Mongoose:');
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }

        if (error.code) {
            console.log('\nCode erreur MongoDB:', error.code);
        }

        console.log('\n📄 Erreur complète:');
        console.error(JSON.stringify(error, null, 2));

        process.exit(1);
    }
}

testInsert();
