const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
    referenceNumber: {
        type: String,
        required: true,
        unique: true,
        default: () => `TDR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    },
    title: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Goods & Supplies', 'Works & Construction', 'Professional Services', 'Other']
    },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    closingDate: { type: Date, required: true },
    tenderDocument: { type: String }, // Base64 or URL for PDF
    status: {
        type: String,
        enum: ['Open', 'Closed', 'Awarded', 'Cancelled'],
        default: 'Open'
    },
    resort: { type: String, default: 'global' }, // Can be specific to a resort or general
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

const Tender = mongoose.model('Tender', tenderSchema);
module.exports = Tender;
