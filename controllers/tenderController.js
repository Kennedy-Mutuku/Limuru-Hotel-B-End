const Tender = require('../models/Tender');
const Bid = require('../models/Bid');

// --- Public Access ---

// Get all open tenders
exports.getAllTenders = async (req, res) => {
    try {
        const tenders = await Tender.find({ status: { $ne: 'Cancelled' } }).sort('-createdAt');
        res.json(tenders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single tender details
exports.getTenderById = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ message: 'Tender not found' });
        res.json(tender);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Submit a bid
exports.submitBid = async (req, res) => {
    try {
        const { tenderId, companyName, contactPerson, email, phone, bidAmount, attachmentLink } = req.body;

        const tender = await Tender.findById(tenderId);
        if (!tender) return res.status(404).json({ message: 'Tender not found' });
        if (tender.status !== 'Open') return res.status(400).json({ message: 'This tender is no longer accepting bids' });
        if (new Date() > new Date(tender.closingDate)) return res.status(400).json({ message: 'The closing date for this tender has passed' });

        const bid = new Bid({
            tender: tenderId,
            companyName,
            contactPerson,
            email,
            phone,
            bidAmount,
            attachmentLink
        });

        await bid.save();
        res.status(201).json({ message: 'Bid submitted successfully', bid });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- Admin Access ---

// Create tender
exports.createTender = async (req, res) => {
    try {
        const tender = new Tender({
            ...req.body,
            postedBy: req.user.id
        });
        await tender.save();
        res.status(201).json(tender);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all bids for a specific tender (Admin only)
exports.getTenderBids = async (req, res) => {
    try {
        const bids = await Bid.find({ tender: req.params.tenderId }).sort('-bidAmount');
        res.json(bids);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update tender status/details
exports.updateTender = async (req, res) => {
    try {
        const tender = await Tender.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(tender);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete tender
exports.deleteTender = async (req, res) => {
    try {
        await Tender.findByIdAndDelete(req.params.id);
        // Also delete associated bids? For now just keep them or delete?
        await Bid.deleteMany({ tender: req.params.id });
        res.json({ message: 'Tender and associated bids deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update bid status (Awarding)
exports.updateBidStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const bid = await Bid.findByIdAndUpdate(req.params.id, { status }, { new: true });

        // If awarded, maybe close the tender?
        if (status === 'Accepted') {
            await Tender.findByIdAndUpdate(bid.tender, { status: 'Awarded' });
        }

        res.json(bid);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all bids (Admin broad view)
exports.getAllBids = async (req, res) => {
    try {
        const bids = await Bid.find().populate('tender', 'title referenceNumber').sort('-createdAt');
        res.json(bids);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mark bid as read
exports.markBidAsRead = async (req, res) => {
    try {
        const bid = await Bid.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!bid) return res.status(404).json({ message: 'Bid not found' });
        res.json({ message: 'Bid marked as read', bid });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
