const express = require('express');
const router = express.Router();
const { uploadMiddleware, validatePDF } = require('../middleware/upload.middleware');

// Import du controller
const authController = require('../controllers/auth.controller');

// Page de dashboard en construction
router.get('/dashboard-construction', (req, res) => {
  res.render('dashboard-construction');
});

// Page pour compléter le profil
router.get('/complete-profile', (req, res) => {
  const { userId } = req.query;
  res.render('complete-profile', { userId });
});

// Inscription avec MFA (avec upload CV pour formateurs)
router.post('/register-mfa', uploadMiddleware, validatePDF, authController.registerWithMFA);

// Vérification MFA
router.post('/verify-mfa', authController.verifyMFA);

// Renvoyer un nouveau code MFA
router.post('/resend-verification', authController.resendVerificationCode);

// Inscription classique
router.post('/register', authController.register);

// Connexion classique
router.post('/login', authController.login);

// Connexion avec MFA (envoi de code)
router.post('/login-mfa', authController.loginWithMFA);

// Login Google (idToken envoyé par le frontend)
router.post('/google-login', authController.googleLogin);

// Démarrer OAuth Google côté serveur
router.get('/google', authController.googleAuthRedirect);

// Callback Google après redirection
router.get('/google/callback', authController.googleAuthCallback);

// PASSWORD RESET
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

router.post('/complete-profile', authController.completeProfile);

module.exports = router;