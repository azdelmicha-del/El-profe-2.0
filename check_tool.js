const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const conv = await db.collection('conversations').find({}).sort({ updatedAt: -1 }).limit(1).toArray();
    const msgs = conv[0].messages.slice(-5);
    for (let m of msgs) {
        if (m.tool_calls) {
            console.log("TOOL CALL ARGS:", m.tool_calls[0].function.arguments);
        }
    }
    process.exit(0);
}
run();
