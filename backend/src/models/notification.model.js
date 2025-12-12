const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    destinataire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    titre: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    lu: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
