require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/user.model');
const bcrypt = require('bcryptjs');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./utils/adminConfig');

// Fonction pour s'assurer que l'admin unique existe
async function ensureAdminExists() {
  try {
    // Attendre que la connexion DB soit établie
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    
    // Attendre un peu pour que la connexion soit stable
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Nettoyer les utilisateurs avec statutInscription: null (invalide pour l'enum)
    // Utiliser updateMany avec $unset pour supprimer le champ
    const cleanedNull = await User.updateMany(
      { statutInscription: null },
      { $unset: { statutInscription: "" } }
    );
    if (cleanedNull.modifiedCount > 0) {
      console.log(`🧹 ${cleanedNull.modifiedCount} utilisateur(s) nettoyé(s) (statutInscription: null supprimé)`);
    }
    
    // Nettoyer aussi les admins et étudiants qui ne devraient pas avoir ce champ
    const cleanedNonInstructors = await User.updateMany(
      { 
        role: { $ne: 'instructor' },
        statutInscription: { $exists: true }
      },
      { $unset: { statutInscription: "" } }
    );
    if (cleanedNonInstructors.modifiedCount > 0) {
      console.log(`🧹 ${cleanedNonInstructors.modifiedCount} utilisateur(s) non-formateur(s) nettoyé(s)`);
    }
    
    // Supprimer tous les autres admins
    const deleted = await User.deleteMany({ role: 'admin', email: { $ne: ADMIN_EMAIL } });
    if (deleted.deletedCount > 0) {
      console.log(`⚠️  ${deleted.deletedCount} autre(s) compte(s) admin supprimé(s)`);
    }
    
    // Vérifier si l'admin principal existe
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!admin) {
      // Créer l'admin
      admin = new User({
        nom: 'Admin',
        prenom: 'Formini',
        email: ADMIN_EMAIL,
        mdp: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: 'admin',
        statut: 'active',
        isVerified: true,
        dateinscri: new Date()
        // Ne pas définir statutInscription pour l'admin
      });
      await admin.save();
      console.log(`✅ Compte admin unique créé: ${ADMIN_EMAIL}`);
    } else {
      // S'assurer que le mot de passe est correct et que c'est bien un admin
      const passwordMatch = await bcrypt.compare(ADMIN_PASSWORD, admin.mdp);
      if (!passwordMatch || admin.role !== 'admin') {
        admin.mdp = await bcrypt.hash(ADMIN_PASSWORD, 12);
        admin.role = 'admin';
        admin.statut = 'active';
        admin.isVerified = true;
        // Supprimer statutInscription si présent (ce n'est pas un formateur)
        if (admin.statutInscription !== undefined) {
          admin.statutInscription = undefined;
        }
        await admin.save();
        console.log(`✅ Compte admin mis à jour: ${ADMIN_EMAIL}`);
      } else {
        // S'assurer que statutInscription n'est pas défini pour l'admin
        if (admin.statutInscription !== undefined) {
          admin.statutInscription = undefined;
          await admin.save();
        }
      }
    }
    
    // Vérification finale
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount !== 1) {
      await User.deleteMany({ role: 'admin', email: { $ne: ADMIN_EMAIL } });
      console.log(`✅ Un seul compte admin garanti: ${ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de l\'admin:', error);
    // Ne pas bloquer le démarrage du serveur
  }
}

// S'assurer que l'admin existe après la connexion DB
connectDB().then(() => {
  ensureAdminExists();
}).catch(err => {
  console.error('Erreur connexion DB:', err);
});

// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 Compte admin unique: ${ADMIN_EMAIL}`);
  console.log(`🔑 Mot de passe: ${ADMIN_PASSWORD}`);
});
