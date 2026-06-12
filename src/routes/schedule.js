const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');

module.exports = function (app) {
    app.get('/api/schedule', authenticateToken, async (req, res) => {
        try {
            const entries = await getDb().collection('schedule').find({ userId: req.userId }).sort({ day: 1, startTime: 1 }).toArray();
            res.json({ schedule: entries.map(e => ({ id: e._id.toString(), day: e.day, startTime: e.startTime, endTime: e.endTime, subject: e.subject, grade: e.grade, room: e.room, notes: e.notes })) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/schedule', authenticateToken, async (req, res) => {
        try {
            const doc = { userId: req.userId, day: parseInt(req.body.day) || 1, startTime: String(req.body.startTime || ''), endTime: String(req.body.endTime || ''), subject: String(req.body.subject || '').trim(), grade: String(req.body.grade || '').trim(), room: String(req.body.room || '').trim(), notes: String(req.body.notes || '').trim() };
            if (!doc.subject) return res.status(400).json({ error: 'Materia requerida' });
            if (doc.day < 1 || doc.day > 7) return res.status(400).json({ error: 'Día inválido (1-7)' });
            const r = await getDb().collection('schedule').insertOne(doc);
            res.json({ success: true, id: r.insertedId.toString() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.put('/api/schedule/:id', authenticateToken, async (req, res) => {
        try {
            const update = {};
            if (req.body.day !== undefined) update.day = parseInt(req.body.day);
            if (req.body.startTime !== undefined) update.startTime = String(req.body.startTime);
            if (req.body.endTime !== undefined) update.endTime = String(req.body.endTime);
            if (req.body.subject !== undefined) update.subject = String(req.body.subject).trim();
            if (req.body.grade !== undefined) update.grade = String(req.body.grade).trim();
            if (req.body.room !== undefined) update.room = String(req.body.room).trim();
            if (req.body.notes !== undefined) update.notes = String(req.body.notes).trim();
            await getDb().collection('schedule').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId }, { $set: update });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/schedule/:id', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('schedule').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};
