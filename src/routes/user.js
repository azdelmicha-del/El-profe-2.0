const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

module.exports = function (app) {
    app.get('/api/user', authenticateToken, async (req, res) => {
        try {
            const user = await getDb().collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.userId) });
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
            res.json({ id: user._id.toString(), phone: user.phone, name: user.name || '', grade: user.grade || '', area: user.area || '', school: user.school || '', lang: user.lang || 'es', plan: user.plan || 'free', plan_expires: user.plan_expires, is_admin: !!user.is_admin });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/user', authenticateToken, async (req, res) => {
        try {
            const name = String(req.body.name || '').trim();
            await getDb().collection('users').updateOne({ _id: new mongoose.Types.ObjectId(req.userId) }, { $set: { name } });
            res.json({ success: true, name });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/user/profile', authenticateToken, async (req, res) => {
        try {
            const update = {};
            if (req.body.name !== undefined) update.name = String(req.body.name).trim();
            if (req.body.grade !== undefined) update.grade = String(req.body.grade).trim();
            if (req.body.area !== undefined) update.area = String(req.body.area).trim();
            if (req.body.school !== undefined) update.school = String(req.body.school).trim();
            await getDb().collection('users').updateOne({ _id: new mongoose.Types.ObjectId(req.userId) }, { $set: update });
            const user = await getDb().collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.userId) });
            res.json({ success: true, name: user.name, grade: user.grade, area: user.area, school: user.school });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/user/pin', authenticateToken, async (req, res) => {
        try {
            const pin = String(req.body.pin || '');
            if (pin && pin.length !== 4) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });
            const hashed = pin ? await bcrypt.hash(pin, 10) : '';
            await getDb().collection('users').updateOne({ _id: new mongoose.Types.ObjectId(req.userId) }, { $set: { pinHash: hashed || '' } });
            res.json({ success: true, hasPin: !!pin });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/user/verify-pin', authenticateToken, async (req, res) => {
        try {
            const user = await getDb().collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.userId) });
            if (!user || !user.pinHash) return res.json({ valid: false, message: 'Sin PIN configurado' });
            const match = await bcrypt.compare(String(req.body.pin || ''), user.pinHash);
            res.json({ valid: match });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
