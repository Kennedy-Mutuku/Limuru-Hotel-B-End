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
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '8h',
            });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                properties: user.properties,
                token: token,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginUser,
};
