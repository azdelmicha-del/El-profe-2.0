const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');

const TEMPLATES = [
    { id: 'matematica-5to', title: 'Matemática 5to Primaria', grade: '5to Primaria', area: 'Matemática', topic: 'Fracciones', description: 'Planificación de fracciones: suma, resta, multiplicación y división' },
    { id: 'lengua-1ro-sec', title: 'Lengua Española 1ro Secundaria', grade: '1ro Secundaria', area: 'Lengua Española', topic: 'La oración compuesta', description: 'Oraciones coordinadas y subordinadas' },
    { id: 'sociales-3ro', title: 'Ciencias Sociales 3ro Primaria', grade: '3ro Primaria', area: 'Ciencias Sociales', topic: 'Los símbolos patrios', description: 'Bandera, escudo e himno nacional dominicano' },
    { id: 'naturaleza-6to', title: 'Ciencias de la Naturaleza 6to Secundaria', grade: '6to Secundaria', area: 'Ciencias de la Naturaleza', topic: 'El ecosistema', description: 'Ecosistemas terrestres y acuáticos de RD' },
    { id: 'ingles-4to', title: 'Inglés 4to Primaria', grade: '4to Primaria', area: 'Inglés', topic: 'Parts of the body', description: 'Vocabulario básico del cuerpo humano' },
    { id: 'formacion-1ro', title: 'Formación Humana 1ro Secundaria', grade: '1ro Secundaria', area: 'Formación Humana', topic: 'Valores y convivencia', description: 'El respeto, la tolerancia y la solidaridad' },
    { id: 'educacion-fisica-3ro', title: 'Educación Física 3ro Primaria', grade: '3ro Primaria', area: 'Educación Física', topic: 'Juegos cooperativos', description: 'Actividades físicas para trabajo en equipo' },
    { id: 'artistica-2do', title: 'Educación Artística 2do Primaria', grade: '2do Primaria', area: 'Educación Artística', topic: 'Colores primarios', description: 'Reconocimiento y mezcla de colores primarios' },
];

module.exports = function (app) {

    app.get('/api/templates', authenticateToken, (req, res) => {
        res.json({ templates: TEMPLATES });
    });

    app.get('/api/custom-templates', authenticateToken, async (req, res) => {
        try {
            const tmpls = await getDb().collection('customTemplates').find({ userId: req.userId }).sort({ name: 1 }).toArray();
            res.json({ templates: tmpls.map(t => ({ id: t._id.toString(), name: t.name, grade: t.grade, area: t.area, prompt: t.prompt, createdAt: t.createdAt })) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/custom-templates', authenticateToken, async (req, res) => {
        try {
            const doc = { userId: req.userId, name: String(req.body.name || '').trim(), grade: String(req.body.grade || '').trim(), area: String(req.body.area || '').trim(), prompt: String(req.body.prompt || '').trim(), createdAt: new Date() };
            if (!doc.name || !doc.prompt) return res.status(400).json({ error: 'Nombre y prompt requeridos' });
            const r = await getDb().collection('customTemplates').insertOne(doc);
            res.json({ success: true, id: r.insertedId.toString() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.put('/api/custom-templates/:id', authenticateToken, async (req, res) => {
        try {
            const update = {};
            if (req.body.name !== undefined) update.name = String(req.body.name).trim();
            if (req.body.grade !== undefined) update.grade = String(req.body.grade).trim();
            if (req.body.area !== undefined) update.area = String(req.body.area).trim();
            if (req.body.prompt !== undefined) update.prompt = String(req.body.prompt).trim();
            await getDb().collection('customTemplates').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId }, { $set: update });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/custom-templates/:id', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('customTemplates').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

};
