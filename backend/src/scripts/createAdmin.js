require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('../utils/adminConfig');

// Script pour créer le compte admin unique
async function createAdmin() {
  try {
    // Connexion à la base de données
    await connectDB();
    console.log('✅ Connexion à la base de données réussie');

    // SUPPRIMER TOUS LES AUTRES ADMINS (garantir un seul admin)
    const deletedCount = await User.deleteMany({ 
      role: 'admin', 
      email: { $ne: ADMIN_EMAIL } 
    });
    if (deletedCount.deletedCount > 0) {
      console.log(`⚠️  ${deletedCount.deletedCount} autre(s) compte(s) admin supprimé(s).`);
    }

    // Vérifier si l'admin principal existe déjà
    let existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      // Mettre à jour le mot de passe si nécessaire
      const passwordMatch = await bcrypt.compare(ADMIN_PASSWORD, existingAdmin.mdp);
      if (!passwordMatch) {
        existingAdmin.mdp = await bcrypt.hash(ADMIN_PASSWORD, 12);
        existingAdmin.role = 'admin';
        existingAdmin.statut = 'active';
        existingAdmin.isVerified = true;
        // Supprimer statutInscription si présent (ce n'est pas un formateur)
        if (existingAdmin.statutInscription !== undefined) {
          existingAdmin.statutInscription = undefined;
        }
        await existingAdmin.save();
        console.log('✅ Compte admin mis à jour avec le nouveau mot de passe');
      } else {
        // S'assurer que statutInscription n'est pas défini pour l'admin
        if (existingAdmin.statutInscription !== undefined) {
          existingAdmin.statutInscription = undefined;
          await existingAdmin.save();
        }
        console.log('✅ Le compte administrateur existe déjà:', ADMIN_EMAIL);
      }
    } else {
      // Créer l'admin
      const adminData = {
        nom: 'Admin',
        prenom: 'Formini',
        email: ADMIN_EMAIL,
        mdp: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: 'admin',
        statut: 'active',
        isVerified: true,
        dateinscri: new Date()
        // Ne pas définir statutInscription pour l'admin
      };

      const admin = new User(adminData);
      await admin.save();
      console.log('✅ Compte admin créé avec succès');
    }

    // Vérification finale : s'assurer qu'il n'y a qu'un seul admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount !== 1) {
      console.log(`⚠️  ATTENTION: Il y a ${adminCount} compte(s) admin. Suppression des autres...`);
      await User.deleteMany({ role: 'admin', email: { $ne: ADMIN_EMAIL } });
      console.log('✅ Un seul compte admin garanti:', ADMIN_EMAIL);
    }

    console.log('\n✅ ============================================');
    console.log('✅ COMPTE ADMIN UNIQUE CONFIGURÉ');
    console.log('✅ ============================================');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Mot de passe:', ADMIN_PASSWORD);
    console.log('✅ ============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    process.exit(1);
  }
}

// Exécuter le script
createAdmin();
