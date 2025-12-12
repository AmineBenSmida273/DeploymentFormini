const mongoose = require('mongoose');
const User = require('../models/user.model');
const Enrollment = require('../models/enrollment.model');
const bcrypt = require('bcryptjs');

// Script pour générer des utilisateurs étudiants et des inscriptions
async function seedStudentsAndEnrollments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/formini');
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;

        // Vérifier s'il y a déjà des étudiants
        let students = await User.find({ role: 'student' }).lean();

        // Si pas d'étudiants, en créer
        if (students.length === 0) {
            console.log('📝 Création de 20 étudiants...');
            const hashedPassword = await bcrypt.hash('student123', 10);

            const studentsData = [];
            for (let i = 1; i <= 20; i++) {
                const daysAgo = Math.floor(Math.random() * 180);
                const dateInscription = new Date();
                dateInscription.setDate(dateInscription.getDate() - daysAgo);

                studentsData.push({
                    nom: `Étudiant${i}`,
                    prenom: `Test`,
                    email: `etudiant${i}@formini.com`,
                    motdepasse: hashedPassword,
                    role: 'student',
                    statut: 'active',
                    dateinscri: dateInscription
                });
            }

            await User.insertMany(studentsData);
            students = await User.find({ role: 'student' }).lean();
            console.log(`✅ ${students.length} étudiants créés`);
        } else {
            console.log(`✅ ${students.length} étudiants existants trouvés`);
        }

        // Récupérer les cours approuvés
        const courses = await db.collection('courses').find({ statut: 'approuvé' }).toArray();
        console.log(`📖 ${courses.length} cours approuvés trouvés`);

        if (courses.length === 0) {
            console.log('⚠️ Aucun cours approuvé trouvé. Veuillez d\'abord créer des cours.');
            process.exit(0);
        }

        // Supprimer les anciennes inscriptions
        await Enrollment.deleteMany({});
        console.log('🗑️ Anciennes inscriptions supprimées');

        const enrollments = [];
        const now = new Date();

        // Générer des inscriptions aléatoires
        students.forEach(student => {
            // Chaque étudiant s'inscrit à 2-6 cours aléatoires
            const numCourses = Math.floor(Math.random() * 5) + 2;
            const selectedCourses = courses
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.min(numCourses, courses.length));

            selectedCourses.forEach(course => {
                // Date d'inscription aléatoire dans les 6 derniers mois
                const daysAgo = Math.floor(Math.random() * 180);
                const enrollmentDate = new Date(now);
                enrollmentDate.setDate(enrollmentDate.getDate() - daysAgo);

                // Progression aléatoire (0-100%)
                const progression = Math.floor(Math.random() * 101);

                // Statut basé sur la progression
                let statut = 'en_cours';
                if (progression === 100) statut = 'terminé';
                else if (progression < 10 && daysAgo > 60) statut = 'abandonné';

                // Dernière activité
                const lastActivityDaysAgo = Math.floor(Math.random() * Math.min(daysAgo, 30));
                const derniereactivite = new Date(now);
                derniereactivite.setDate(derniereactivite.getDate() - lastActivityDaysAgo);

                enrollments.push({
                    etudiantid: student._id,
                    coursid: course._id,
                    dateinscription: enrollmentDate,
                    progression,
                    statut,
                    derniereactivite
                });
            });
        });

        // Insérer les inscriptions
        if (enrollments.length > 0) {
            await Enrollment.insertMany(enrollments);
            console.log(`✅ ${enrollments.length} inscriptions créées avec succès !`);

            // Statistiques
            const stats = {
                total: enrollments.length,
                enCours: enrollments.filter(e => e.statut === 'en_cours').length,
                termines: enrollments.filter(e => e.statut === 'terminé').length,
                abandonnes: enrollments.filter(e => e.statut === 'abandonné').length,
                avgProgression: (enrollments.reduce((sum, e) => sum + e.progression, 0) / enrollments.length).toFixed(1)
            };

            console.log('\n📊 Statistiques des inscriptions:');
            console.log(`   Total: ${stats.total}`);
            console.log(`   En cours: ${stats.enCours}`);
            console.log(`   Terminés: ${stats.termines}`);
            console.log(`   Abandonnés: ${stats.abandonnes}`);
            console.log(`   Progression moyenne: ${stats.avgProgression}%`);

            // Statistiques par cours
            const coursesWithEnrollments = {};
            enrollments.forEach(e => {
                const courseId = e.coursid.toString();
                if (!coursesWithEnrollments[courseId]) {
                    coursesWithEnrollments[courseId] = 0;
                }
                coursesWithEnrollments[courseId]++;
            });

            console.log(`\n📚 ${Object.keys(coursesWithEnrollments).length} cours ont des inscriptions`);
            console.log(`   Moyenne: ${(enrollments.length / Object.keys(coursesWithEnrollments).length).toFixed(1)} inscriptions/cours`);
        }

        console.log('\n✅ Génération terminée avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

seedStudentsAndEnrollments();
