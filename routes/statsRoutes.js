const express = require('express');
const router = express.Router();
const { getDashboardStats, getSidebarCounts, getDetailedReport } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDashboardStats);
router.get('/counts', protect, getSidebarCounts);
router.get('/report', protect, getDetailedReport);

module.exports = router;
