const mongoose = require('mongoose');

// Schema pour stocker temporairement les codes SMS
const smsVerificationSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index TTL pour supprimer automatiquement les codes expirés
smsVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SmsVerification', smsVerificationSchema);
