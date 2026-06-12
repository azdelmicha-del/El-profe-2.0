const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');

module.exports = function (app) {
    app.get('/api/clients', authenticateToken, async (req, res) => {
        try {
            const msgs = await getDb().collection('client_messages').aggregate([
                { $sort: { createdAt: -1 } },
                { $group: { _id: '$phone', lastMsg: { $first: '$message' }, lastDate: { $first: '$createdAt' }, total: { $sum: 1 }, incoming: { $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] } } } },
                { $project: { phone: '$_id', lastMsg: 1, lastDate: 1, total: 1, incoming: 1, _id: 0 } },
                { $sort: { lastDate: -1 } }
            ]).toArray();
            for (const c of msgs) {
                const u = await getDb().collection('users').findOne({ phone: c.phone }, { projection: { name: 1 } });
                c.name = u?.name || c.phone;
            }
            res.json({ clients: msgs });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/clients/:phone/messages', authenticateToken, async (req, res) => {
        try {
            const msgs = await getDb().collection('client_messages').find({ phone: req.params.phone }).sort({ createdAt: 1 }).toArray();
            res.json({ messages: msgs.map(m => ({ id: m._id.toString(), message: m.message, direction: m.direction, employeeName: m.employeeName || null, createdAt: m.createdAt })) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/clients/:phone/reply', authenticateToken, async (req, res) => {
        try {
            const { message } = req.body;
            if (!message) return res.status(400).json({ error: 'Mensaje requerido' });
            const employee = await getDb().collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.userId) }, { projection: { name: 1 } });
            await getDb().collection('client_messages').insertOne({ phone: req.params.phone, message, direction: 'outgoing', employeeId: req.userId, employeeName: employee?.name || 'Empleado', createdAt: new Date() });
            const WA_TOKEN = process.env.WA_TOKEN;
            const WA_PHONE_ID = process.env.WA_PHONE_ID;
            if (WA_TOKEN && WA_PHONE_ID) {
                const r = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WA_TOKEN}` },
                    body: JSON.stringify({ messaging_product: 'whatsapp', to: req.params.phone, type: 'text', text: { body: message.slice(0, 4096) } })
                });
                if (!r.ok) return res.json({ sent: false, error: 'Error al enviar WhatsApp' });
                return res.json({ sent: true });
            }
            res.json({ sent: false, simulated: true, message: 'WhatsApp no configurado. Mensaje guardado.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
