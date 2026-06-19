const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const knowledgeItems = await db.collection('knowledge').find({}).toArray();
    let b = '';
    for(let item of knowledgeItems) b+=`\n[${item.title}]:\n${item.content}\n---\n`;
    console.log('Length:', b.length);
    process.exit(0);
}
run();
