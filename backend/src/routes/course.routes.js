const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');

const { verifyToken, verifyRole, optionalAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Routes spécifiques (doivent être avant /:id)
router.get('/pending', verifyToken, verifyRole('admin'), courseController.getPendingCourses);
router.get('/instructor/my-courses', verifyToken, verifyRole('instructor'), courseController.getMyCourses);

// Routes publiques
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/categories', courseController.getCategories);
router.get('/:id', courseController.getCourseById);

// Routes protégées (Formateur / Admin)
// Note: 'upload.single('image')' assumes multer is set up. If not, we might need to fix this.
// For now, I'll assume standard upload setup or handle it if missing.



router.post('/', verifyToken, verifyRole('instructor', 'admin'), upload.fields([]), courseController.createCourse);
router.put('/:id', verifyToken, verifyRole('instructor', 'admin'), upload.fields([]), courseController.updateCourse);
router.delete('/:id', verifyToken, verifyRole('instructor', 'admin'), courseController.deleteCourse);

// Approbation / Rejet
router.post('/:id/approve', verifyToken, verifyRole('admin'), courseController.approveCourse);
router.post('/:id/reject', verifyToken, verifyRole('admin'), courseController.rejectCourse);


module.exports = router;
