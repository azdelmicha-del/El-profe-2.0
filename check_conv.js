const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const conv = await db.collection('conversations').find({ phone: /8099391518/ }).sort({ updatedAt: -1 }).limit(1).toArray();
    if (conv.length > 0) {
        console.log(JSON.stringify(conv[0].messages.slice(-5), null, 2));
    }
    process.exit(0);
}
run();
