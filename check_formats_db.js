require('dotenv').config();
const { connectMongo, getDb } = require('./src/db');

async function run() {
    await connectMongo();
    const db = getDb();
    const formats = await db.collection('doc_formats').find({}).toArray();
    console.log('\n=== DOC_FORMATS EN LA BD ===');
    for (const f of formats) {
        console.log(`\nID: ${f._id}`);
        console.log(`Nombre/Type: ${f.type}`);
        console.log(`Tiene htmlTemplate: ${!!(f.htmlTemplate && f.htmlTemplate.length > 50)}`);
        if (f.htmlTemplate) console.log(`htmlTemplate (primeros 200 chars): ${f.htmlTemplate.slice(0, 200)}`);
        console.log(`Tags: ${JSON.stringify(f.tags)}`);
        console.log(`supported_formats: ${JSON.stringify(f.supported_formats)}`);
        console.log('---');
    }
    process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
