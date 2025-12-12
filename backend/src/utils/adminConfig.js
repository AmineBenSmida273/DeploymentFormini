// ============================================
// CONFIGURATION DU COMPTE ADMIN UNIQUE
// ============================================
// Ce fichier contient les identifiants du SEUL compte admin autorisé
// Ces valeurs sont hardcodées pour garantir la sécurité

const ADMIN_EMAIL = 'admin@formini.com';
const ADMIN_PASSWORD = 'formini.lab2025';

// Fonction pour vérifier si un utilisateur est le compte admin principal
const isMainAdminUser = (user) => {
  if (!user) return false;
  return user.role === 'admin' && user.email === ADMIN_EMAIL;
};

// Fonction pour vérifier si un email est celui de l'admin
const isAdminEmail = (email) => {
  return email && email.toLowerCase().trim() === ADMIN_EMAIL;
};

module.exports = {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  isMainAdminUser,
  isAdminEmail
};
