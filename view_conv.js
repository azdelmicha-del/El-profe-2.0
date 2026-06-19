const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const convs = await db.collection('conversations').find({ 'messages.content': { $regex: 'Documento: Planificación diaria' } }).sort({ createdAt: -1 }).limit(1).toArray();
    console.log(JSON.stringify(convs[0].messages.slice(-7), null, 2));
    process.exit(0);
}
run().catch(console.error);
