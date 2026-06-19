const { connectMongo, getDb } = require('./src/db');
require('dotenv').config();
async function run() {
    await connectMongo();
    const db = getDb();
    
    // Simulate what webhook does
    const p = await db.collection('prompts').findOne({ name: 'Planixa_Asistente' });
    const MINERD_SYSTEM_PROMPT = p.content + `
=== REGLA DE GENERACIÓN ===
3. AUDITAR Y ENTREGAR: Una vez que el especialista te devuelva la estructura cruda, audítala. Si está correcta, preséntala al profesor de manera amigable.
4. GENERACIÓN DE DOCUMENTO: Si auditas un trabajo técnico y está listo, agrega obligatoriamente al final de tu mensaje la etiqueta [GENERATE_DOCX].`;

    const toolCallId = "call_abc123";
    const messages = [
        { role: 'system', content: MINERD_SYSTEM_PROMPT },
        { role: 'user', content: 'Documento: Planificación diaria, Nivel: Primario, Grado: 2do, Materia: Lengua Española, Tema: Las homosintaxis, Duración: 45 minutos' },
        { role: 'assistant', tool_calls: [{ id: toolCallId, type: "function", function: { name: "consultar_especialista", arguments: "{}" } }] },
        { role: 'tool', tool_call_id: toolCallId, name: 'consultar_especialista', content: `RESPUESTA_A: PLANIXA_principal\nESTADO: FALTA_DATO_ESENCIAL\nDATO_FALTANTE: Tema\nSOLICITAR_A_PLANIXA_PRINCIPAL: Pregunta al docente de forma breve: “¿Podrías confirmar el tema correcto? Parece que 'Las homosintaxis' no es un tema común en el currículo de Lengua Española para 2do grado de Primaria.”` }
    ];
    
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o', 
            messages: messages,
            temperature: 0.3
        })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("RESPONSE:", data.choices[0].message.content);
    }
    process.exit(0);
}
run();
