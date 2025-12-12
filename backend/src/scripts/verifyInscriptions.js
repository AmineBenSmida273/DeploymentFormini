/**
 * Script pour vérifier et afficher les inscriptions dans MongoDB
 * 
 * Ce script se connecte à la base de données et affiche:
 * - Le nombre total d'inscriptions
 * - Les dernières inscriptions
 * - Les statistiques de paiement
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Enrollment = require('../models/enrollment.model');
const User = require('../models/user.model');
const Course = require('../models/course.model');

async function verifyInscriptions() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // Compter le total des inscriptions
        const totalInscriptions = await Enrollment.countDocuments();
        console.log(`📊 Total des inscriptions: ${totalInscriptions}`);

        // Statistiques par méthode de paiement
        const paymentStats = await Enrollment.aggregate([
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalMontant: { $sum: '$montantPaye' }
                }
            }
        ]);

        console.log('\n💳 Statistiques par méthode de paiement:');
        paymentStats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count} inscriptions (${stat.totalMontant} DT)`);
        });

        // Statistiques par statut de paiement
        const statusStats = await Enrollment.aggregate([
            {
                $group: {
                    _id: '$statutPaiement',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📈 Statistiques par statut:');
        statusStats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count} inscriptions`);
        });

        // Afficher les 5 dernières inscriptions
        const recentInscriptions = await Enrollment.find()
            .populate('etudiantid', 'prenom nom email')
            .populate('coursid', 'titre prix')
            .sort({ dateinscription: -1 })
            .limit(5)
            .lean();

        console.log('\n📋 5 dernières inscriptions:');
        recentInscriptions.forEach((inscription, index) => {
            console.log(`\n${index + 1}. Inscription ID: ${inscription._id}`);
            console.log(`   Étudiant: ${inscription.etudiantid?.prenom} ${inscription.etudiantid?.nom}`);
            console.log(`   Cours: ${inscription.coursid?.titre}`);
            console.log(`   Montant: ${inscription.montantPaye} DT`);
            console.log(`   Méthode: ${inscription.paymentMethod}`);
            console.log(`   Statut: ${inscription.statutPaiement}`);
            console.log(`   Date: ${new Date(inscription.dateinscription).toLocaleDateString('fr-FR')}`);
        });

        // Revenus totaux
        const totalRevenue = await Enrollment.aggregate([
            {
                $match: { statutPaiement: 'payé' }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$montantPaye' }
                }
            }
        ]);

        console.log(`\n💰 Revenus totaux: ${totalRevenue[0]?.total || 0} DT`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connexion fermée');
    }
}

// Exécuter le script
verifyInscriptions();
