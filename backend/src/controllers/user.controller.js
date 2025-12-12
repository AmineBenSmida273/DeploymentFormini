const User = require('../models/user.model');
const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const Quiz = require('../models/quiz.model');
const QuizResult = require('../models/quizResult.model');
const Review = require('../models/review.model');
const Enrollment = require('../models/enrollment.model'); // Standardized name

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ADMIN_EMAIL, isAdminEmail } = require('../utils/adminConfig');

exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, mdp, role } = req.body;

    // Vérifications manuelles supplémentaires
    if (!nom || !prenom || !email || !mdp) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    if (mdp.length < 8) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Validation email basique
    const emailRegex = /^.+@.+\..+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Format d\'email invalide'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Empêcher la création de comptes admin via cette route
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

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mdp, 12);

    // Créer le nouvel utilisateur avec TOUS les champs requis
    const user = new User({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      mdp: hashedPassword,
      role: role || 'student',
      pdp: null, // Explicitement null comme dans le validateur
      dateinscri: new Date(), // Date actuelle
      statut: 'active' // Statut par défaut
    });

    await user.save();

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        dateinscri: user.dateinscri
      }
    });

  } catch (error) {
    console.error('Erreur register détaillée:', error);

    // Gestion spécifique des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Erreur de validation',
        errors: errors
      });
    }

    if (error.code === 121) { // Code d'erreur de validation MongoDB
      return res.status(400).json({
        message: 'Les données ne respectent pas le schéma de validation',
        error: error.errInfo?.details
      });
    }

    res.status(500).json({
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier que le compte est actif
    if (user.statut !== 'active') {
      return res.status(400).json({ message: 'Votre compte est suspendu' });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }

};

// ==================== PROFILE MANAGEMENT ====================

// Récupérer le profil utilisateur
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-mdp');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

// Mettre à jour le profil utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { nom, prenom, telephone, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (nom) user.nom = nom.trim();
    if (prenom) user.prenom = prenom.trim();
    if (telephone !== undefined) user.telephone = telephone;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        telephone: user.telephone,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
};

// ==================== SETTINGS & REVIEWS ====================

// Changer le mot de passe
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, currentPassword, newPassword } = req.body;

    // Support both naming conventions
    const passwordToVerify = currentPassword || oldPassword;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(passwordToVerify, user.mdp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.mdp = hashedPassword;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur changePassword:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe', error: error.message });
  }
};

// Récupérer les avis de l'utilisateur
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviews = await Review.find({ student: userId })
      .populate('course', 'titre image')
      .sort({ createdAt: -1 });

    res.json(reviews.map(review => ({
      id: review._id,
      courseTitle: review.course?.titre || 'Cours inconnu',
      courseImage: review.course?.image,
      rating: review.rating,
      comment: review.commentaire,
      date: review.createdAt
    })));
  } catch (error) {
    console.error('Erreur getMyReviews:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des avis' });
  }
};

// Mettre à jour un avis
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findOne({ _id: reviewId, student: userId });

    if (!review) {
      return res.status(404).json({ message: 'Avis non trouvé ou non autorisé' });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.commentaire = comment;

    await review.save();

    res.json({ message: 'Avis mis à jour avec succès', review });
  } catch (error) {
    console.error('Erreur updateReview:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'avis' });
  }
};

// Récupérer les certificats (inscriptions terminées)
exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user._id;

    // Trouver les inscriptions avec statut 'terminé'
    const certificates = await Enrollment.find({
      etudiantid: userId,
      statut: 'terminé'
    })
      .populate({
        path: 'coursid',
        select: 'titre image categorie formateur',
        populate: {
          path: 'formateur',
          select: 'nom prenom'
        }
      })
      .sort({ updatedAt: -1 });

    res.json(certificates.map(cert => ({
      id: cert._id,
      courseTitle: cert.coursid?.titre || 'Cours inconnu',
      courseImage: cert.coursid?.image,
      category: cert.coursid?.categorie || 'Général',
      date: cert.updatedAt,
      instructorName: cert.coursid?.formateur ? `${cert.coursid.formateur.prenom} ${cert.coursid.formateur.nom}` : 'Formini'
    })));
  } catch (error) {
    console.error('Erreur getMyCertificates:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des certificats' });
  }
};

// =============== DASHBOARD STATISTICS ========================

// Statistiques pour Admin
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ statut: 'active' });
    const suspendedUsers = await User.countDocuments({ statut: 'suspendue' });

    // Statistiques sur les cours
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Calculer la note moyenne globale
    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

    // Utilisateurs récents (10 derniers)
    const recentUsers = await User.find()
      .select('nom prenom email role statut dateinscri')
      .sort({ dateinscri: -1 })
      .limit(10)
      .lean();

    // Formateurs en attente d'approbation
    const pendingInstructors = await User.find({
      role: 'instructor',
      statutInscription: 'pending'
    })
      .select('nom prenom email centreProfession cv dateDemande')
      .sort({ dateDemande: -1 })
      .lean();

    // Plage pour les tendances (7 derniers jours)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const buildDateKey = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    };

    const getDisplayDate = (date) => {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const userTrendAggregation = await User.aggregate([
      { $match: { dateinscri: { $gte: startDate } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$dateinscri' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.day',
          roles: {
            $push: {
              role: '$_id.role',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const courseTrendAggregation = await Course.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const enrollmentTrendAggregation = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const courseCategories = await Course.aggregate([
      { $group: { _id: '$categorie', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const makeSeries = (days) => {
      const series = [];
      const cursor = new Date();
      cursor.setDate(cursor.getDate() - (days - 1));
      for (let i = 0; i < days; i++) {
        series.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      return series;
    };

    const userTrends = makeSeries(7).map((date) => {
      const key = buildDateKey(date);
      const dayData = userTrendAggregation.find((d) => d._id === key);
      const roleCounts = { student: 0, instructor: 0, admin: 0 };
      if (dayData) {
        dayData.roles.forEach((r) => {
          roleCounts[r.role] = r.count;
        });
      }
      return {
        date: getDisplayDate(date),
        students: roleCounts.student || 0,
        instructors: roleCounts.instructor || 0,
        admins: roleCounts.admin || 0
      };
    });

    const courseTrends = makeSeries(7).map((date) => {
      const key = buildDateKey(date);
      const dayData = courseTrendAggregation.find((d) => d._id === key);
      return {
        date: getDisplayDate(date),
        courses: dayData ? dayData.count : 0
      };
    });

    const enrollmentTrends = makeSeries(7).map((date) => {
      const key = buildDateKey(date);
      const dayData = enrollmentTrendAggregation.find((d) => d._id === key);
      return {
        date: getDisplayDate(date),
        enrollments: dayData ? dayData.count : 0
      };
    });

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        totalCourses,
        totalLessons,
        totalQuizzes,
        totalEnrollments,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        pendingInstructors: pendingInstructors.length,
        roleDistribution: [
          { role: 'student', count: totalStudents },
          { role: 'instructor', count: totalInstructors },
          { role: 'admin', count: totalAdmins },
        ],
        statusDistribution: [
          { status: 'active', count: activeUsers },
          { status: 'suspendue', count: suspendedUsers },
        ],
        categoryDistribution: courseCategories.map((c) => ({
          category: c._id || 'Non classé',
          count: c.count
        })),
      },
      recentUsers: recentUsers.map(user => ({
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        dateinscri: user.dateinscri,
      })),
      pendingInstructors: pendingInstructors.map(instructor => ({
        id: instructor._id,
        nom: instructor.nom,
        prenom: instructor.prenom,
        email: instructor.email,
        centreProfession: instructor.centreProfession,
        cv: instructor.cv,
        dateDemande: instructor.dateDemande,
      })),
      userTrends,
      courseTrends,
      enrollmentTrends
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// Statistiques pour Étudiant
exports.getStudentStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Récupérer les inscriptions de l'étudiant
    const enrollments = await Enrollment.find({ etudiantid: userId })
      .populate('coursid', 'titre description image formateur')
      .populate({
        path: 'coursid',
        populate: {
          path: 'formateur',
          select: 'nom prenom'
        }
      })
      .lean();

    const coursesEnrolled = enrollments.length;
    const coursesCompleted = enrollments.filter(e => e.statut === 'terminé').length;
    const coursesInProgress = enrollments.filter(e => e.statut === 'en_cours').length;

    // Calculer les heures totales d'apprentissage (somme des durées des leçons complétées)
    const totalHours = enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.progression || 0) * 0.1; // Approximation basée sur la progression
    }, 0);

    // Score moyen = taux de complétion (cours terminés / cours inscrits * 100)
    const averageScore = coursesEnrolled > 0
      ? Math.round((coursesCompleted / coursesEnrolled) * 100)
      : 0;

    // Certificats = cours complétés
    const certificates = enrollments.filter(e => e.statut === 'terminé').length;

    // Mes cours avec détails
    const myCourses = enrollments
      .filter(enrollment => enrollment.coursid)
      .map(enrollment => {
        const course = enrollment.coursid;

        return {
          id: course._id,
          title: course.titre,
          description: course.description,
          image: course.image,
          progress: enrollment.progression || 0,
          instructor: course.formateur
            ? `${course.formateur.prenom} ${course.formateur.nom}`
            : 'Formini',
          status: enrollment.statut === 'terminé' ? 'Terminé' :
            enrollment.statut === 'en_cours' ? 'En cours' : 'Non commencé',
          hours: 0, // Sera calculé plus tard avec les leçons
          nextLesson: null,
          totalLessons: 0,
          completedLessons: 0,
        };
      });

    // Filtrer les valeurs valides
    const validCourses = myCourses;

    // Activité récente (inscriptions et cours terminés)
    const recentActivity = enrollments
      .filter(e => e.coursid)
      .map(e => ({
        id: e._id,
        action: e.statut === 'terminé' ? 'Cours terminé' : 'Inscription au cours',
        course: e.coursid?.titre || 'Cours inconnu',
        date: e.statut === 'terminé' ? (e.updatedAt || e.dateinscription) : e.dateinscription,
        icon: e.statut === 'terminé' ? '✅' : '📚'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Cours recommandés (basés sur les catégories des cours suivis)
    const enrolledCourseIds = enrollments.map(e => e.coursid?._id).filter(Boolean);
    const enrolledCourses = await Course.find({ _id: { $in: enrolledCourseIds } })
      .select('categorie')
      .lean();
    const categories = [...new Set(enrolledCourses.map(c => c.categorie).filter(Boolean))];

    const recommendedCourses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      categorie: { $in: categories }
    })
      .populate('formateur', 'nom prenom')
      .limit(3)
      .lean();

    const recommendedWithStats = await Promise.all(recommendedCourses.map(async (course) => {
      const enrollmentsCount = await Enrollment.countDocuments({ coursid: course._id });
      const reviews = await Review.find({ course: course._id }).lean();
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return {
        id: course._id,
        title: course.titre,
        instructor: course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Inconnu',
        rating: Math.round(avgRating * 10) / 10,
        students: enrollmentsCount
      };
    }));

    // Échéances à venir (basées sur les quiz à venir)
    const upcomingDeadlines = [];
    for (const enrollment of enrollments.filter(e => e.statut === 'active' && e.coursid)) {
      const courseQuizzes = await Quiz.find({ course: enrollment.coursid._id })
        .sort({ createdAt: 1 })
        .lean();

      if (courseQuizzes.length > 0) {
        // const nextQuiz = courseQuizzes[0];
        upcomingDeadlines.push({
          course: enrollment.coursid.titre,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours par défaut
          type: 'Quiz'
        });
      }
    }

    // Timeline d'activité réelle (14 derniers jours)
    const activityStart = new Date();
    activityStart.setDate(activityStart.getDate() - 13);

    const toKey = (date) => {
      const d = new Date(date);
      // Utiliser toLocaleDateString pour garantir l'alignement avec les dates locales
      // Format YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const toDisplay = (date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    const makeRange = (days) => {
      const items = [];
      const cursor = new Date();
      // Reset hours to avoid drift
      cursor.setHours(12, 0, 0, 0);
      cursor.setDate(cursor.getDate() - (days - 1));

      for (let i = 0; i < days; i++) {
        const d = new Date(cursor);
        items.push(d);
        cursor.setDate(cursor.getDate() + 1);
      }
      return items;
    };


    const activityPerDay = {};
    const enrollmentsPerDay = {};
    const completionsPerDay = {};

    enrollments.forEach((enrollment) => {
      if (!enrollment.dateinscription) return;
      if (new Date(enrollment.dateinscription) < activityStart) return;

      const key = toKey(enrollment.dateinscription);
      enrollmentsPerDay[key] = (enrollmentsPerDay[key] || 0) + 1;
      // activityPerDay[key] = (activityPerDay[key] || 0) + 1; // General activity

      // Track completions separately
      if (enrollment.statut === 'terminé' && enrollment.dateinscription) {
        // Note: using dateinscription as fallback for now if dateFin not available
        const completionDate = enrollment.updatedAt || enrollment.dateinscription;
        if (new Date(completionDate) >= activityStart) {
          const completionKey = toKey(completionDate);
          completionsPerDay[completionKey] = (completionsPerDay[completionKey] || 0) + 1;
        }
      }
    });

    const activityTimeline = makeRange(14).map((date) => {
      const key = toKey(date);
      return {
        date: toDisplay(date),
        enrollments: enrollmentsPerDay[key] || 0,
        completions: completionsPerDay[key] || 0
      };
    });

    const courseProgressChart = validCourses.map((course) => ({
      course: course.title,
      progress: course.progress,
      status: course.status
    }));

    res.json({
      stats: {
        coursesEnrolled,
        coursesCompleted,
        coursesInProgress,
        certificates,
        totalHours: Math.round(totalHours),
        averageScore
      },
      myCourses: validCourses,
      recentActivity,
      recommendedCourses: recommendedWithStats,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      activityTimeline,
      courseProgressChart
    });
  } catch (error) {
    console.error('Erreur getStudentStats:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// Statistiques pour Formateur
exports.getInstructorStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Récupérer tous les cours du formateur
    const allCourses = await Course.find({ formateur: userId }).lean();
    const totalCourses = allCourses.length;
    const activeCourses = allCourses.length; // Tous les cours sont considérés actifs pour l'instant

    const courseById = new Map(allCourses.map((c) => [c._id.toString(), c]));

    // Récupérer toutes les inscriptions pour les cours du formateur
    // Récupérer toutes les inscriptions pour les cours du formateur
    const courseIds = allCourses.map(c => c._id);
    const enrollments = await Enrollment.find({ coursid: { $in: courseIds } })
      .populate('etudiantid', 'nom prenom email')
      .populate('coursid', 'titre')
      .lean();

    // Calculer le nombre d'étudiants uniques
    const uniqueStudents = new Set(enrollments.map(e => e.etudiantid?._id.toString()).filter(Boolean));
    const totalStudents = uniqueStudents.size;
    const totalEnrollments = enrollments.length;

    // Calculer les revenus totaux (somme des prix des cours multipliés par le nombre d'inscriptions)
    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      const course = allCourses.find(c => c._id.toString() === enrollment.course._id.toString());
      return sum + (course?.prix || 0);
    }, 0);

    // Calculer la note moyenne de tous les cours
    const allReviews = await Review.find({ course: { $in: courseIds } }).lean();
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    // Mes cours avec statistiques détaillées
    const myCourses = await Promise.all(allCourses.map(async (course) => {
      const courseEnrollments = enrollments.filter(e =>
        e.course._id.toString() === course._id.toString()
      );
      const courseStudents = new Set(courseEnrollments.map(e => e.student._id.toString())).size;

      const courseReviews = allReviews.filter(r =>
        r.course.toString() === course._id.toString()
      );
      const courseRating = courseReviews.length > 0
        ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length
        : 0;

      const courseRevenue = courseEnrollments.length * (course.prix || 0);

      // Calculer le taux de complétion
      const completedEnrollments = courseEnrollments.filter(e => e.statut === 'completed').length;
      const completionRate = courseEnrollments.length > 0
        ? Math.round((completedEnrollments / courseEnrollments.length) * 100)
        : 0;

      return {
        id: course._id,
        title: course.titre,
        description: course.description,
        status: 'active',
        students: courseStudents,
        rating: Math.round(courseRating * 10) / 10,
        revenue: courseRevenue,
        enrollments: courseEnrollments.length,
        completionRate
      };
    }));

    // Inscriptions récentes (10 dernières)
    const recentEnrollments = enrollments
      .sort((a, b) => new Date(b.dateInscription) - new Date(a.dateInscription))
      .slice(0, 10)
      .map(enrollment => ({
        id: enrollment._id,
        studentName: `${enrollment.student.prenom} ${enrollment.student.nom}`,
        courseName: enrollment.course.titre,
        date: enrollment.dateInscription,
        status: enrollment.statut === 'active' ? 'active' : enrollment.statut
      }));

    // Timeline sur 30 jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);

    const makeRange = (days) => {
      const items = [];
      const cursor = new Date();
      cursor.setDate(cursor.getDate() - (days - 1));
      for (let i = 0; i < days; i++) {
        const d = new Date(cursor);
        items.push(d);
        cursor.setDate(cursor.getDate() + 1);
      }
      return items;
    };

    const toKey = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    };

    const toDisplay = (date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    const revenuePerDay = {};
    const enrollmentPerDay = {};

    enrollments.forEach((enrollment) => {
      if (enrollment.dateInscription < startDate) return;
      const key = toKey(enrollment.dateInscription);
      const course = courseById.get(enrollment.course._id.toString());
      const price = course?.prix || 0;
      revenuePerDay[key] = (revenuePerDay[key] || 0) + price;
      enrollmentPerDay[key] = (enrollmentPerDay[key] || 0) + 1;
    });

    const revenueTimeline = makeRange(30).map((date) => {
      const key = toKey(date);
      return {
        date: toDisplay(date),
        revenue: revenuePerDay[key] || 0
      };
    });

    const enrollmentTimeline = makeRange(30).map((date) => {
      const key = toKey(date);
      return {
        date: toDisplay(date),
        enrollments: enrollmentPerDay[key] || 0
      };
    });

    const engagementByCourse = myCourses.map((course) => ({
      courseId: course.id,
      title: course.title,
      students: course.students,
      completionRate: course.completionRate
    }));

    res.json({
      stats: {
        totalCourses,
        activeCourses,
        totalStudents,
        totalRevenue: Math.round(totalRevenue),
        averageRating: Math.round(averageRating * 10) / 10,
        totalEnrollments
      },
      myCourses,
      recentEnrollments,
      revenueTimeline,
      enrollmentTimeline,
      engagementByCourse
    });
  } catch (error) {
    console.error('Erreur getInstructorStats:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
