const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({

  titre: {
    type: String,
    required: [true, 'Le titre du cours est requis'],
    trim: true,
    minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },

  description: {
    type: String,
    required: [true, 'La description est requise'],
    minlength: [20, 'La description doit contenir au moins 20 caractères']
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise']
  },
  formateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  programme: {
    type: String
  },
  image: {
    type: String,
    default: 'default-course.jpg'
  },
  niveau: {
    type: String,
    enum: {
      values: ['débutant', 'intermédiaire', 'avancé'],
      message: 'Le niveau doit être débutant, intermédiaire ou avancé'
    },
    default: 'débutant'
  },
  prix: {
    type: Number,
    min: [0, 'Le prix ne peut pas être négatif'],
    default: 0
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuvé', 'rejeté'],
    default: 'en_attente'
  },

  raisonRejet: {
    type: String,
    default: null
  },
  dateApprobation: {
    type: Date,
    default: null
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateApprobation: {
    type: Date
  },
  approuvePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duree: {
    type: Number, // Durée en heures
    min: [1, 'La durée minimale est de 1 heure'],

    default: 1
  },
  objectifs: [{
    type: String
  }],
  prerequis: [{
    type: String
  }],
  etudiantsInscrits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  chapitres: [{
    titre: {

      type: String
    },
    description: {
      type: String
    },
    duree: {
      type: Number // Durée en minutes
    },
    type: {
      type: String,
      enum: ['text', 'video', 'pdf'],
      default: 'text'
    },
    contenu: {
      type: String // Pour le type 'text'
    },
    fichierUrl: {
      type: String // URL du fichier pour 'video' ou 'pdf'
    },
    fichierNom: {
      type: String // Nom original du fichier
    },
    ressources: [{
      type: String // URLs des ressources supplémentaires
    }]
  }],
  notesMoyennes: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  avis: [{
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    commentaire: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches par titre, catégorie et niveau
courseSchema.index({ titre: 'text', categorie: 'text' });

// Middleware pour mettre à jour la date d'approbation

courseSchema.pre('save', function (next) {
  if (this.isModified('statut') && this.statut === 'approuvé') {
    this.dateApprobation = Date.now();
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
