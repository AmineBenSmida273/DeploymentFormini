const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationCode, sendInstructorApprovalRequest, sendInstructorApprovalNotification } = require('../services/emailService');
const { ADMIN_EMAIL, isAdminEmail, isMainAdminUser } = require('../utils/adminConfig');
const path = require('path');

const { verifyGoogleToken } = require("../utils/google");
const { OAuth2Client } = require("google-auth-library");

const axios = require('axios');

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

const generateVerificationCode = () => crypto.randomInt(100000, 999999).toString();

// Normalise les données utilisateur à retourner au frontend
const formatUser = (user) => ({
  id: user._id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role,
  statut: user.statut,
  pdp: user.pdp,
});

/* ============================================================
   ===============   REGISTER WITH MFA   ========================
   ============================================================ */
const registerWithMFA = async (req, res) => {
  try {
    const { nom, prenom, email, mdp, role, centreProfession } = req.body;
    const cvPath = req.uploadedCV; // Chemin du fichier CV uploadé

    // Vérifier que le rôle n'est pas admin (restriction absolue)
    if (role === 'admin') {
      return res.status(403).json({
        message: `La création de comptes administrateur n'est pas autorisée. Un seul compte admin existe: ${ADMIN_EMAIL}`
      });
    }

    // Empêcher la création d'un compte avec l'email admin
    if (isAdminEmail(email)) {
      return res.status(403).json({
        message: `Cet email est réservé au compte administrateur unique`
      });
    }

    if (!nom || !prenom || !email || !mdp) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Pour les formateurs, vérifier CV et centre de profession
    if (role === 'instructor') {
      if (!cvPath) {
        return res.status(400).json({
          message: 'Le CV (PDF) est obligatoire pour les formateurs'
        });
      }
      if (!centreProfession || centreProfession.trim() === '') {
        return res.status(400).json({
          message: 'Le centre de profession est obligatoire pour les formateurs'
        });
      }
    }

    if (mdp.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const emailRegex = /^.+@.+\..+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(mdp, 12);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const userData = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      mdp: hashedPassword,
      role: role || 'student',
      pdp: null,
      dateinscri: new Date(),
      statut: role === 'instructor' ? 'suspendue' : 'active', // Formateurs suspendus en attente d'approbation
      isVerified: false,
      verificationCode,
      verificationCodeExpires
    };

    // Ajouter les champs spécifiques aux formateurs
    if (role === 'instructor') {
      userData.cv = cvPath;
      userData.centreProfession = centreProfession.trim();
      userData.statutInscription = 'pending';
      userData.dateDemande = new Date();
    }

    const user = new User(userData);
    await user.save();

    let emailSent = false;
    try {
      emailSent = await sendVerificationCode(email, verificationCode);
    } catch (err) {
      emailSent = false;
    }

    // Si formateur, envoyer email à l'admin pour approbation
    if (role === 'instructor') {
      try {
        await sendInstructorApprovalRequest(user);
      } catch (err) {
        console.error('Erreur envoi email admin:', err);
      }
    }

    console.log('📧 Code MFA :', verificationCode);

    res.status(201).json({
      message: role === 'instructor'
        ? 'Compte créé. Votre demande est en attente d\'approbation par l\'administrateur. Un code de vérification a été envoyé à votre email.'
        : emailSent
          ? 'Compte créé. Un code a été envoyé à votre email.'
          : 'Compte créé. Vérifiez la console pour le code.',
      userId: user._id,
      email: user.email,
      emailSent,
      requiresApproval: role === 'instructor'
    });

  } catch (error) {
    console.error('Erreur register MFA:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


/* ============================================================
   ===============       VERIFY MFA      ========================
   ============================================================ */
const verifyMFA = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    await user.save();

    // Vérifier si c'est l'admin principal - toujours autorisé
    const isMainAdmin = isMainAdminUser(user);

    // Vérifier si formateur en attente d'approbation
    if (user.role === 'instructor' && user.statutInscription === 'pending') {
      return res.status(403).json({
        message: 'Votre compte est vérifié mais votre demande d\'inscription est en attente d\'approbation par l\'administrateur'
      });
    }

    // Vérifier si formateur rejeté
    if (user.role === 'instructor' && user.statutInscription === 'rejected') {
      return res.status(403).json({
        message: 'Votre demande d\'inscription a été rejetée. Veuillez contacter l\'administrateur.'
      });
    }

    // Vérifier le statut (sauf pour l'admin principal)
    if (user.statut !== 'active' && !isMainAdmin) {
      return res.status(403).json({ message: 'Votre compte est suspendu' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ MFA vérifié pour:', user.email, 'Rôle:', user.role);

    res.json({
      message: 'Compte vérifié',
      user: formatUser(user),
      token,
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


/* ============================================================
   ===============   RESEND VERIFICATION   ======================
   ============================================================ */
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim(), isVerified: false });

    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé ou déjà vérifié' });
    }

    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendVerificationCode(email, verificationCode);

    res.json({
      message: 'Nouveau code envoyé',
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


/* ============================================================
   ===============   REGISTER SIMPLE   ==========================
   ============================================================ */
const register = async (req, res) => {
  try {
    const { nom, prenom, email, mdp, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Empêcher la création de comptes admin
    if (role === 'admin') {
      return res.status(403).json({
        message: `La création de comptes administrateur n'est pas autorisée. Un seul compte admin existe: ${ADMIN_EMAIL}`
      });
    }

    // Empêcher la création d'un compte avec l'email admin
    if (isAdminEmail(email)) {
      return res.status(403).json({
        message: `Cet email est réservé au compte administrateur unique`
      });
    }

    const hashedPassword = await bcrypt.hash(mdp, 12);

    const user = await User.create({
      nom,
      prenom,
      email: email.toLowerCase().trim(),
      mdp: hashedPassword,
      role: role || 'student',
      pdp: null,
      statut: 'active',
      dateinscri: new Date(),
      isVerified: true
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: formatUser(user)
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


/* ============================================================
   ====================== LOGIN ================================
   ============================================================ */
const login = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    const ok = await bcrypt.compare(mdp, user.mdp);
    if (!ok) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    // Vérifier si c'est l'admin principal - toujours autorisé
    const isMainAdmin = isMainAdminUser(user);

    if (!user.isVerified && !isMainAdmin) {
      return res.status(400).json({ message: 'Veuillez vérifier votre email.' });
    }

    // L'admin principal peut toujours se connecter même si suspendu
    if (user.statut !== 'active' && !isMainAdmin) {
      return res.status(403).json({ message: 'Votre compte est suspendu' });
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

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Connexion réussie pour:', user.email, 'Rôle:', user.role);

    res.json({
      message: 'Connexion réussie',
      token,
      user: formatUser(user),
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/* ============================================================
   ================== LOGIN AVEC MFA ===========================
   ============================================================ */
const loginWithMFA = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    const ok = await bcrypt.compare(mdp, user.mdp);
    if (!ok) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    // Vérifier si c'est l'admin principal - toujours autorisé
    const isMainAdmin = isMainAdminUser(user);

    if (!user.isVerified && !isMainAdmin) {
      return res.status(400).json({ message: 'Votre compte n\'est pas encore vérifié.' });
    }

    // L'admin principal peut toujours se connecter même si suspendu
    if (user.statut !== 'active' && !isMainAdmin) {
      return res.status(403).json({ message: 'Votre compte est suspendu' });
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

    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    let emailSent = false;
    try {
      emailSent = await sendVerificationCode(email, verificationCode);
    } catch (err) {
      emailSent = false;
    }

    console.log('📧 Code MFA envoyé pour:', user.email, 'Rôle:', user.role);

    res.json({
      message: emailSent
        ? 'Code envoyé. Veuillez vérifier votre email.'
        : 'Code généré. Vérifiez la console pour le code.',
      emailSent,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


/* ============================================================
   ================= GOOGLE OAUTH ==============================
   ============================================================ */

// Step 1 : redirect Google URL
const googleAuthRedirect = (req, res) => {
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["email", "profile", "openid"]
  });

  res.redirect(url);
};

const googleAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({ message: "Code Google manquant" });
    }

    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code"
    });

    const accessToken = tokenResponse.data.access_token;

    const googleUser = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const { id: googleId, email, given_name, family_name, picture } = googleUser.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        googleId,
        nom: family_name || null,
        prenom: given_name || null,
        pdp: picture || null,
        isVerified: true,
        mfaEnabled: false,
        mdp: null,
        role: 'student',
        statut: 'active',
        dateinscri: new Date()
      });
    }

    // Si le profil est incomplet, rediriger vers la page de complétion
    if (!user.prenom || !user.nom) {
      return res.redirect(`/auth/complete-profile?userId=${user._id}`);
    }

    // Créer le token JWT avec le rôle
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Formater les données utilisateur pour le frontend
    const userData = formatUser(user);

    // Construire l'URL de redirection
    const redirectUrl = new URL('/google-success', process.env.FRONTEND_URL);
    redirectUrl.searchParams.append('token', token);
    redirectUrl.searchParams.append('user', JSON.stringify(userData));

    console.log('Redirection vers:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error("Google Callback Error:", err.response?.data || err);
    res.status(500).json({ message: "Erreur callback Google" });
  }
};


// Login simple via idToken Google
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const payload = await verifyGoogleToken(token);
    if (!payload || !payload.email)
      return res.status(400).json({ message: "Token Google invalide" });

    const { email, name, given_name, family_name } = payload;

    // Essayer de trouver l'utilisateur par email
    let user = await User.findOne({ email });

    // Si l'utilisateur n'existe pas, le créer avec le rôle étudiant
    if (!user) {
      user = await User.create({
        nom: family_name || name.split(' ').slice(1).join(' ') || '',
        prenom: given_name || name.split(' ')[0] || '',
        email,
        mdp: null, // Pas de mot de passe pour la connexion Google
        role: 'student', // Rôle par défaut
        googleAuth: true,
        isVerified: true,
        statut: 'active',
        dateinscri: new Date(),
      });
    } else if (user.statut !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est suspendu. Veuillez contacter le support.'
      });
    }

    // Mettre à jour les informations Google si nécessaire
    if (!user.googleAuth) {
      user.googleAuth = true;
      await user.save();
    }

    // Générer le token JWT avec le rôle
    const jwtToken = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retourner les informations utilisateur formatées
    res.json({
      success: true,
      message: 'Connexion Google réussie',
      token: jwtToken,
      user: formatUser(user)
    });

  }
  catch (error) {
    console.error("Google Callback Error:", error.response?.data || error);
    res.status(500).json({ message: "Erreur Google Login", error: error.message });
  }
};


// La fonction de connexion Facebook a été supprimée

const completeProfile = async (req, res) => {
  try {
    const { userId, nom, prenom } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    user.nom = nom;
    user.prenom = prenom;
    user.profileComplete = true;

    await user.save();

    // Redirection directe vers la page EJS
    res.redirect('/auth/dashboard-construction');

  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
};



/* ============================================================
   ===============   PASSWORD RESET   ==========================
   ============================================================ */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Pour sécurité, on ne dit pas si l'utilisateur n'existe pas
      // Mais pour le debug dev, on peut logger
      console.log('Forgot Password: Utilisateur non trouvé pour', email);
      return res.status(200).json({ message: 'Si un compte existe, un code a été envoyé.' });
    }

    const resetCode = generateVerificationCode();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    await sendVerificationCode(email, resetCode); // Réutilisation de la fonction d'envoi de code

    res.json({ message: 'Code de réinitialisation envoyé' });

  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    res.json({ message: 'Code valide' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Session expirée ou code invalide' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.mdp = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    // Si le compte n'était pas vérifié, on le considère vérifié après un reset mdp réussi via email
    if (!user.isVerified) user.isVerified = true;

    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


/* ============================================================
   =================== EXPORT FINAL =============================
   ============================================================ */
module.exports = {
  // Export des fonctions
  registerWithMFA,
  verifyMFA,
  resendVerificationCode,
  register,
  login,
  loginWithMFA,
  googleAuthRedirect,
  googleAuthCallback,
  googleLogin,
  completeProfile,
  forgotPassword,
  verifyResetCode,
  resetPassword
};
