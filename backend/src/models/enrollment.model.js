const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  etudiantid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coursid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  dateinscription: {
    type: Date,
    default: Date.now
  },
  progression: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  statut: {
    type: String,
    enum: ['en_cours', 'terminé', 'abandonné'],
    default: 'en_cours'
  },
  derniereactivite: {
    type: Date,
    default: Date.now
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'flouci', 'free'],
    default: 'free'
  },
  montantPaye: {
    type: Number,
    default: 0
  },
  datePaiement: {
    type: Date,
    default: null
  },
  statutPaiement: {
    type: String,
    enum: ['en_attente', 'payé', 'échoué', 'remboursé'],
    default: 'payé'
  }
}, {
  timestamps: true,
  collection: 'inscriptionstudent'  // Nom explicite de la collection

});

// Index pour améliorer les performances
enrollmentSchema.index({ etudiantid: 1, coursid: 1 }, { unique: true });
enrollmentSchema.index({ coursid: 1 });
enrollmentSchema.index({ dateinscription: 1 });
enrollmentSchema.index({ statutPaiement: 1 });

module.exports = mongoose.model('InscriptionStudent', enrollmentSchema);

