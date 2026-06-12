const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');

module.exports = function (app) {
    app.get('/api/conversations/calendar', authenticateToken, async (req, res) => {
        try {
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const month = parseInt(req.query.month) || new Date().getMonth() + 1;
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);

            const convs = await getDb().collection('conversations').find({
                userId: req.userId,
                createdAt: { $gte: start, $lte: end }
            }, { projection: { title: 1, createdAt: 1 } }).sort({ createdAt: 1 }).toArray();

            const days = {};
            for (const c of convs) {
                const date = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
                if (isNaN(date.getTime())) continue;
                const d = date.getDate();
                if (!days[d]) days[d] = [];
                days[d].push({ id: c._id.toString(), title: c.title || 'Sin título' });
            }

            res.json({ year, month, days });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
