const JobApplication = require('../models/JobApplication');
const Message = require('../models/Message');

// const Transaction = require('../models/Transaction'); // Assuming this exists or will be needed for precise revenue

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Private (Admin/Manager)
const getDashboardStats = async (req, res) => {
    try {
        const { resort } = req.query;
        let filter = {};

        // Role-based filtering
        let statsFilter = { ...filter };
        if (req.user.role === 'manager') {
            statsFilter.resort = { $in: req.user.properties };
            statsFilter.deletedByBranch = { $ne: true };
        } else if (resort && resort !== 'all') {
            statsFilter.resort = resort;
        }

        // 1. Aggregate Booking Stats
        const bookingStats = await Booking.aggregate([
            { $match: statsFilter },
            {
                $group: {
                    _id: "$resort",
                    totalRevenue: { $sum: "$totalAmount" },
                    bookingCount: { $sum: 1 },
                    pendingBookings: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                    }
                }
            }
        ]);

        // 2. Aggregate Feedback Stats
        const feedbackStats = await Feedback.aggregate([
            { $match: filter }, // Feedback doesn't have soft-delete yet, keeping 'filter'
            {
                $group: {
                    _id: "$resort",
                    avgRating: { $avg: "$rating" },
                    feedbackCount: { $sum: 1 }
                }
            }
        ]);

        // 3. Format Response
        const properties = ['limuru', 'kanamai', 'kisumu'];
        const stats = {
            global: {
                totalRevenue: 0,
                totalBookings: 0,
                pendingBookings: 0,
                avgRating: 0,
                totalOccupancy: 0 // Logic for occupancy depends on room capacity
            },
            properties: {}
        };

        // Initialize properties
        properties.forEach(p => {
            stats.properties[p] = {
                revenue: 0,
                bookings: 0,
                occupancy: 0,
                rating: 0
            };
        });

        // Merge booking stats
        bookingStats.forEach(item => {
            if (stats.properties[item._id]) {
                stats.properties[item._id].revenue = item.totalRevenue;
                stats.properties[item._id].bookings = item.bookingCount;

                stats.global.totalRevenue += item.totalRevenue;
                stats.global.totalBookings += item.bookingCount;
                stats.global.pendingBookings += item.pendingBookings;
            }
        });

        // Merge feedback stats
        let totalRatingSum = 0;
        let totalRatingCount = 0;
        feedbackStats.forEach(item => {
            if (stats.properties[item._id]) {
                stats.properties[item._id].rating = Math.round(item.avgRating * 10) / 10;
                totalRatingSum += (item.avgRating * item.feedbackCount);
                totalRatingCount += item.feedbackCount;
            }
        });

        if (totalRatingCount > 0) {
            stats.global.avgRating = Math.round((totalRatingSum / totalRatingCount) * 10) / 10;
        }

        // --- 4. ALL-TIME Monthly Revenue & Activity History ---
        const [allMonthlyBookings, allMonthlyFeedback, allMonthlyInquiries, allMonthlyClaims] = await Promise.all([
            Booking.aggregate([
                { $match: { ...statsFilter } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, resort: '$resort' },
                        revenue: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Feedback.aggregate([
                { $match: { ...statsFilter } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Message.aggregate([
                { $match: { ...statsFilter } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            OfferClaim.aggregate([
                { $match: { ...statsFilter } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // Build a complete month-by-month timeline spanning all available data
        const buildMonthKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;

        const monthSet = new Set();
        [...allMonthlyBookings, ...allMonthlyApps, ...allMonthlyBids, ...allMonthlyClaims].forEach(item => {
            monthSet.add(buildMonthKey(item._id.year, item._id.month));
        });

        // If no data at all, create last 6 months so UI is not empty
        if (monthSet.size === 0) {
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setUTCMonth(d.getUTCMonth() - i);
                monthSet.add(buildMonthKey(d.getUTCFullYear(), d.getUTCMonth() + 1));
            }
        }

        // Fill in any missing months between first and last
        const sortedKeys = [...monthSet].sort();
        const firstKey = sortedKeys[0];
        const [firstY, firstM] = firstKey.split('-').map(Number);
        const now = new Date();
        const allMonthKeys = [];
        let cur = new Date(Date.UTC(firstY, firstM - 1, 1));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        while (cur < end) {
            allMonthKeys.push(buildMonthKey(cur.getUTCFullYear(), cur.getUTCMonth() + 1));
            cur.setUTCMonth(cur.getUTCMonth() + 1);
        }

        // Keep last 12 months max for readability
        const recentMonthKeys = allMonthKeys.slice(-12);

        const monthMap = {};
        recentMonthKeys.forEach(key => {
            const [y, m] = key.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, 1));
            monthMap[key] = {
                name: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
                revenue: 0, bookings: 0, applications: 0, bids: 0, claims: 0,
                limuru_revenue: 0, kanamai_revenue: 0, kisumu_revenue: 0
            };
        });

        allMonthlyBookings.forEach(item => {
            const key = buildMonthKey(item._id.year, item._id.month);
            if (monthMap[key]) {
                monthMap[key].revenue += item.revenue;
                monthMap[key].bookings += item.count;
                const resort = item._id.resort;
                if (['limuru', 'kanamai', 'kisumu'].includes(resort)) {
                    monthMap[key][`${resort}_revenue`] = (monthMap[key][`${resort}_revenue`] || 0) + item.revenue;
                }
            }
        });

        allMonthlyFeedback.forEach(item => {
            const key = buildMonthKey(item._id.year, item._id.month);
            if (monthMap[key]) monthMap[key].feedback = item.count;
        });

        allMonthlyInquiries.forEach(item => {
            const key = buildMonthKey(item._id.year, item._id.month);
            if (monthMap[key]) monthMap[key].inquiries = item.count;
        });

        allMonthlyClaims.forEach(item => {
            const key = buildMonthKey(item._id.year, item._id.month);
            if (monthMap[key]) monthMap[key].claims = item.count;
        });

        const months = recentMonthKeys.map(key => monthMap[key]);
        stats.revenueHistory = { months };

        res.json(stats);
    } catch (error) {
        console.error('Stats aggregation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get counts for sidebar badges
// @route   GET /api/stats/counts
// @access  Private (Admin/Manager)
const getSidebarCounts = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'manager') {
            filter.resort = { $in: req.user.properties };
        }

        const [
            bookings_total, bookings_unread,
            offers,
            claims_total, claims_unread,
            feedback_total, feedback_unread,
            tenders,
            bids_total, bids_unread,
            staff,
            managers,
            recruitments,
            applications_total,
            applications_unread
        ] = await Promise.all([
            Booking.countDocuments({ ...filter, status: 'pending' }),
            Booking.countDocuments({ ...filter, isRead: false }),
            Offer.countDocuments({ ...filter, active: true }),
            OfferClaim.countDocuments({ ...filter, status: 'pending' }),
            OfferClaim.countDocuments({ ...filter, isRead: false }),
            Feedback.countDocuments(filter),
            Feedback.countDocuments({ ...filter, isRead: false }),
            Tender.countDocuments({ ...filter, status: 'Open' }),
            Bid.countDocuments({ ...filter, status: 'Pending' }),
            Bid.countDocuments({ ...filter, isRead: false }),
            User.countDocuments({ role: 'staff' }),
            User.countDocuments({ role: 'manager' }),
            Recruitment.countDocuments({ ...filter, status: 'Open' }),
            JobApplication.countDocuments({ status: 'Pending' }),
            JobApplication.countDocuments({ isRead: false })
        ]);

        res.json({
            bookings: { total: bookings_total, unread: bookings_unread },
            offers,
            claims: { total: claims_total, unread: claims_unread },
            feedback: { total: feedback_total, unread: feedback_unread },
            tenders,
            bids: { total: bids_total, unread: bids_unread },
            recruitments,
            applications: { total: applications_total, unread: applications_unread },
            users: staff,
            managers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get comprehensive detailed report
// @route   GET /api/stats/report
// @access  Private (Admin/Manager)
const getDetailedReport = async (req, res) => {
    try {
        const { resort, startDate, endDate } = req.query;
        let filter = {};

        // Date range filter
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Role-based/Property filter
        let queryFilter = { ...filter };
        if (req.user.role === 'manager') {
            queryFilter.resort = { $in: req.user.properties };
            queryFilter.deletedByBranch = { $ne: true };
        } else if (resort && resort !== 'all') {
            queryFilter.resort = resort;
        }

        // 1. Revenue & Booking Breakdown
        const bookingReport = await Booking.aggregate([
            { $match: queryFilter },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },
                    guests: { $sum: { $add: ["$guests.adults", "$guests.children"] } }
                }
            }
        ]);

        // 2. Communications & Analytics Performance
        const [messages, tenders, bids] = await Promise.all([
            Message.aggregate([
                { $match: queryFilter.resort ? { resort: queryFilter.resort } : {} },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Tender.find(queryFilter.resort ? { resort: queryFilter.resort } : {}),
            Bid.aggregate([
                { $match: queryFilter.resort ? { resort: queryFilter.resort } : {} },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        // 3. Offers & Claims Conversion
        const [offers, claims] = await Promise.all([
            Offer.find(queryFilter.resort ? { resort: queryFilter.resort } : {}),
            OfferClaim.aggregate([
                { $match: queryFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        // 4. Feedback Sentiment
        const feedbackReport = await Feedback.aggregate([
            { $match: queryFilter.resort ? { resort: queryFilter.resort } : {} },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": -1 } }
        ]);

        // 5. Monthly Revenue Trend (Last 12 Months)
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        const revenueTrend = await Booking.aggregate([
            { $match: { ...queryFilter, createdAt: { $gte: yearAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json({
            bookings: bookingReport,
            communications: {
                total: messages.reduce((acc, m) => acc + m.count, 0),
                status: messages
            },
            tenders: {
                total: tenders.length,
                status: tenders.reduce((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1;
                    return acc;
                }, {}),
                bids: bids
            },
            offers: {
                total: offers.length,
                claims: claims
            },
            feedback: {
                distribution: feedbackReport,
                average: feedbackReport.length > 0
                    ? feedbackReport.reduce((acc, f) => acc + (f._id * f.count), 0) / feedbackReport.reduce((acc, f) => acc + f.count, 0)
                    : 0
            },
            revenueTrend: revenueTrend
        });

    } catch (error) {
        console.error('Detailed report error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getSidebarCounts,
    getDetailedReport
};

