const express = require('express');
const router = express.Router();
const { createUser, getUsers, deleteUser, resetPassword } = require('../controllers/userController');
const { protect, authorizeRole } = require('../middleware/authMiddleware');

// All routes require authentication + General Manager role
router.use(protect, authorizeRole('general-manager'));

router.route('/')
    .post(createUser)
    .get(getUsers);

router.route('/:id')
    .delete(deleteUser);

router.route('/:id/reset-password')
    .put(resetPassword);

module.exports = router;
