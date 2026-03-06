const Offer = require('../models/Offer');
const OfferClaim = require('../models/OfferClaim');

// @desc    Get all offers (filters by resort + global)
// @route   GET /api/offers
const getOffers = async (req, res) => {
    try {
        const { resort, active } = req.query;
        let query = {};

        if (active !== undefined) query.active = active === 'true';

        if (resort && resort !== 'all') {
            // Show offers specifically for this resort OR global offers
            query.$or = [
                { resort: resort },
                { resort: 'global' }
            ];
        }

        const offers = await Offer.find(query).sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new offer
// @route   POST /api/offers
const createOffer = async (req, res) => {
    try {
        const { title, description, price, discount, includes, image, validUntil, resort } = req.body;

        const offerData = {
            title,
            description,
            price: price ? Number(price) : undefined,
            discount: discount ? Number(discount) : undefined,
            includes: Array.isArray(includes) ? includes : [],
            image: image || undefined,
            validUntil,
            postedBy: req.user._id
        };

        // Role-based resort assignment
        if (req.user.role === 'manager') {
            // Managers can ONLY post to their assigned resort
            const managerResort = req.user.properties?.[0];
            if (!managerResort) {
                return res.status(403).json({ message: "Manager has no assigned property" });
            }
            offerData.resort = managerResort;
        } else {
            // Admins/GMs can pick or set global
            offerData.resort = resort || 'global';
        }

        const newOffer = new Offer(offerData);
        const savedOffer = await newOffer.save();
        res.status(201).json(savedOffer);
    } catch (error) {
        console.error('Create Offer Error:', error);
        res.status(400).json({
            message: error.name === 'ValidationError'
                ? Object.values(error.errors).map(val => val.message).join(', ')
                : error.message
        });
    }
};

// @desc    Claim an offer
// @route   POST /api/offers/claim
const claimOffer = async (req, res) => {
    try {
        const { offerId, resort, guestName, email, phone, message } = req.body;

        const newClaim = new OfferClaim({
            offer: offerId,
            resort,
            guestName,
            email,
            phone,
            message
        });

        const savedClaim = await newClaim.save();
        res.status(201).json(savedClaim);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all claims (filtered by role)
// @route   GET /api/offers/claims
const getClaims = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'manager') {
            const managerResort = req.user.properties?.[0];
            if (managerResort) {
                query.resort = managerResort;
            }
        }

        const claims = await OfferClaim.find(query)
            .populate('offer', 'title price resort image description')
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update claim status
// @route   PUT /api/offers/claims/:id
const updateClaimStatus = async (req, res) => {
    try {
        const claim = await OfferClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: 'Claim not found' });

        claim.status = req.body.status || claim.status;
        const updated = await claim.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete offer
// @route   DELETE /api/offers/:id
const deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        await Offer.deleteOne({ _id: offer._id });
        res.json({ message: 'Offer removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark claim as read
// @route   PUT /api/offers/claims/:id/read
const markClaimAsRead = async (req, res) => {
    try {
        const claim = await OfferClaim.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!claim) return res.status(404).json({ message: 'Claim not found' });
        res.json({ message: 'Claim marked as read', claim });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOffers,
    createOffer,
    claimOffer,
    getClaims,
    updateClaimStatus,
    deleteOffer,
    markClaimAsRead
};
