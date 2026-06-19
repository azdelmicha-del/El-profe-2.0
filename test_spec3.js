const { connectMongo, getDb } = require('./src/db');
require('dotenv').config();
async function run() {
    await connectMongo();
    const db = getDb();
    
    // Simulate what webhook does
    const knowledgeItems = await db.collection('knowledge').find({}).toArray();
    let globalKnowledgeBlock = '';
    if (knowledgeItems && knowledgeItems.length > 0) {
        globalKnowledgeBlock = '\n\n📚 BASE DE CONOCIMIENTOS OFICIAL (REGLAS Y DATOS GLOBALES OBLIGATORIOS):\n';
        for (const item of knowledgeItems) {
            globalKnowledgeBlock += `\n[${item.title}]:\n${item.content}\n---\n`;
        }
        if (globalKnowledgeBlock.length > 150000) {
            globalKnowledgeBlock = globalKnowledgeBlock.substring(0, 150000) + '\n...[CONTENIDO RECORTADO POR LÍMITE DE MEMORIA DEL SISTEMA]';
        }
        globalKnowledgeBlock += '\nUSA ESTA BASE DE CONOCIMIENTOS COMO FUENTE PRINCIPAL DE VERDAD. SI UN DATO ESTÁ AQUÍ, ES OFICIAL DEL MINERD.\n';
    }

    const formats = await db.collection('doc_formats').find({}).toArray();
    let dynamicInstructions = '\n\n### ESTRUCTURAS JSON REQUERIDAS POR PLANTILLA\nEl Orquestador necesita que entregues el resultado en formato JSON. Dependiendo de la plantilla que uses, DEBES generar tu respuesta OBLIGATORIAMENTE usando el formato JSON exacto correspondiente:\n';
    for (const f of formats) {
        if (f.ia_instructions) {
            dynamicInstructions += `\n**Si usas ${f.name}**, incluye ESTAS variables en tu JSON:\n${f.ia_instructions}\n`;
        }
    }

    const p = await db.collection('prompts').findOne({ name: 'Especialista_Planificacion_Diaria_Unidad' });
    
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o', 
            messages: [
                { role: 'system', content: p.content + globalKnowledgeBlock + dynamicInstructions },
                { role: 'user', content: 'Documento: Planificación diaria, Nivel: Primario, Grado: 2do, Materia: Lengua Española, Tema: Las homosintaxis, Duración: 45 minutos' }
            ],
            max_tokens: 3500,
            temperature: 0.2
        })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("RESPONSE:", data.choices[0].message.content);
    }
    process.exit(0);
}
run();
