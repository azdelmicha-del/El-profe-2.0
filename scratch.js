const { getDb, connectMongo } = require('./src/db');
connectMongo().then(async () => {
    const db = getDb();
    const docs = await db.collection('api_usage').find({ cost: { $gt: 0 }, model: "N/A" }).toArray();
    console.log(JSON.stringify(docs, null, 2));
    process.exit(0);
});
