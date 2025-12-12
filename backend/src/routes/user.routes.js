const express = require('express');
const router = express.Router();

// CORRECTION : Chemin relatif correct
const userController = require('../controllers/user.controller');
const adminController = require('../controllers/admin.controller');
const reportsController = require('../controllers/reports.controller');
const { verifyToken, verifyRole } = require('../middleware/auth.middleware');

// Route d'inscription
router.post('/register', userController.register);

// Route de connexion
router.post('/login', userController.login);


// Route changement mot de passe
router.put('/change-password', verifyToken, userController.changePassword);
// Routes pour les dashboards (nécessitent une authentification)
router.get('/dashboard/admin', verifyToken, verifyRole('admin'), userController.getAdminStats);
router.get('/dashboard/student', verifyToken, verifyRole('student'), userController.getStudentStats);
router.get('/dashboard/instructor', verifyToken, verifyRole('instructor'), userController.getInstructorStats);


// Routes pour le profil utilisateur
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/change-password', verifyToken, userController.changePassword);

// Routes pour les avis (Settings)
router.get('/my-reviews', verifyToken, userController.getMyReviews);
router.put('/reviews/:reviewId', verifyToken, userController.updateReview);

// Routes pour les certificats
router.get('/my-certificates', verifyToken, userController.getMyCertificates);


// Routes admin pour gérer les formateurs
router.get('/admin/pending-instructors', verifyToken, verifyRole('admin'), adminController.getPendingInstructors);
router.post('/admin/approve-instructor/:instructorId', verifyToken, verifyRole('admin'), adminController.approveInstructor);
router.get('/admin/all-users', verifyToken, verifyRole('admin'), adminController.getAllUsers);
router.post('/admin/reject-instructor/:instructorId', verifyToken, verifyRole('admin'), adminController.rejectInstructor);
router.get('/admin/instructor/:instructorId/cv', verifyToken, verifyRole('admin'), adminController.downloadCV);
router.get('/admin/user/:userId', verifyToken, verifyRole('admin'), adminController.getUserDetails);
router.put('/admin/user/:userId/status', verifyToken, verifyRole('admin'), adminController.toggleUserStatus);

// Route pour les rapports détaillés
router.get('/admin/reports', verifyToken, verifyRole('admin'), reportsController.getAdminReports);

module.exports = router;
