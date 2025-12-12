const axios = require('axios');
const InscriptionStudent = require('../models/enrollment.model'); // Renamed from Enrollment
const Course = require('../models/course.model');

// Flouci API Configuration
const FLOUCI_APP_TOKEN = process.env.FLOUCI_APP_TOKEN || 'your_flouci_app_token_here';
const FLOUCI_APP_SECRET = process.env.FLOUCI_APP_SECRET || 'your_flouci_app_secret_here';
const FLOUCI_BASE_URL = 'https://developers.flouci.com/api';

/**
 * Enroll in a free course
 */
exports.enrollFreeCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user._id;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Verify course is free
        if (course.prix > 0) {
            return res.status(400).json({ message: 'Ce cours n\'est pas gratuit' });
        }

        // Check if already enrolled
        const existingEnrollment = await InscriptionStudent.findOne({
            etudiantid: userId,
            coursid: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce cours' });
        }

        const enrollment = new InscriptionStudent({
            etudiantid: userId,
            coursid: courseId,
            dateinscription: new Date(),
            progression: 0,
            statut: 'en_cours',
            transactionId: `FREE_${Date.now()}`,
            paymentMethod: 'free',
            montantPaye: 0,
            datePaiement: new Date(),
            statutPaiement: 'payé'
        });

        await enrollment.save();

        // Update course with new student
        await Course.findByIdAndUpdate(
            courseId,
            { $addToSet: { etudiantsInscrits: userId } }
        );

        res.status(200).json({
            success: true,
            message: 'Inscription au cours gratuit réussie',
            enrollment: enrollment
        });

    } catch (error) {
        console.error('Free enrollment error:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'inscription au cours gratuit',
            error: error.message
        });
    }
};

/**
 * Create a Flouci payment session
 */
exports.createFlouciPayment = async (req, res) => {
    try {
        const { courseId, amount } = req.body;
        const userId = req.user._id; // From auth middleware

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Check if already enrolled
        const existingEnrollment = await InscriptionStudent.findOne({
            etudiantid: userId,
            coursid: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce cours' });
        }

        // Prepare Flouci payment request
        const paymentData = {
            app_token: FLOUCI_APP_TOKEN,
            app_secret: FLOUCI_APP_SECRET,
            amount: amount * 1000, // Flouci uses millimes
            accept_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?courseId=${courseId}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel?courseId=${courseId}`,
            decline_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/decline?courseId=${courseId}`,
            session_timeout_secs: 1200, // 20 minutes
            developer_tracking_id: `${userId}_${courseId}_${Date.now()}`
        };

        // Call Flouci API to create payment
        const flouciResponse = await axios.post(
            `${FLOUCI_BASE_URL}/generate_payment`,
            paymentData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (flouciResponse.data && flouciResponse.data.result) {
            const paymentId = flouciResponse.data.result.payment_id;
            const paymentUrl = flouciResponse.data.result.link;

            // Store pending payment info (you might want to create a Payment model)
            // For now, we'll return the payment URL

            return res.status(200).json({
                success: true,
                paymentId: paymentId,
                paymentUrl: paymentUrl,
                message: 'Session de paiement créée avec succès'
            });
        } else {
            throw new Error('Invalid response from Flouci');
        }

    } catch (error) {
        console.error('Flouci payment creation error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Erreur lors de la création du paiement Flouci',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Verify Flouci payment and enroll student
 */
exports.verifyFlouciPayment = async (req, res) => {
    try {
        const { payment_id, courseId } = req.body;
        const userId = req.user._id;

        if (!payment_id) {
            return res.status(400).json({ message: 'payment_id requis' });
        }

        // Verify payment with Flouci API
        const verifyData = {
            app_token: FLOUCI_APP_TOKEN,
            app_secret: FLOUCI_APP_SECRET,
            payment_id: payment_id
        };

        const verifyResponse = await axios.post(
            `${FLOUCI_BASE_URL}/verify_payment`,
            verifyData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (verifyResponse.data && verifyResponse.data.result) {
            const paymentStatus = verifyResponse.data.result.status;

            if (paymentStatus === 'SUCCESS') {
                // Payment successful, enroll student
                const course = await Course.findById(courseId);

                const enrollment = new InscriptionStudent({
                    etudiantid: userId,
                    coursid: courseId,
                    dateinscription: new Date(),
                    progression: 0,
                    statut: 'en_cours',
                    transactionId: payment_id,
                    paymentMethod: 'flouci',
                    montantPaye: course?.prix || 0,
                    datePaiement: new Date(),
                    statutPaiement: 'payé'
                });

                await enrollment.save();

                // Update course with new student
                await Course.findByIdAndUpdate(
                    courseId,
                    { $addToSet: { etudiantsInscrits: userId } }
                );

                return res.status(200).json({
                    success: true,
                    message: 'Paiement vérifié et inscription réussie',
                    enrollment: enrollment
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Le paiement n\'a pas été complété',
                    status: paymentStatus
                });
            }
        } else {
            throw new Error('Invalid verification response from Flouci');
        }

    } catch (error) {
        console.error('Flouci payment verification error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Erreur lors de la vérification du paiement',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Handle card payment simulation
 */
exports.processCardPayment = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user._id;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Check if already enrolled
        const existingEnrollment = await InscriptionStudent.findOne({
            etudiantid: userId,
            coursid: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce cours' });
        }

        // Simulate payment processing
        // In a real scenario, this would integrate with a payment gateway

        const enrollment = new InscriptionStudent({
            etudiantid: userId,
            coursid: courseId,
            dateinscription: new Date(),
            progression: 0,
            statut: 'en_cours',
            transactionId: `CARD_${Date.now()}`,
            paymentMethod: 'card',
            montantPaye: course.prix || 0,
            datePaiement: new Date(),
            statutPaiement: 'payé'
        });

        await enrollment.save();

        // Update course with new student
        await Course.findByIdAndUpdate(
            courseId,
            { $addToSet: { etudiantsInscrits: userId } }
        );

        res.status(200).json({
            success: true,
            message: 'Paiement par carte réussi et inscription effectuée',
            enrollment: enrollment
        });

    } catch (error) {
        console.error('Card payment error:', error);
        res.status(500).json({
            message: 'Erreur lors du traitement du paiement',
            error: error.message
        });
    }
};
