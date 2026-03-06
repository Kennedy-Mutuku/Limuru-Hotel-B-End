const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const Offer = require('../models/Offer');
const OfferClaim = require('../models/OfferClaim');
const Tender = require('../models/Tender');
const Bid = require('../models/Bid');
const User = require('../models/User');

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

        // --- 4. Revenue History - Monthly (Last 6 months) ---
        // --- 4. Revenue History - Monthly (Last 6 months) ---
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setUTCHours(0, 0, 0, 0);
        sixMonthsAgo.setUTCDate(1);
        sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5);

        const monthlyRaw = await Booking.aggregate([
            { $match: { ...statsFilter, createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" }, resort: "$resort" },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // --- 5. Revenue History - Weekly (Last 8 weeks) ---
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setUTCHours(0, 0, 0, 0);
        eightWeeksAgo.setUTCDate(eightWeeksAgo.getUTCDate() - 55);

        const weeklyRaw = await Booking.aggregate([
            { $match: { ...statsFilter, createdAt: { $gte: eightWeeksAgo } } },
            {
                $group: {
                    _id: { week: { $isoWeek: "$createdAt" }, year: { $isoWeekYear: "$createdAt" }, resort: "$resort" },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } }
        ]);

        // --- 6. Revenue History - Daily (Last 14 days) ---
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setUTCHours(0, 0, 0, 0);
        fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);

        const dailyRaw = await Booking.aggregate([
            { $match: { ...statsFilter, createdAt: { $gte: fourteenDaysAgo } } },
            {
                $group: {
                    _id: { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" }, resort: "$resort" },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        console.log(`Stats requested for resort: ${resort || 'all'} by role: ${req.user.role}`);
        console.log(`Daily aggregation count: ${dailyRaw.length}`);

        const properties_list = ['limuru', 'kanamai', 'kisumu'];

        // Months Generator — use UTC methods
        const months = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setUTCHours(12, 0, 0, 0);
            d.setUTCDate(1);
            d.setUTCMonth(d.getUTCMonth() - (5 - i));
            const obj = {
                name: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
                month: d.getUTCMonth() + 1,
                year: d.getUTCFullYear()
            };
            properties_list.forEach(p => obj[p] = 0);
            months.push(obj);
        }
        monthlyRaw.forEach(item => {
            const entry = months.find(m => m.month === item._id.month && m.year === item._id.year);
            if (entry) entry[item._id.resort] = item.revenue;
        });

        // Weeks Generator — derive ISO week number from UTC date
        const weeks = [];
        for (let i = 0; i < 8; i++) {
            const d = new Date();
            d.setUTCHours(12, 0, 0, 0);
            d.setUTCDate(d.getUTCDate() - (7 * (7 - i)));

            const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            const dayNr = (target.getUTCDay() + 6) % 7;
            target.setUTCDate(target.getUTCDate() - dayNr + 3);
            const firstThursday = target.valueOf();
            target.setUTCMonth(0, 1);
            if (target.getUTCDay() !== 4) {
                target.setUTCDate(1 + ((4 - target.getUTCDay()) + 7) % 7);
            }
            const w = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
            const year = new Date(firstThursday).getUTCFullYear();
            const obj = { name: `Wk ${w}`, week: w, year: year };
            properties_list.forEach(p => obj[p] = 0);
            weeks.push(obj);
        }
        weeklyRaw.forEach(item => {
            const entry = weeks.find(w => w.week === item._id.week && w.year === item._id.year);
            if (entry) entry[item._id.resort] = item.revenue;
        });

        // Days Generator — use UTC day/month/year
        const days = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setUTCHours(12, 0, 0, 0);
            d.setUTCDate(d.getUTCDate() - (13 - i));
            const label = d.toLocaleString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
            const obj = {
                name: label,
                day: d.getUTCDate(),
                month: d.getUTCMonth() + 1,
                year: d.getUTCFullYear()
            };
            properties_list.forEach(p => obj[p] = 0);
            days.push(obj);
        }
        dailyRaw.forEach(item => {
            const entry = days.find(d => d.day === item._id.day && d.month === item._id.month && d.year === item._id.year);
            if (entry) entry[item._id.resort] = item.revenue;
        });

        stats.revenueHistory = { months, weeks, days };

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
            managers
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
            User.countDocuments({ role: 'manager' })
        ]);

        res.json({
            bookings: { total: bookings_total, unread: bookings_unread },
            offers,
            claims: { total: claims_total, unread: claims_unread },
            feedback: { total: feedback_total, unread: feedback_unread },
            tenders,
            bids: { total: bids_total, unread: bids_unread },
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

        // 2. Tenders & Bids Performance
        const [tenders, bids] = await Promise.all([
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

