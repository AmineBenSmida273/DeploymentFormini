const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/formini')
    .then(() => console.log('✅ Connecté à MongoDB'))
    .catch(err => {
        console.error('❌ Erreur:', err);
        process.exit(1);
    });

const User = require('../models/user.model');

async function seedCourses() {
    try {
        // Récupérer un formateur
        const instructor = await User.findOne({ role: 'instructor' });

        if (!instructor) {
            console.log('❌ Aucun formateur trouvé. Créez d\'abord un compte formateur.');
            process.exit(1);
        }

        console.log(`📝 Formateur: ${instructor.prenom} ${instructor.nom}`);

        const courses = [
            {
                titre: "Introduction à React.js",
                description: "Apprenez les fondamentaux de React pour créer des interfaces modernes et réactives.",
                categorie: "développement web",
                formateurid: instructor._id,
                programme: ["Composants React", "useState et useEffect", "Props", "React Router", "Projet Todo"],
                image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
                niveau: "débutant",
                prix: 0,
                datecreation: new Date(),
                chapitres: [
                    {
                        titre: "Introduction à React",
                        contenu: "Découvrez React et ses concepts de base",
                        duree: 45
                    },
                    {
                        titre: "Composants et JSX",
                        contenu: "Créez vos premiers composants React",
                        duree: 60
                    }
                ]
            },
            {
                titre: "Python pour la Data Science",
                description: "Maîtrisez Python et les bibliothèques essentielles pour l'analyse de données : NumPy, Pandas, Matplotlib.",
                categorie: "data science",
                formateurid: instructor._id,
                programme: ["Python basics", "NumPy", "Pandas", "Matplotlib", "Machine Learning intro"],
                image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
                niveau: "intermédiaire",
                prix: 49.99,
                datecreation: new Date(),
                chapitres: [
                    {
                        titre: "Python Fondamentaux",
                        contenu: "Révision des bases de Python",
                        duree: 50
                    },
                    {
                        titre: "Pandas DataFrames",
                        contenu: "Analyse de données avec Pandas",
                        duree: 80
                    }
                ]
            },
            {
                titre: "Deep Learning avec TensorFlow",
                description: "Plongez dans le Deep Learning avec TensorFlow et Keras pour créer des réseaux de neurones.",
                categorie: "ai",
                formateurid: instructor._id,
                programme: ["Réseaux de neurones", "CNN", "RNN", "Transfer Learning"],
                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
                niveau: "avancé",
                prix: 79.99,
                datecreation: new Date(),
                chapitres: [
                    {
                        titre: "Fondamentaux du Deep Learning",
                        contenu: "Comprendre les réseaux de neurones",
                        duree: 90
                    }
                ]
            },
            {
                titre: "Node.js et Express",
                description: "Créez des API REST professionnelles avec Node.js et Express. Authentification, MongoDB, déploiement.",
                categorie: "développement web",
                formateurid: instructor._id,
                programme: ["Node.js setup", "Express routes", "MongoDB", "JWT auth", "Déploiement"],
                image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
                niveau: "intermédiaire",
                prix: 39.99,
                datecreation: new Date(),
                chapitres: [
                    {
                        titre: "Premier Serveur Express",
                        contenu: "Installation et configuration",
                        duree: 40
                    }
                ]
            },
            {
                titre: "UX/UI Design avec Figma",
                description: "Maîtrisez Figma pour créer des interfaces utilisateur modernes et des prototypes interactifs.",
                categorie: "design",
                formateurid: instructor._id,
                programme: ["Interface Figma", "Wireframes", "Design systems", "Prototypage"],
                image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
                niveau: "débutant",
                prix: 29.99,
                datecreation: new Date(),
                chapitres: [
                    {
                        titre: "Introduction à Figma",
                        contenu: "Découverte de l'interface",
                        duree: 35
                    }
                ]
            },
            {
                titre: "Marketing Digital : SEO",
                description: "Boostez votre visibilité en ligne avec le SEO et les campagnes Google Ads.",
                categorie: "marketing",
                formateurid: instructor._id,
                programme: ["SEO basics", "Mots-clés", "Google Ads", "Analytics"],
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
                niveau: "débutant",
                prix: 34.99,
                datecreation: new Date(),
                chapitres: [
                    {
                        titre: "Introduction au SEO",
                        contenu: "Comprendre le référencement naturel",
                        duree: 45
                    }
                ]
            }
        ];

        // Supprimer les anciens cours
        const db = mongoose.connection.db;
        await db.collection('courses').deleteMany({});
        console.log('🗑️  Anciens cours supprimés\n');

        // Insérer les nouveaux cours
        const result = await db.collection('courses').insertMany(courses);
        console.log(`✅ ${result.insertedCount} cours insérés avec succès !\n`);

        // Afficher les cours
        courses.forEach((course, idx) => {
            console.log(`${idx + 1}. ${course.titre}`);
            console.log(`   📁 ${course.categorie} | 📊 ${course.niveau} | 💰 ${course.prix} TND`);
        });

        console.log('\n✨ Base de données peuplée !');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.writeErrors) {
            error.writeErrors.forEach(err => {
                console.error('Détails:', JSON.stringify(err.err, null, 2));
            });
        }
        process.exit(1);
    }
}

seedCourses();
