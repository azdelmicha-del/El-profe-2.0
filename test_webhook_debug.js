const { connectMongo, getDb } = require('./src/db');
const mongoose = require('mongoose');


async function testWebhook() {
    await connectMongo();
    const db = getDb();
    
    const from = '18099391518';
    const text = 'si';
    
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

    const tools = [
        {
            type: "function",
            function: {
                name: "consultar_especialista",
                description: "Delega la creación de una planificación o estructura a un Especialista técnico en el back-office. Usa esto siempre que el profesor pida crear un material.",
                parameters: {
                    type: "object",
                    properties: {
                        especialista_id: { type: "string", description: "El ID del especialista seleccionado." },
                        plantilla_nombre: { type: "string", description: "El nombre exacto de la plantilla seleccionada de la lista de Plantillas disponibles." },
                        instrucciones_detalladas: { type: "string", description: "Instrucciones detalladas y explícitas con TODO lo que el especialista necesita redactar (tema, grado, área, etc)." }
                    },
                    required: ["especialista_id", "plantilla_nombre", "instrucciones_detalladas"]
                }
            }
        }
    ];

    console.log('5. Calling OpenAI');
    const orquestadorRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages,
            tools: tools,
            temperature: 0.3
        })
    });
    
    console.log('6. OpenAI Status:', orquestadorRes.status);
    const data = await orquestadorRes.json();
    console.log('7. OpenAI Response:', JSON.stringify(data, null, 2));

    // LLAMADA SIMULADA DE HERRAMIENTA SI OCURRE
    if (data.choices[0].message.tool_calls) {
        console.log('--- TOOL CALLED ---');
        const toolCall = data.choices[0].message.tool_calls[0];
        console.log(toolCall.function.name);
        console.log(toolCall.function.arguments);
        
        const args = JSON.parse(toolCall.function.arguments);
        const specPromptDoc = prompts.find(p => p.name === args.especialista_id || p._id.toString() === args.especialista_id);
        if (!specPromptDoc) {
            console.log("ESPECIALISTA NO ENCONTRADO:", args.especialista_id);
        } else {
            console.log("ESPECIALISTA ENCONTRADO:", specPromptDoc.name);
        }
    }
    
    process.exit(0);
}

require('dotenv').config();
testWebhook().catch(e => console.error('FATAL', e));
