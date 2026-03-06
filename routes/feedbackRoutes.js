const express = require('express');
const router = express.Router();
const { getFeedback, createFeedback, updateFeedback, deleteFeedback, markFeedbackAsRead } = require('../controllers/feedbackController');

router.route('/')
    .get(getFeedback)
    .post(createFeedback);

router.route('/:id')
    .put(updateFeedback)
    .delete(deleteFeedback);

router.put('/:id/read', markFeedbackAsRead);

module.exports = router;
