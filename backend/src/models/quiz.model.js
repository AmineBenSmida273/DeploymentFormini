const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  titre: { type: String, required: true, trim: true },
  questions: { type: Array, default: [] },
  duree: { type: Number, default: 0 } // en minutes
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
