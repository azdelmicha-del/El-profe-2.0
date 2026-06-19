require('dotenv').config();
const { MongoClient } = require('mongodb');
async function run() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('planif_pro');
    const allUsers = await db.collection('users').find({}).toArray();
    
    let backendPro = 0;
    let backendFree = 0;
    let backendExempt = 0;
    let backendAdmin = 0;
    allUsers.forEach(u => {
        if (u.is_admin) {
            backendAdmin++;
        } else if (u.plan === 'exempt') {
            backendExempt++;
        } else if (u.plan === 'free' || !u.plan) {
            backendFree++;
        } else {
            let isActivePro2 = false;
            if (u.plan === 'lifetime') isActivePro2 = true;
            else if (u.plan_expires && new Date(u.plan_expires) > new Date()) isActivePro2 = true;
            
            if (isActivePro2) {
                if (u.plan === 'trial') {
                    backendFree++;
                } else {
                    backendPro++;
                }
            } else {
                backendFree++; // Expirados cuentan como gratis
            }
        }
    });
    console.log(`Backend result -> Admin: ${backendAdmin}, Exempt: ${backendExempt}, Free: ${backendFree}, Pro: ${backendPro}, Total: ${allUsers.length}`);

    client.close();
}
run();
