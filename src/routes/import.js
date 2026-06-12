const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');
const mongoose = require('mongoose');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

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
const uploadRef = multer({ storage: refStorage, limits: { fileSize: 15 * 1024 * 1024 } });

module.exports = function (app) {
    app.post('/api/import/plan', authenticateToken, uploadRef.single('file'), async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
            const filePath = req.file.path;
            try {
                let text = '';
                if (req.file.mimetype === 'application/pdf') {
                    const buf = fs.readFileSync(filePath);
                    const data = await pdfParse(buf);
                    text = data.text || '';
                } else {
                    text = fs.readFileSync(filePath, 'utf-8');
                }
                if (!text.trim()) return res.status(400).json({ error: 'No se pudo extraer texto' });
                res.json({ success: true, text: text.slice(0, 10000), name: req.file.originalname });
            } finally {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
