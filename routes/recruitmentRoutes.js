const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');

router.get('/', recruitmentController.getAllRecruitments);
router.post('/', recruitmentController.createRecruitment);
router.put('/:id', recruitmentController.updateRecruitment);
router.delete('/:id', recruitmentController.deleteRecruitment);

module.exports = router;
