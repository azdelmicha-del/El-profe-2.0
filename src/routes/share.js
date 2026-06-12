const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');
const crypto = require('crypto');

module.exports = function (app) {
    app.post('/api/conversations/:id/share', authenticateToken, async (req, res) => {
        try {
            const conv = await getDb().collection('conversations').findOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            if (!conv) return res.status(404).json({ error: 'No encontrada' });

            let shareToken = conv.shareToken;
            if (!shareToken) {
                shareToken = crypto.randomBytes(12).toString('hex');
                await getDb().collection('conversations').updateOne(
                    { _id: new mongoose.Types.ObjectId(req.params.id) },
                    { $set: { shareToken, sharedAt: new Date() } }
                );
            }
            res.json({ success: true, url: `/api/shared/${shareToken}` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/conversations/:id/share', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('conversations').updateOne(
                { _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId },
                { $unset: { shareToken: '', sharedAt: '' } }
            );
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/shared/:token', async (req, res) => {
        try {
            const conv = await getDb().collection('conversations').findOne({ shareToken: req.params.token });
            if (!conv) return res.status(404).json({ error: 'No encontrada o enlace expirado' });

            const user = await getDb().collection('users').findOne({ _id: new mongoose.Types.ObjectId(conv.userId) });

            res.json({
                title: conv.title || 'Planificación Docente',
                teacher: user ? user.name || 'Docente' : 'Docente',
                messages: conv.messages || [],
                createdAt: conv.createdAt
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
