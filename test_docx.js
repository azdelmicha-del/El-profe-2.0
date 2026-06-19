const { connectMongo, getDb } = require('./src/db');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

async function run() {
    await connectMongo();
    const db = getDb();
    
    try {
        const fmtId = (await db.collection('doc_formats').find({}).toArray())[0]._id.toString();
        const formatDoc = await db.collection('doc_formats').findOne({ _id: fmtId });
        
        const templatePath = path.join(__dirname, 'public', formatDoc.filePath);
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        
        let realKeys = [];
        try {
            const rawXml = zip.files['word/document.xml'] ? zip.files['word/document.xml'].asText() : '';
            const pureText = rawXml.replace(/<[^>]+>/g, '');
            const tagMatches = pureText.match(/\{\{([^}]+)\}\}/g) || [];
            realKeys = [...new Set(tagMatches.map(t => t.replace(/[{}]/g, '').trim()))];
        } catch(xe) {}
        
        const jsonData = {};
        const finalData = {};
        for (const rk of realKeys) {
            finalData[rk] = '';
        }
        console.log("FINAL DATA:", finalData);
        
        const doc = new Docxtemplater(zip, { delimiters: { start: '{{', end: '}}' }, paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
        doc.render(finalData);
        
        console.log("SUCCESS RENDER!");
    } catch(e) {
        console.log("ERROR RENDER:", e.message);
    }
    process.exit(0);
}
run();
