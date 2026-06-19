const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const cursor = await db.collection('conversations').find({ phone: '18099391518' }).sort({ createdAt: -1 }).limit(1).toArray();
    if (cursor.length > 0) {
        const msgs = cursor[0].messages.slice(-6);
        for(let m of msgs) {
            console.log(`[${m.role}] ${m.content ? m.content.slice(0, 300) : JSON.stringify(m.tool_calls)}`);
        }
    } else {
        console.log("No conv found for 18099391518");
    }
    process.exit(0);
}
run();
