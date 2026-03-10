const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    recruitmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recruitment',
        required: true
    },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    candidatePhone: { type: String, required: true },
    documents: [{
        label: { type: String, required: true }, // e.g. "CV"
        fileLink: { type: String, required: true } // Base64 or URL
    }],
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'],
        default: 'Pending'
    },
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
module.exports = JobApplication;
