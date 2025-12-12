/**
 * Script de test de l'API getStudentStats
 * Simule ce que fait le frontend
 */

require('dotenv').config();
const mongoose = require('mongoose');
const userController = require('../controllers/user.controller');

async function testAPI() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        const email = process.argv[2] || 'test@example.com';
        const User = require('../models/user.model');

        const student = await User.findOne({ email: email });

        if (!student) {
            console.log(`❌ Étudiant non trouvé: ${email}`);
            process.exit(1);
        }

        console.log(`🧪 Test API pour: ${student.prenom} ${student.nom}\n`);

        // Simuler la requête
        const req = {
            user: { _id: student._id, email: student.email, role: 'student' }
        };

        const res = {
            json: (data) => {
                console.log('📊 Réponse de l\'API:\n');
                console.log(`Cours inscrits: ${data.stats?.coursesEnrolled || 0}`);
                console.log(`Cours terminés: ${data.stats?.coursesCompleted || 0}`);
                console.log(`Cours en cours: ${data.stats?.coursesInProgress || 0}`);
                console.log(`Certificats: ${data.stats?.certificates || 0}`);
                console.log(`Heures totales: ${data.stats?.totalHours || 0}`);
                console.log(`Score moyen: ${data.stats?.averageScore || 0}\n`);

                console.log(`📚 Mes cours (${data.myCourses?.length || 0}):`);
                if (data.myCourses && data.myCourses.length > 0) {
                    data.myCourses.forEach((course, index) => {
                        console.log(`${index + 1}. ${course.title}`);
                        console.log(`   Progression: ${course.progress}%`);
                        console.log(`   Statut: ${course.status}\n`);
                    });
                } else {
                    console.log('   Aucun cours trouvé\n');
                }

                console.log(`🕐 Activité récente (${data.recentActivity?.length || 0} items)`);
                if (data.recentActivity && data.recentActivity.length > 0) {
                    data.recentActivity.slice(0, 3).forEach(activity => {
                        console.log(`   - ${activity.action}: ${activity.course}`);
                    });
                }

                process.exit(0);
            },
            status: (code) => ({
                json: (error) => {
                    console.error(`❌ Erreur ${code}:`, error);
                    process.exit(1);
                }
            })
        };

        // Appeler le controller
        await userController.getStudentStats(req, res);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

testAPI();
