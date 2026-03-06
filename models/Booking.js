const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true
    },
    resort: {
        type: String,
        required: true
    },
    resortName: {
        type: String,
        required: true
    },
    roomType: {
        type: String,
        required: true
    },
    packageType: {
        type: String,
        default: 'bnb'
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    nights: {
        type: Number,
        default: 1
    },
    // Legacy nested guests field (kept for backward compat)
    guests: {
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 }
    },
    // Top-level guest counts (new)
    adults: {
        type: Number,
        default: 1
    },
    childrenCount: {
        type: Number,
        default: 0
    },
    childrenDetails: [{
        age: { type: Number },
        sharing: { type: Boolean, default: true }
    }],
    fullName: {
        type: String,
        required: true
    },
    guestName: {
        type: String
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
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
    nationality: {
        type: String,
        default: 'kenyan'
    },
    guestType: {
        type: String,
        enum: ['residential', 'non-residential'],
        default: 'residential'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'KES'
    },
    breakdown: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['mpesa', 'card', 'cash', 'bank', 'pay-on-arrival'],
        default: 'mpesa'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'awaiting_payment'],
        default: 'pending'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    specialRequests: {
        type: String,
        default: ''
    },
    source: {
        type: String,
        default: 'website'
    },
    deletedByBranch: {
        type: Boolean,
        default: false
    },
    deletedByAdminName: {
        type: String,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
