const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  titre: { type: String, required: true, trim: true },
  contenu: { type: String, default: '' },
  dureeMinutes: { type: Number, default: 0 }, // durée en minutes
  ordre: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
