const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');

module.exports = function (app) {
    app.get('/api/journal', authenticateToken, async (req, res) => {
        try {
            const entries = await getDb().collection('journals').find({ userId: req.userId }).sort({ date: -1 }).toArray();
            res.json({ entries: entries.map(e => ({ id: e._id.toString(), date: e.date, content: e.content, mood: e.mood, tags: e.tags || [], createdAt: e.createdAt })) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/journal', authenticateToken, async (req, res) => {
        try {
            const doc = { userId: req.userId, date: req.body.date ? new Date(req.body.date) : new Date(), content: String(req.body.content || '').trim(), mood: String(req.body.mood || 'neutral').trim(), tags: Array.isArray(req.body.tags) ? req.body.tags : [], createdAt: new Date() };
            if (!doc.content) return res.status(400).json({ error: 'Contenido requerido' });
            const r = await getDb().collection('journals').insertOne(doc);
            res.json({ success: true, id: r.insertedId.toString() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/journal/:id', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('journals').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};
