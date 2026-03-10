const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');
const { protect, authorizeRole } = require('../middleware/authMiddleware');

// Public: Submit application
router.post('/submit', jobApplicationController.submitApplication);

// Admin: Manage applications
router.get('/', protect, authorizeRole('admin', 'general-manager'), jobApplicationController.getAllApplications);
router.get('/vacancy/:vacancyId', protect, authorizeRole('admin', 'general-manager'), jobApplicationController.getApplicationsByVacancy);
router.patch('/:id/status', protect, authorizeRole('admin', 'general-manager'), jobApplicationController.updateApplicationStatus);
router.put('/:id/read', protect, authorizeRole('admin', 'general-manager'), jobApplicationController.markAsRead);

module.exports = router;
