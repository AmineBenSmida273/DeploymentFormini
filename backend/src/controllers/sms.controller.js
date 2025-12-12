const twilio = require('twilio');
const SmsVerification = require('../models/smsVerification.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');

// Configuration Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
}

/**
 * Générer un code à 6 chiffres
 */
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Envoyer un code SMS via Twilio
 */
exports.sendVerificationCode = async (req, res) => {
    try {
        const { phoneNumber, courseId } = req.body;
        const userId = req.user._id;

        if (!phoneNumber || !courseId) {
            return res.status(400).json({ message: 'Numéro de téléphone et ID du cours requis' });
        }

        // Vérifier que le cours existe
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Vérifier si déjà inscrit
        const existingEnrollment = await Enrollment.findOne({
            etudiantid: userId,
            coursid: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à ce cours' });
        }

        // Supprimer les anciens codes non vérifiés pour ce numéro
        await SmsVerification.deleteMany({
            phoneNumber: phoneNumber,
            userId: userId,
            verified: false
        });

        // Générer un nouveau code
        const code = generateCode();

        // Sauvegarder le code en base de données
        const smsVerification = new SmsVerification({
            phoneNumber: phoneNumber,
            code: code,
            userId: userId,
            courseId: courseId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        await smsVerification.save();

        // Envoyer le SMS via Twilio
        if (twilioClient && twilioPhoneNumber) {
            try {
                // Formater le numéro de téléphone international (Tunisie: +216)
                const formattedPhone = phoneNumber.startsWith('+')
                    ? phoneNumber
                    : `+216${phoneNumber}`;

                await twilioClient.messages.create({
                    body: `Votre code de vérification Formini est: ${code}. Valide pendant 10 minutes.`,
                    from: twilioPhoneNumber,
                    to: formattedPhone
                });

                console.log(`SMS envoyé avec succès à ${formattedPhone}`);
            } catch (twilioError) {
                console.error('Erreur Twilio:', twilioError);
                // Ne pas échouer si Twilio n'est pas configuré
                // En mode développement, on peut quand même tester
            }
        } else {
            console.log(`Mode développement - Code généré: ${code} pour ${phoneNumber}`);
        }

        res.status(200).json({
            success: true,
            message: 'Code de vérification envoyé',
            // En développement, renvoyer le code (à supprimer en production)
            ...(process.env.NODE_ENV === 'development' && { code: code })
        });

    } catch (error) {
        console.error('Erreur lors de l\'envoi du code:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'envoi du code de vérification',
            error: error.message
        });
    }
};

/**
 * Vérifier le code SMS et finaliser le paiement
 */
exports.verifyCode = async (req, res) => {
    try {
        const { phoneNumber, code, courseId } = req.body;
        const userId = req.user._id;

        if (!phoneNumber || !code || !courseId) {
            return res.status(400).json({ message: 'Données manquantes' });
        }

        // Trouver le code de vérification
        const smsVerification = await SmsVerification.findOne({
            phoneNumber: phoneNumber,
            userId: userId,
            courseId: courseId,
            verified: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!smsVerification) {
            return res.status(400).json({
                message: 'Code invalide ou expiré. Demandez un nouveau code.'
            });
        }

        // Vérifier le code
        if (smsVerification.code !== code) {
            return res.status(400).json({ message: 'Code incorrect' });
        }

        // Marquer le code comme vérifié
        smsVerification.verified = true;
        await smsVerification.save();

        // Créer l'inscription au cours
        const enrollment = new Enrollment({
            etudiantid: userId,
            coursid: courseId,
            dateinscription: new Date(),
            progression: 0,
            statut: 'en_cours',
            transactionId: `FLOUCI_SMS_${Date.now()}`,
            paymentMethod: 'flouci'
        });

        await enrollment.save();

        // Mettre à jour le cours avec le nouvel étudiant
        await Course.findByIdAndUpdate(
            courseId,
            { $addToSet: { etudiantsInscrits: userId } }
        );

        res.status(200).json({
            success: true,
            message: 'Code vérifié et inscription réussie',
            enrollment: enrollment
        });

    } catch (error) {
        console.error('Erreur lors de la vérification du code:', error);
        res.status(500).json({
            message: 'Erreur lors de la vérification du code',
            error: error.message
        });
    }
};
