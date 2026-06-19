const { connectMongo, getDb } = require('./src/db');
const mongoose = require('mongoose');


async function testWebhook() {
    await connectMongo();
    const db = getDb();
    
    const from = '18097758962';
    const text = 'hola';
    
    console.log('1. Fetched user');
    let user = await db.collection('users').findOne({ phone: from });
    const userId = user._id.toString();
    
    console.log('2. Memoria');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let activeConv = await db.collection('conversations').findOne({
        userId,
        is_whatsapp: true,
        createdAt: { $gte: thirtyDaysAgo }
    }, { sort: { createdAt: -1 } });

    let historyMessages = [];
    if (activeConv && activeConv.messages) {
        const recentMessages = activeConv.messages.slice(-20);
        historyMessages = recentMessages.map(m => {
            const msg = { role: m.role, content: m.content || '' };
            if (m.tool_calls) msg.tool_calls = m.tool_calls;
            if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
            if (m.name) msg.name = m.name;
            return msg;
        });
    }
    
    console.log('3. Prompts & Formats');
    const prompts = await db.collection('prompts').find({}).toArray();
    const formats = await db.collection('doc_formats').find({}).toArray();
    let defaultPrompt = prompts.find(p => p.name && p.name.replace(/_/g, ' ').trim().toLowerCase() === 'planixa asistente') || prompts[0];

    console.log('4. Building messages');
    const messages = [
        { role: 'system', content: defaultPrompt.content },
        ...historyMessages,
        { role: 'user', content: text }
    ];

    console.log('5. Calling OpenAI');
    const orquestadorRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages,
            max_tokens: 1500,
            temperature: 0.3
        })
    });
    
    console.log('6. OpenAI Status:', orquestadorRes.status);
    const data = await orquestadorRes.json();
    console.log('7. OpenAI Response:', JSON.stringify(data, null, 2));

    
    process.exit(0);
}

require('dotenv').config();
testWebhook().catch(e => console.error('FATAL', e));
