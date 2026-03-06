const express = require('express');
const router = express.Router();
const {
    getOffers,
    createOffer,
    deleteOffer,
    claimOffer,
    getClaims,
    updateClaimStatus,
    markClaimAsRead
} = require('../controllers/offerController');
const { protect, authorizeRole } = require('../middleware/authMiddleware');

router.route('/')
    .get(getOffers)
    .post(protect, authorizeRole('general-manager', 'admin', 'manager'), createOffer);

router.post('/claim', claimOffer); // Public

router.get('/claims', protect, authorizeRole('general-manager', 'admin', 'manager'), getClaims);
router.put('/claims/:id', protect, authorizeRole('general-manager', 'admin', 'manager'), updateClaimStatus);
router.put('/claims/:id/read', protect, authorizeRole('general-manager', 'admin', 'manager'), markClaimAsRead);

router.route('/:id')
    .delete(protect, authorizeRole('general-manager', 'admin', 'manager'), deleteOffer);

module.exports = router;
