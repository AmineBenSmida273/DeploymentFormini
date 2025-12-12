const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Protect all payment routes - require authentication
router.use(verifyToken);

// Create Flouci payment session
router.post('/flouci/create', paymentController.createFlouciPayment);

// Verify Flouci payment
router.post('/flouci/verify', paymentController.verifyFlouciPayment);

// Process card payment (simulation)
router.post('/card', paymentController.processCardPayment);

// Enroll in free course
router.post('/free-enroll', paymentController.enrollFreeCourse);

module.exports = router;
