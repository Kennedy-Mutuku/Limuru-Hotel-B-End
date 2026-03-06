const Message = require('../models/Message');

// @desc    Get all messages
// @route   GET /api/messages
// @access  Public
const getMessages = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'manager') {
            query = {
                $or: [
                    { resort: { $in: req.user.properties } },
                    { resort: "" }
                ]
            };
        } else if (req.user.role === 'staff') {
            query = { resort: { $in: req.user.properties } };
        }

        const messages = await Message.find(query).sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
const getMessageById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Access check
        if (req.user.role !== 'general-manager') {
            const hasAccess = req.user.properties.includes(message.resort) || (req.user.role === 'manager' && message.resort === "");
            if (!hasAccess) {
                return res.status(403).json({ message: 'Not authorized to view this message' });
            }
        }

        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a message
// @route   POST /api/messages
// @access  Public
const createMessage = async (req, res) => {
    try {
        const message = new Message({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            resort: req.body.resort || "",
            subject: req.body.subject,
            message: req.body.message,
            ip: req.body.ip,
            userAgent: req.body.userAgent,
            pageUrl: req.body.pageUrl,
            status: 'new',
            read: false,
            responded: false,
            submittedAt: req.body.submittedAt ? new Date(req.body.submittedAt) : new Date()
        });

        const createdMessage = await message.save();
        res.status(201).json(createdMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a message (e.g., mark as read/responded)
// @route   PUT /api/messages/:id
// @access  Private
const updateMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Access check
        if (req.user.role !== 'general-manager') {
            const hasAccess = req.user.properties.includes(message.resort) || (req.user.role === 'manager' && message.resort === "");
            if (!hasAccess) {
                return res.status(403).json({ message: 'Not authorized to update this message' });
            }
        }

        message.status = req.body.status || message.status;
        message.read = req.body.read !== undefined ? req.body.read : message.read;
        message.responded = req.body.responded !== undefined ? req.body.responded : message.responded;

        const updatedMessage = await message.save();
        res.json(updatedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Access check
        if (req.user.role !== 'general-manager') {
            const hasAccess = req.user.properties.includes(message.resort) || (req.user.role === 'manager' && message.resort === "");
            if (!hasAccess) {
                return res.status(403).json({ message: 'Not authorized to delete this message' });
            }
        }

        await Message.deleteOne({ _id: message._id });
        res.json({ message: 'Message removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMessages,
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage
};
