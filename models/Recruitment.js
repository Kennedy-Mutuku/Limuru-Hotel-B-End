const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    department: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship']
    },
    location: { type: String, default: 'On-site' },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    closingDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Open', 'Closed', 'Draft'],
        default: 'Open'
    },
    resort: { type: String, default: 'global' },
    requiredDocuments: [{ type: String }], // e.g. ["CV", "Cover Letter", "Academic Certificate"]
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

const Recruitment = mongoose.model('Recruitment', recruitmentSchema);
module.exports = Recruitment;
