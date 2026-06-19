const {connectMongo, getDb} = require('./src/db');
connectMongo().then(async () => {
    const db = getDb();
    
    // Set api_balance to -0.80
    await db.collection('settings').updateOne(
        { _id: 'general' },
        { $set: { api_balance: -0.80 } },
        { upsert: true }
    );
    
    const settings = await db.collection('settings').findOne({ _id: 'general' });
    console.log('New Balance:', settings.api_balance);
    
    process.exit();
}).catch(console.error);
