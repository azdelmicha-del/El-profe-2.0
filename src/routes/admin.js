const mongoose = require('mongoose');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getDb } = require('../db');

module.exports = function (app) {
    app.get('/api/admin/users', authenticateToken, async (req, res) => {
        if (!(await isAdmin(req.userId))) return res.status(403).json({ error: 'Solo admin' });
        try {
            const users = await getDb().collection('users').find({}, { projection: { password: 0 } }).sort({ created_at: -1 }).toArray();
            res.json({ users: users.map(u => ({ id: u._id.toString(), phone: u.phone, name: u.name || '', role: u.role, is_admin: !!u.is_admin, created_at: u.created_at })) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.put('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
        if (!(await isAdmin(req.userId))) return res.status(403).json({ error: 'Solo admin' });
        try {
            const _id = new mongoose.Types.ObjectId(req.params.id);
            const is_admin = req.body.is_admin === true;
            await getDb().collection('users').updateOne({ _id }, { $set: { is_admin, role: is_admin ? 'admin' : 'teacher' } });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
        if (!(await isAdmin(req.userId))) return res.status(403).json({ error: 'Solo admin' });
        try {
            const _id = new mongoose.Types.ObjectId(req.params.id);
            const update = {};
            if (req.body.name !== undefined) update.name = String(req.body.name || '').trim();
            if (req.body.phone !== undefined) update.phone = String(req.body.phone || '').trim();
            await getDb().collection('users').updateOne({ _id }, { $set: update });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
        if (!(await isAdmin(req.userId))) return res.status(403).json({ error: 'Solo admin' });
        try {
            const _id = new mongoose.Types.ObjectId(req.params.id);
            const user = await getDb().collection('users').findOne({ _id });
            if (!user) return res.status(404).json({ error: 'No encontrado' });
            if (user.is_admin) return res.status(400).json({ error: 'No puedes eliminar un admin' });
            await getDb().collection('users').deleteOne({ _id });
            await getDb().collection('conversations').deleteMany({ userId: req.params.id });
            await getDb().collection('references').deleteMany({ userId: req.params.id });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};
