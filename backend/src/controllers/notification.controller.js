const Notification = require('../models/notification.model');

// Récupérer les notifications de l'utilisateur connecté
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ destinataire: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Limiter aux 50 dernières

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications', error: error.message });
    }
};

// Obtenir le nombre de notifications non lues
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            destinataire: req.user._id,
            lu: false
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors du comptage des notifications', error: error.message });
    }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { lu: true });
        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la notification', error: error.message });
    }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { destinataire: req.user._id, lu: false },
            { lu: true }
        );
        res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour des notifications', error: error.message });
    }
};

// Fonction utilitaire pour créer une notification (usage interne)
exports.createNotification = async (destinataireId, titre, message, type = 'info', data = null) => {
    try {
        await Notification.create({
            destinataire: destinataireId,
            titre,
            message,
            type,
            data
        });
        return true;
    } catch (error) {
        console.error('Erreur création notification:', error);
        return false;
    }
};
