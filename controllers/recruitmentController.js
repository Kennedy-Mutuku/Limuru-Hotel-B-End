const Recruitment = require('../models/Recruitment');

// Get all recruitments
exports.getAllRecruitments = async (req, res) => {
    try {
        const recruitments = await Recruitment.find().sort({ createdAt: -1 });
        res.status(200).json(recruitments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching recruitments', error: err.message });
    }
};

// Create a new recruitment
exports.createRecruitment = async (req, res) => {
    try {
        const newRecruitment = new Recruitment(req.body);
        const savedRecruitment = await newRecruitment.save();
        res.status(201).json(savedRecruitment);
    } catch (err) {
        res.status(400).json({ message: 'Error creating recruitment', error: err.message });
    }
};

// Update recruitment
exports.updateRecruitment = async (req, res) => {
    try {
        const updatedRecruitment = await Recruitment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedRecruitment) return res.status(404).json({ message: 'Recruitment not found' });
        res.status(200).json(updatedRecruitment);
    } catch (err) {
        res.status(400).json({ message: 'Error updating recruitment', error: err.message });
    }
};

// Delete recruitment
exports.deleteRecruitment = async (req, res) => {
    try {
        const recruitment = await Recruitment.findByIdAndDelete(req.params.id);
        if (!recruitment) return res.status(404).json({ message: 'Recruitment not found' });
        res.status(200).json({ message: 'Recruitment deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting recruitment', error: err.message });
    }
};
