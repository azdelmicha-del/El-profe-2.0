const { connectMongo, getDb } = require('./src/db');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

async function run() {
    await connectMongo();
    const PROJECT_ROOT = path.resolve(__dirname);
    let finalJsonFromSpecialist = null;
    let reply = "Listo, profe. Tengo estos datos:\n\nDocumento: Planificación diaria\nNivel: Primario\nGrado: 2do\nMateria: Lengua Española\nTema: Las homosintaxis\nDuración: 45 minutos\n\n¿Procedo a generarla en Word editable? [GENERATE_DOCX]";
    let req = { pendingFormatId: undefined, app: { emit: () => {} } };
    let activeConv = { pendingFormatId: undefined };
    let user = { name: "Maria", grade: "2do", area: "Lengua", school: "Señor Mi Rey" };
    let from = "18099391518";

    try {
        let jsonData = {};
        if (finalJsonFromSpecialist) {
            try { jsonData = JSON.parse(finalJsonFromSpecialist); } catch(e) {}
        } else {
            const jsonMatch = reply.match(/```json\s*(\{[\s\S]*?\})\s*```/) || reply.match(/(\{[\s\S]*?\})/);
            if (jsonMatch) {
                try { jsonData = JSON.parse(jsonMatch[1]); } catch(e) {}
            }
        }

        let fmtId = (activeConv && activeConv.pendingFormatId) || req.pendingFormatId;

        if (!fmtId) {
            const allFormats = await getDb().collection('doc_formats').find({}).toArray();
            const jStr = Object.keys(jsonData).length > 0 ? JSON.stringify(jsonData).toLowerCase() : '';
            let bestFmt = null;
            if (jStr) {
                if (jStr.includes('inicial')) bestFmt = allFormats.find(f => f.type.toLowerCase().includes('inicial'));
                else if (jStr.includes('primari')) bestFmt = allFormats.find(f => f.type.toLowerCase().includes('primari'));
                else if (jStr.includes('modalidad') && jStr.includes('secundari')) bestFmt = allFormats.find(f => f.type.toLowerCase().includes('modalidad'));
                else if (jStr.includes('secundari')) bestFmt = allFormats.find(f => f.type.toLowerCase().includes('secundari') && !f.type.toLowerCase().includes('modalidad'));
            }
            if (bestFmt) fmtId = bestFmt._id.toString();
            else if (allFormats.length > 0) fmtId = allFormats[0]._id.toString();
        }

        if (fmtId) {
            const formatDoc = await getDb().collection('doc_formats').findOne({ _id: new mongoose.Types.ObjectId(fmtId) });
            if (formatDoc && formatDoc.filePath) {
                const templatePath = path.join(PROJECT_ROOT, 'public', formatDoc.filePath);
                const outDir = path.join(PROJECT_ROOT, 'public', 'downloads');
                if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

                const outFilename = `Documento-${from}-${Date.now()}.docx`;
                const outPath = path.join(outDir, outFilename);

                const content = fs.readFileSync(templatePath, 'binary');
                const zip = new PizZip(content);

                let realKeys = [];
                try {
                    const rawXml = zip.files['word/document.xml'] ? zip.files['word/document.xml'].asText() : '';
                    const pureText = rawXml.replace(/<[^>]+>/g, '');
                    const tagMatches = pureText.match(/\{\{([^}]+)\}\}/g) || [];
                    realKeys = [...new Set(tagMatches.map(t => t.replace(/[{}]/g, '').trim()))];
                } catch(xe) {}

                if (realKeys.length > 0) {
                    const finalData = {};
                    for (const rk of realKeys) {
                        const rkLow = rk.toLowerCase().replace(/[_\s]/g, '');
                        let matched = null;
                        for (const [jk, jv] of Object.entries(jsonData)) {
                            const jkLow = jk.toLowerCase().replace(/[_\s]/g, '');
                            if (rk === jk || rkLow === jkLow || rkLow.includes(jkLow) || jkLow.includes(rkLow)) {
                                matched = jv; break;
                            }
                        }
                        if (matched !== null) { finalData[rk] = matched; continue; }
                        if (rkLow.includes('profesor') || rkLow.includes('docente') || (rkLow.includes('nombre') && !rkLow.includes('tema'))) finalData[rk] = user.name || '';
                        else if (rkLow.includes('grado') || rkLow.includes('nivel')) finalData[rk] = user.grade || jsonData.grado || '';
                        else if (rkLow.includes('area') || rkLow.includes('materia') || rkLow.includes('asignatura')) finalData[rk] = user.area || jsonData.area || '';
                        else if (rkLow.includes('escuela') || rkLow.includes('centro') || rkLow.includes('colegio')) finalData[rk] = user.school || '';
                        else if (rkLow.includes('fecha')) finalData[rk] = new Date().toLocaleDateString('es-DO');
                        else finalData[rk] = '';
                    }
                    jsonData = finalData;
                }

                const doc = new Docxtemplater(zip, { delimiters: { start: '{{', end: '}}' }, paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
                doc.render(jsonData);

                const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
                fs.writeFileSync(outPath, buf);
                
                console.log("SUCCESS");
            }
        }
    } catch(e) {
        console.error("ERROR CAUGHT:", e);
    }
    process.exit(0);
}
run();
