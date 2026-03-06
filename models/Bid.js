const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tender',
        required: true
    },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    attachmentLink: { type: String }, // Now storing Base64 PDF or Link
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    submittedAt: { type: Date, default: Date.now },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;
