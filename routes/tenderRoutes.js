const express = require('express');
const router = express.Router();
const tenderController = require('../controllers/tenderController');
const { protect, authorizeRole } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', tenderController.getAllTenders);
router.get('/:id', tenderController.getTenderById);
router.post('/bid', tenderController.submitBid);

// Admin/Manager Routes
router.post('/', protect, authorizeRole('admin', 'general-manager'), tenderController.createTender);
router.put('/:id', protect, authorizeRole('admin', 'general-manager'), tenderController.updateTender);
router.delete('/:id', protect, authorizeRole('admin', 'general-manager'), tenderController.deleteTender);
router.get('/:tenderId/bids', protect, authorizeRole('admin', 'general-manager'), tenderController.getTenderBids);
router.get('/admin/all-bids', protect, authorizeRole('admin', 'general-manager'), tenderController.getAllBids);
router.patch('/bids/:id/status', protect, authorizeRole('admin', 'general-manager'), tenderController.updateBidStatus);
router.put('/bids/:id/read', protect, authorizeRole('admin', 'general-manager'), tenderController.markBidAsRead);

module.exports = router;
