const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
    resort: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    pageUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['new', 'read', 'responded'],
        default: 'new'
    },
    read: {
        type: Boolean,
        default: false
    },
    responded: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
