const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');

module.exports = function (app) {
    app.get('/api/reminders', authenticateToken, async (req, res) => {
        try {
            const rems = await getDb().collection('reminders').find({ userId: req.userId }).sort({ dueDate: 1 }).toArray();
            res.json({ reminders: rems.map(r => ({ id: r._id.toString(), title: r.title, description: r.description, dueDate: r.dueDate, type: r.type, done: !!r.done, createdAt: r.createdAt })) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/reminders', authenticateToken, async (req, res) => {
        try {
            const doc = { userId: req.userId, title: String(req.body.title || '').trim(), description: String(req.body.description || '').trim(), dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null, type: String(req.body.type || 'general').trim(), done: false, createdAt: new Date() };
            if (!doc.title) return res.status(400).json({ error: 'Título requerido' });
            const r = await getDb().collection('reminders').insertOne(doc);
            res.json({ success: true, id: r.insertedId.toString() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.put('/api/reminders/:id', authenticateToken, async (req, res) => {
        try {
            const update = {};
            if (req.body.title !== undefined) update.title = String(req.body.title).trim();
            if (req.body.description !== undefined) update.description = String(req.body.description).trim();
            if (req.body.dueDate !== undefined) update.dueDate = new Date(req.body.dueDate);
            if (req.body.type !== undefined) update.type = String(req.body.type).trim();
            if (req.body.done !== undefined) update.done = req.body.done === true;
            await getDb().collection('reminders').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId }, { $set: update });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/reminders/:id', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('reminders').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};
