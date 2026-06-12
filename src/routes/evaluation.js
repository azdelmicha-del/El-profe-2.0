const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');

module.exports = function (app) {
    app.get('/api/evaluation-schedule', authenticateToken, async (req, res) => {
        try {
            const evals = await getDb().collection('evaluationSchedule').find({ userId: req.userId }).sort({ date: 1 }).toArray();
            res.json({ evaluations: evals.map(e => ({ id: e._id.toString(), title: e.title, date: e.date, subject: e.subject, grade: e.grade, type: e.type, notes: e.notes })) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/evaluation-schedule', authenticateToken, async (req, res) => {
        try {
            const doc = { userId: req.userId, title: String(req.body.title || '').trim(), date: req.body.date ? new Date(req.body.date) : null, subject: String(req.body.subject || '').trim(), grade: String(req.body.grade || '').trim(), type: String(req.body.type || 'exam').trim(), notes: String(req.body.notes || '').trim() };
            if (!doc.title) return res.status(400).json({ error: 'Título requerido' });
            const r = await getDb().collection('evaluationSchedule').insertOne(doc);
            res.json({ success: true, id: r.insertedId.toString() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/evaluation-schedule/:id', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('evaluationSchedule').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};
