const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
            res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, properties: user.properties, token });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update logged-in user profile / password
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email, password } = req.body;
        if (name) user.name = name;
        if (email) user.email = email;
        if (password && password.length >= 6) user.password = password;

        const updated = await user.save();
        res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, properties: updated.properties });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, updateProfile };
