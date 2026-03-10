const JobApplication = require('../models/JobApplication');

// Submit a new application
exports.submitApplication = async (req, res) => {
    try {
        const { recruitmentId, candidateName, candidateEmail, candidatePhone, documents } = req.body;

        if (!documents || documents.length === 0) {
            return res.status(400).json({ message: 'At least one document is required' });
        }

        const newApplication = new JobApplication({
            recruitmentId,
            candidateName,
            candidateEmail,
            candidatePhone,
            documents
        });

        const savedApplication = await newApplication.save();
        res.status(201).json({ message: 'Application submitted successfully!', data: savedApplication });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting application', error: err.message });
    }
};

// Get all applications (for admin)
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await JobApplication.find()
            .populate('recruitmentId', 'title department')
            .sort({ createdAt: -1 });
        res.status(200).json(applications);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching applications', error: err.message });
    }
};

// Get applications for a specific vacancy
exports.getApplicationsByVacancy = async (req, res) => {
    try {
        const applications = await JobApplication.find({ recruitmentId: req.params.vacancyId })
            .sort({ createdAt: -1 });
        res.status(200).json(applications);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching applications', error: err.message });
    }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const updated = await JobApplication.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating application status', error: err.message });
    }
};

// Mark application as read
exports.markAsRead = async (req, res) => {
    try {
        await JobApplication.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Error marking as read', error: err.message });
    }
};
