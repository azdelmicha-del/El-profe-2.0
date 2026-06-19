require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Find logs that don't have a known model
    const knownModels = ['gpt-4o-mini', 'gpt-4o', 'o1-mini', 'o1-preview'];
    const logs = await db.collection('api_usage').find({ 
        model: { $nin: knownModels }
    }).toArray();

    console.log(JSON.stringify(logs, null, 2));

    await client.close();
})();
