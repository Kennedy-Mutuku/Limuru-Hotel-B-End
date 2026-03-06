const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    resort: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    date: {
        type: String,
        default: () => new Date().toLocaleDateString()
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'hidden'],
        default: 'pending'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
