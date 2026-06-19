const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const convs = await db.collection('conversations').find({ phone: /8097758962/ }).sort({ updatedAt: -1 }).limit(1).toArray();
    if (convs.length > 0) {
        console.log(JSON.stringify(convs[0].messages.slice(-5), null, 2));
    }
    process.exit(0);
}
run();
