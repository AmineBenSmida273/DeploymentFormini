/**
 * Script de test pour vérifier les inscriptions d'un étudiant
 * Usage: node src/scripts/testStudentEnrollments.js <email_etudiant>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Enrollment = require('../models/enrollment.model');
const User = require('../models/user.model');
const Course = require('../models/course.model');

async function testEnrollments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // Récupérer l'email depuis les arguments
        const email = process.argv[2];

        if (!email) {
            console.log('Usage: node src/scripts/testStudentEnrollments.js <email_etudiant>');
            process.exit(1);
        }

        // Trouver l'étudiant
        const student = await User.findOne({ email: email });

        if (!student) {
            console.log(`❌ Étudiant non trouvé: ${email}`);
            process.exit(1);
        }

        console.log(`👤 Étudiant: ${student.prenom} ${student.nom} (${student.email})`);
        console.log(`   ID: ${student._id}\n`);

        // Récupérer ses inscriptions
        const enrollments = await Enrollment.find({ etudiantid: student._id })
            .populate('coursid', 'titre prix')
            .lean();

        console.log(`📊 Nombre total d'inscriptions: ${enrollments.length}\n`);

        if (enrollments.length === 0) {
            console.log('❌ Aucune inscription trouvée pour cet étudiant');
        } else {
            console.log('📚 Liste des inscriptions:\n');
            enrollments.forEach((enrollment, index) => {
                console.log(`${index + 1}. ${enrollment.coursid?.titre || 'Cours supprimé'}`);
                console.log(`   - ID Inscription: ${enrollment._id}`);
                console.log(`   - Montant payé: ${enrollment.montantPaye} DT`);
                console.log(`   - Méthode: ${enrollment.paymentMethod}`);
                console.log(`   - Statut paiement: ${enrollment.statutPaiement}`);
                console.log(`   - Statut cours: ${enrollment.statut}`);
                console.log(`   - Date inscription: ${new Date(enrollment.dateinscription).toLocaleDateString('fr-FR')}`);
                console.log(`   - Transaction ID: ${enrollment.transactionId}\n`);
            });
        }

        // Tester l'API getStudentStats
        console.log('\n🔍 Test de la requête API simulée:');
        console.log(`   Recherche: Enrollment.find({ etudiantid: "${student._id}" })`);

        const testEnrollments = await Enrollment.find({ etudiantid: student._id }).lean();
        console.log(`   Résultat: ${testEnrollments.length} inscriptions trouvées\n`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connexion fermée');
    }
}

testEnrollments();
