const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { isMainAdminUser } = require('../utils/adminConfig');

// Middleware pour vérifier le token JWT
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-mdp');

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.statut !== 'active') {
      // Exception pour l'admin principal - toujours actif
      if (!isMainAdminUser(user)) {
        return res.status(403).json({ message: 'Compte suspendu' });
      }
    }

    // Vérifier si formateur en attente d'approbation
    if (user.role === 'instructor' && user.statutInscription === 'pending') {

      return res.status(403).json({
        message: 'Votre demande d\'inscription est en attente d\'approbation par l\'administrateur'

      });
    }

    // Vérifier si formateur rejeté
    if (user.role === 'instructor' && user.statutInscription === 'rejected') {

      return res.status(403).json({
        message: 'Votre demande d\'inscription a été rejetée. Veuillez contacter l\'administrateur.'

      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


// Middleware pour vérifier le token JWT s'il est présent (authentification optionnelle)
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(); // Pas de token, on continue en tant qu'utilisateur anonyme
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-mdp');

    if (user && user.statut === 'active') {
      req.user = user;
    }

    next();
  } catch (error) {
    // Si token invalide ou expiré, on continue quand même comme anonyme
    // car c'est une auth optionnelle
    next();
  }
};

// Middleware pour vérifier le rôle
exports.verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    next();
  };
};

