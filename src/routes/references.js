const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const REF_DIR = path.join(PROJECT_ROOT, 'data', 'refs');
if (!fs.existsSync(REF_DIR)) fs.mkdirSync(REF_DIR, { recursive: true });

const refStorage = multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, REF_DIR),
    filename: (_r, file, cb) => {
        const safe = Date.now() + '-' + (file.originalname || 'ref.pdf').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, safe);
    }
});
const uploadRef = multer({ storage: refStorage, limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: (_r, f, cb) => f.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Solo PDF')) });

module.exports = function (app) {

    app.post('/api/references/upload', authenticateToken, uploadRef.single('pdf'), async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No se recibió PDF' });
            const filePath = req.file.path;
            try {
                const buf = fs.readFileSync(filePath);
                const data = await pdfParse(buf);
                const text = data.text || '';
                const pages = data.numpages || 0;
                const name = req.file.originalname.replace(/\.pdf$/i, '');

                await getDb().collection('references').insertOne({
                    userId: req.userId,
                    fileName: req.file.originalname,
                    name,
                    text,
                    pages,
                    size: req.file.size,
                    uploadedAt: new Date()
                });

                res.json({ success: true, message: `PDF procesado: ${pages} páginas, ${text.length} caracteres`, name, pages, chars: text.length });
            } finally {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('PDF ref error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/references', authenticateToken, async (req, res) => {
        try {
            const refs = await getDb().collection('references').find({ userId: req.userId }, { projection: { text: 0 } }).sort({ uploadedAt: -1 }).toArray();
            res.json({ references: refs.map(r => ({ id: r._id.toString(), name: r.name || r.fileName, pages: r.pages, size: r.size, uploadedAt: r.uploadedAt })) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/references/:id', authenticateToken, async (req, res) => {
        try {
            await getDb().collection('references').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id), userId: req.userId });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

};
