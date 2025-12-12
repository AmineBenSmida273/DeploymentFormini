const Enrollment = require('../models/enrollment.model');

// Mark course as completed
exports.markCourseCompleted = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        // Find the enrollment
        const enrollment = await Enrollment.findOne({
            etudiantid: userId,
            coursid: courseId
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Inscription non trouvée'
            });
        }

        // Update enrollment to completed
        enrollment.statut = 'terminé';
        enrollment.progression = 100;
        enrollment.derniereactivite = new Date();

        await enrollment.save();

        res.json({
            success: true,
            message: 'Cours terminé avec succès',
            enrollment
        });

    } catch (error) {
        console.error('Error marking course completed:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// Update course progress
exports.updateCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { lessonIndex, totalLessons } = req.body;
        const userId = req.user._id;

        // Find the enrollment
        const enrollment = await Enrollment.findOne({
            etudiantid: userId,
            coursid: courseId
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Inscription non trouvée'
            });
        }

        // Calculate progress percentage
        const progressPercent = Math.round(((lessonIndex + 1) / totalLessons) * 100);

        // Update enrollment progression
        enrollment.progression = progressPercent;
        enrollment.derniereactivite = new Date();

        // If reaching 100%, mark as completed
        if (progressPercent >= 100) {
            enrollment.statut = 'terminé';
        } else if (progressPercent > 0) {
            enrollment.statut = 'en_cours';
        }

        await enrollment.save();

        res.json({
            success: true,
            message: 'Progression mise à jour',
            progression: progressPercent,
            enrollment
        });

    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};
