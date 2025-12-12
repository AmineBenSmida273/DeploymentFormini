const User = require('../models/user.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const QuizResult = require('../models/quizResult.model');
const Review = require('../models/review.model');
const Lesson = require('../models/lesson.model');
const Quiz = require('../models/quiz.model');
const { sendInstructorApprovalNotification } = require('../services/emailService');
const { ADMIN_EMAIL, isMainAdminUser } = require('../utils/adminConfig');
const path = require('path');
const fs = require('fs');

// Récupérer les détails d'un utilisateur spécifique
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-mdp');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let details = {};

    if (user.role === 'student') {
      // Logique similaire à getStudentStats mais pour ce userId
      const enrollments = await Enrollment.find({ student: userId })
        .populate('course', 'titre description image')
        .lean();

      details.enrollments = await Promise.all(enrollments.map(async (e) => {
        if (!e.course) return null;

        // Calculer la progression réelle si possible
        const lessons = await Lesson.countDocuments({ course: e.course._id });
        const progress = e.progression || 0;

        return {
          courseId: e.course._id,
          title: e.course.titre,
          image: e.course.image,
          progress,
          status: e.statut,
          dateInscription: e.dateInscription
        };
      }));

      // Filtrer les nulls
      details.enrollments = details.enrollments.filter(e => e !== null);

      details.stats = {
        coursesEnrolled: enrollments.length,
        coursesCompleted: enrollments.filter(e => e.statut === 'completed').length,
      };

    } else if (user.role === 'instructor') {
      // Récupérer les cours du formateur
      const courses = await Course.find({ formateur: userId }).lean();

      details.courses = await Promise.all(courses.map(async (c) => {
        const studentCount = await Enrollment.countDocuments({ course: c._id });
        const reviews = await Review.find({ course: c._id });
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        return {
          id: c._id,
          title: c.titre,
          students: studentCount,
          rating: Math.round(avgRating * 10) / 10,
          revenue: studentCount * (c.prix || 0)
        };
      }));

      details.stats = {
        totalCourses: courses.length,
        totalStudents: details.courses.reduce((sum, c) => sum + c.students, 0)
      };
    }

    res.json({
      user,
      details
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des détails',
      error: error.message
    });
  }
};

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('nom prenom email role statut dateinscri')
      .sort({ dateinscri: -1 })
      .lean();

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// Récupérer tous les formateurs en attente d'approbation
exports.getPendingInstructors = async (req, res) => {
  try {
    const pendingInstructors = await User.find({
      role: 'instructor',
      statutInscription: 'pending'
    })
      .select('nom prenom email centreProfession cv dateDemande dateinscri')
      .sort({ dateDemande: -1 })
      .lean();

    res.json({
      instructors: pendingInstructors.map(instructor => ({
        id: instructor._id,
        nom: instructor.nom,
        prenom: instructor.prenom,
        email: instructor.email,
        centreProfession: instructor.centreProfession,
        cv: instructor.cv,
        dateDemande: instructor.dateDemande,
        dateinscri: instructor.dateinscri
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des formateurs',
      error: error.message
    });
  }
};

// Approuver un formateur
exports.approveInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Formateur non trouvé' });
    }

    if (instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'Cet utilisateur n\'est pas un formateur' });
    }

    // Mettre à jour le statut
    instructor.statutInscription = 'approved';
    instructor.statut = 'active';
    instructor.isVerified = true; // Activer le compte
    await instructor.save();

    // Envoyer email de notification
    try {
      await sendInstructorApprovalNotification(instructor, true);
    } catch (err) {
      console.error('Erreur envoi email:', err);
    }

    res.json({
      message: 'Formateur approuvé avec succès',
      instructor: {
        id: instructor._id,
        nom: instructor.nom,
        prenom: instructor.prenom,
        email: instructor.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de l\'approbation',
      error: error.message
    });
  }
};

// Rejeter un formateur
exports.rejectInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Formateur non trouvé' });
    }

    if (instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'Cet utilisateur n\'est pas un formateur' });
    }

    // Envoyer email de notification avant suppression
    try {
      await sendInstructorApprovalNotification(instructor, false);
    } catch (err) {
      console.error('Erreur envoi email:', err);
    }

    // Supprimer le CV
    if (instructor.cv) {
      const cvPath = path.join(__dirname, '..', instructor.cv);
      if (fs.existsSync(cvPath)) {
        fs.unlinkSync(cvPath);
      }
    }

    // Supprimer l'utilisateur de la base de données
    await User.findByIdAndDelete(instructorId);

    res.json({
      message: 'Formateur rejeté',
      instructor: {
        id: instructor._id,
        nom: instructor.nom,
        prenom: instructor.prenom,
        email: instructor.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du rejet',
      error: error.message
    });
  }
};

// Télécharger le CV d'un formateur
exports.downloadCV = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Formateur non trouvé' });
    }

    if (!instructor.cv) {
      return res.status(404).json({ message: 'CV non trouvé' });
    }

    const cvPath = path.join(__dirname, '..', instructor.cv);
    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({ message: 'Fichier CV introuvable' });
    }

    res.download(cvPath, `${instructor.prenom}_${instructor.nom}_CV.pdf`);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du téléchargement',
      error: error.message
    });
  }
};

// Changer le statut d'un utilisateur (suspendre/activer)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.body;

    if (!['active', 'suspendue'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre de suspendre ou modifier le compte admin principal
    if (isMainAdminUser(user)) {
      return res.status(403).json({
        message: `Impossible de modifier le compte administrateur principal (${ADMIN_EMAIL})`
      });
    }

    // Ne pas permettre de suspendre un autre admin
    if (user.role === 'admin' && statut === 'suspendue') {
      return res.status(403).json({ message: 'Impossible de suspendre un administrateur' });
    }

    user.statut = statut;
    await user.save();

    res.json({
      message: `Utilisateur ${statut === 'active' ? 'activé' : 'suspendu'} avec succès`,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        statut: user.statut
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la modification du statut',
      error: error.message
    });
  }
};
