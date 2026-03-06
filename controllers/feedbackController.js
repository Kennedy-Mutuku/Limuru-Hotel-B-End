const Feedback = require('../models/Feedback');

// @desc    Get all feedback (or filter by status/property via query)
// @route   GET /api/feedback
const getFeedback = async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.resort) query.resort = req.query.resort;

        const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new feedback
// @route   POST /api/feedback
const createFeedback = async (req, res) => {
    try {
        const newFeedback = new Feedback(req.body);
        const savedFeedback = await newFeedback.save();
        res.status(201).json(savedFeedback);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update feedback
// @route   PUT /api/feedback/:id
const updateFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (feedback) {
            feedback.status = req.body.status || feedback.status;
            const updatedFeedback = await feedback.save();
            res.json(updatedFeedback);
        } else {
            res.status(404).json({ message: 'Feedback not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (feedback) {
            await Feedback.deleteOne({ _id: feedback._id });
            res.json({ message: 'Feedback removed' });
        } else {
            res.status(404).json({ message: 'Feedback not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark feedback as read
// @route   PUT /api/feedback/:id/read
const markFeedbackAsRead = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json({ message: 'Feedback marked as read', feedback });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFeedback,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    markFeedbackAsRead
};
