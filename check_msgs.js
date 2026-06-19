const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const msgs = await db.collection('client_messages').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    for (let m of msgs) {
        console.log(`[${m.direction}] ${m.phone}: ${m.message.slice(0, 50)}`);
    }
    process.exit(0);
}
require('dotenv').config();
run().catch(console.error);
