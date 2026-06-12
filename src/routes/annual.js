const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');

module.exports = function (app) {
    app.get('/api/annual-plan', authenticateToken, async (req, res) => {
        try {
            const plans = await getDb().collection('annualPlans').find({ userId: req.userId }).sort({ period: 1 }).toArray();
            res.json({ plans: plans.map(p => ({ id: p._id.toString(), year: p.year, period: p.period, subject: p.subject, grade: p.grade, content: p.content, goals: p.goals, createdAt: p.createdAt })) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/annual-plan', authenticateToken, async (req, res) => {
        try {
            const doc = { userId: req.userId, year: parseInt(req.body.year) || new Date().getFullYear(), period: String(req.body.period || '').trim(), subject: String(req.body.subject || '').trim(), grade: String(req.body.grade || '').trim(), content: String(req.body.content || '').trim(), goals: String(req.body.goals || '').trim(), createdAt: new Date() };
            if (!doc.subject || !doc.period) return res.status(400).json({ error: 'Materia y período requeridos' });
            const r = await getDb().collection('annualPlans').insertOne(doc);
            res.json({ success: true, id: r.insertedId.toString() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.put('/api/annual-plan/:id', authenticateToken, async (req, res) => {
        try {
            const update = {};
            if (req.body.year !== undefined) update.year = parseInt(req.body.year);
            if (req.body.period !== undefined) update.period = String(req.body.period).trim();
            if (req.body.subject !== undefined) update.subject = String(req.body.subject).trim();
            if (req.body.grade !== undefined) update.grade = String(req.body.grade).trim();
            if (req.body.content !== undefined) update.content = String(req.body.content).trim();
            if (req.body.goals !== undefined) update.goals = String(req.body.goals).trim();
            await getDb().collection('annualPlans').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId }, { $set: update });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/annual-plan/:id', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('annualPlans').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};
