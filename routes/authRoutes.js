const express = require('express');
const router = express.Router();
const { loginUser, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.put('/profile', protect, updateProfile);  // update name / email / password

module.exports = router;
