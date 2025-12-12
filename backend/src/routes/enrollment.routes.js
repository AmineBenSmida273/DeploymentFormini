const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Mark course as completed
router.put('/course/:courseId/complete', verifyToken, enrollmentController.markCourseCompleted);

// Update course progress
router.put('/course/:courseId/progress', verifyToken, enrollmentController.updateCourseProgress);

module.exports = router;
