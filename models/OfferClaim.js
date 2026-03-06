const mongoose = require('mongoose');

const offerClaimSchema = new mongoose.Schema({
    claimId: {
        type: String,
        required: true,
        unique: true,
        default: () => `CLM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        required: true
    },
    resort: {
        type: String,
        required: true
    },
    guestName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'completed'],
        default: 'pending'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const OfferClaim = mongoose.model('OfferClaim', offerClaimSchema);

module.exports = OfferClaim;
