const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const p = await db.collection('prompts').find({ name: /^Especialista_/ }).toArray();
    console.log(p.map(x => x.name));
    process.exit(0);
}
run();
