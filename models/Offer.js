const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerId: {
        type: String,
        required: true,
        unique: true,
        default: () => `OFFER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number },
    discount: { type: Number }, // Changed to Number for calculations
    includes: [{ type: String }],
    image: { type: String, required: false },
    validUntil: { type: Date, required: true },
    resort: { type: String, required: true, default: 'global' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
