const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    
    const specPromptDoc = await db.collection('prompts').findOne({ name: 'Especialista_Planificacion_Diaria_Unidad' });
    const formats = await db.collection('doc_formats').find({}).toArray();
    
    let dynamicInstructions = '\n\n### REGLA CRÍTICA: ESTRUCTURAS JSON REQUERIDAS POR PLANTILLA\nEl Orquestador es un sistema automatizado que SOLO puede leer formato JSON. Es OBLIGATORIO que entregues todo el contenido de la planificación dentro de un bloque ```json al final de tu respuesta.\nDependiendo de la plantilla que elijas, DEBES estructurar tu JSON exactamente con las siguientes variables:\n';
    for (const f of formats) {
        if (f.ia_instructions) {
            dynamicInstructions += `\n**Si usas la plantilla ${f.type}**, tu JSON DEBE incluir estas llaves:\n${f.ia_instructions}\n`;
        }
    }
    dynamicInstructions += '\n\nIMPORTANTE: ¡Si no incluyes el bloque ```json con los datos, el sistema fallará y el profesor no recibirá su documento! NO DEVUELVAS TEXTO DE RELLENO, SOLO EL INFORME Y EL JSON.';

    const systemPrompt = specPromptDoc.content + dynamicInstructions;
    const specInst = "Documento: Planificación diaria\nNivel: Primario\nGrado: 2do\nMateria: Lengua Española\nTema: Las homosintaxis\nDuración: 45 minutos";

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: specInst }
            ],
            max_tokens: 3500,
            temperature: 0.2
        })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("ESPECIALISTA RESPONSE:", data.choices[0].message.content);
    } else {
        console.error("API ERROR:", await res.text());
    }
    process.exit(0);
}
run();
