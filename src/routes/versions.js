const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');

module.exports = function (app) {
    app.post('/api/conversations/:id/version', authenticateToken, async (req, res) => {
        try {
            const conv = await getDb().collection('conversations').findOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            if (!conv) return res.status(404).json({ error: 'No encontrada' });
            await getDb().collection('versions').insertOne({ conversationId: req.params.id, userId: req.userId, messages: conv.messages || [], title: conv.title, savedAt: new Date() });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/conversations/:id/versions', authenticateToken, async (req, res) => {
        try {
            const versions = await getDb().collection('versions').find({ conversationId: req.params.id, userId: req.userId }).sort({ savedAt: -1 }).limit(20).toArray();
            res.json({ versions: versions.map(v => ({ id: v._id.toString(), title: v.title, savedAt: v.savedAt, msgCount: (v.messages || []).length })) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/versions/:id', authenticateToken, async (req, res) => {
        try {
            const v = await getDb().collection('versions').findOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            if (!v) return res.status(404).json({ error: 'No encontrada' });
            res.json({ id: v._id.toString(), title: v.title, messages: v.messages || [], savedAt: v.savedAt });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
