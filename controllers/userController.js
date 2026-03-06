const User = require('../models/User');

// @desc    Create a new user (branch manager)
// @route   POST /api/users
// @access  Private (General Manager only)
const createUser = async (req, res) => {
    const { name, email, password, role, assignedProperty } = req.body;

    try {
        // Validate required fields
        if (!name || !email || !password || !assignedProperty) {
            return res.status(400).json({ message: 'Please provide name, email, password, and assigned property' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }

        // Validate assigned property
        const validProperties = ['limuru', 'kanamai', 'kisumu'];
        if (!validProperties.includes(assignedProperty)) {
            return res.status(400).json({ message: 'Invalid property assignment' });
        }

        // Create user with manager role and single property access
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: role || 'manager',
            properties: [assignedProperty]
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            properties: user.properties,
            createdAt: user.createdAt
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (General Manager only)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (General Manager only)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting the general manager
        if (user.role === 'general-manager') {
            return res.status(403).json({ message: 'Cannot delete the General Manager account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset a user's password
// @route   PUT /api/users/:id/reset-password
// @access  Private (General Manager only)
const resetPassword = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'general-manager') {
            return res.status(403).json({ message: 'Cannot reset the General Manager password from here' });
        }

        // Use provided password or generate a random one
        const newPassword = req.body.password || Math.random().toString(36).slice(-8) + 'A1!';

        user.password = newPassword;
        await user.save();

        res.json({
            message: 'Password reset successfully',
            email: user.email,
            password: newPassword
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createUser, getUsers, deleteUser, resetPassword };
