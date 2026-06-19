const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    
    const specPromptDoc = await db.collection('prompts').findOne({ name: 'Especialista_Planificacion_Diaria_Unidad' });
    const formats = await db.collection('doc_formats').find({}).toArray();
    
    let dynamicInstructions = '\n\n### REGLA CRÍTICA: ESTRUCTURAS JSON REQUERIDAS POR PLANTILLA\nEl Orquestador es un sistema automatizado que SOLO puede leer formato JSON. Es OBLIGATORIO que entregues todo el contenido de la planificación dentro de un bloque ```json al final de tu respuesta.\nDependiendo de la plantilla que elijas, DEBES estructurar tu JSON exactamente con las siguientes variables:\n';
    const targetTemplateType = 'Plantilla_Planificacion_Diaria_Nivel_Primario_Secuencia_Didactica';
    const f = formats.find(fmt => fmt.type === targetTemplateType);
    if (f && f.ia_instructions) {
        dynamicInstructions += `\n**Si usas la plantilla ${f.type}**, tu JSON DEBE incluir estas llaves:\n${f.ia_instructions}\n`;
    }
    dynamicInstructions += '\n\nIMPORTANTE: ¡Si no incluyes el bloque ```json con los datos, el sistema fallará y el profesor no recibirá su documento! NO DEVUELVAS TEXTO DE RELLENO, SOLO EL INFORME Y EL JSON.';

    let globalKnowledgeBlock = '\n\n📚 BASE DE CONOCIMIENTOS OFICIAL (REGLAS Y DATOS GLOBALES OBLIGATORIOS):\n';
    const knowledgeItems = await db.collection('knowledge').find({}).toArray();
    for (const item of knowledgeItems) {
        globalKnowledgeBlock += `\n[${item.title}]:\n${item.content}\n---\n`;
    }
    if (globalKnowledgeBlock.length > 50000) {
        globalKnowledgeBlock = globalKnowledgeBlock.substring(0, 50000) + '\n...[CONTENIDO RECORTADO POR LÍMITE DE MEMORIA DEL SISTEMA]';
    }
    globalKnowledgeBlock += '\nUSA ESTA BASE DE CONOCIMIENTOS COMO FUENTE PRINCIPAL DE VERDAD. SI UN DATO ESTÁ AQUÍ, ES OFICIAL DEL MINERD.\n';

    const specInst = `Documento: Planificación diaria
Nivel: Primario
Grado: 2do
Materia: Lengua Española
Tema: Las homosintaxis
Duración: 45 minutos
Plantilla elegida: ${targetTemplateType}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: specPromptDoc.content + globalKnowledgeBlock },
                { role: 'user', content: specInst + '\n\n' + dynamicInstructions }
            ],
            max_tokens: 3500,
            temperature: 0.2
        })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("ESPECIALISTA RESPONSE:\n", data.choices[0].message.content);
    } else {
        console.error("API ERROR:\n", await res.text());
    }
    process.exit(0);
}
run();
