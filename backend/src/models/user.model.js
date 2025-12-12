const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    trim: true,
    default: null
  },
  prenom: {
    type: String,
    trim: true,
    default: null
  },

  // Pour éviter le conflit d'index "username"
  username: {
    type: String,
    unique: true,
    sparse: true, // autorise unique mais null possible
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^.+@.+\..+$/, 'Veuillez entrer un email valide']
  },

  // Mot de passe (peut être nul si Google Login)
  mdp: {
    type: String,
    minlength: 8,
    default: null
  },

  // Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },

  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },

  pdp: { type: String, default: null },

  dateinscri: {
    type: Date,
    default: Date.now
  },

  statut: {
    type: String,
    enum: ['active', 'suspendue'],
    default: 'active'
  },

  // --- FORMATEUR SPECIFIQUE ---
  cv: { type: String, default: null }, // Chemin vers le fichier CV PDF
  centreProfession: { type: String, default: null }, // Centre de profession
  statutInscription: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: false, // Optionnel - seulement pour les formateurs
    // Pas de default - le champ ne sera pas défini si ce n'est pas un formateur
  }, // Pour les formateurs: en attente, approuvé, rejeté
  dateDemande: { type: Date, default: null }, // Date de demande d'inscription pour formateur

  // --- MFA ---
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationCodeExpires: { type: Date, default: null },
  mfaEnabled: { type: Boolean, default: true },

  // --- PASSWORD RESET ---
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

  // --- LOGIN SECURITY ---
  lastLogin: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

}, { timestamps: true });


// ------ Virtual ------
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});


// ------ METHODS ------
userSchema.methods.incrementLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};


module.exports = mongoose.model('User', userSchema);
