require('dotenv').config();
const { connectMongo, getDb } = require('./src/db');

// Instrucción a agregar al final de cada prompt de Especialista de Planificación
const JSON_INSTRUCTION = `

=== INSTRUCCIÓN DE SALIDA (NO MODIFICAR) ===
Cuando el sistema te envíe instrucciones con un bloque "=== INSTRUCCIÓN CRÍTICA: DEBES DEVOLVER UN JSON ESTRUCTURADO ===", 
DEBES seguirlas al pie de la letra: devolver ÚNICAMENTE un bloque JSON con los campos solicitados, seguido de [GENERATE_DOCX].
Si el sistema te pide Markdown con tablas, usa ese formato.
Siempre responde según las instrucciones específicas que recibas en cada turno.`;

async function run() {
    await connectMongo();
    const db = getDb();
    const prompts = await db.collection('prompts').find({}).toArray();
    let updatedCount = 0;

    const planningSpecialists = [
        'Especialista_Planificacion_Diaria_Por_Unidad',
        'Especialista_Planificacion_Diaria_Por_Secuencia',
        'Especialista_Unidad_Aprendizaje'
    ];

    for (const prompt of prompts) {
        if (!planningSpecialists.includes(prompt.name)) continue;
        if (prompt.content && prompt.content.includes('INSTRUCCIÓN DE SALIDA (NO MODIFICAR)')) {
            console.log(`✓ Ya actualizado: ${prompt.name}`);
            continue;
        }
        const newContent = (prompt.content || '') + JSON_INSTRUCTION;
        await db.collection('prompts').updateOne(
            { _id: prompt._id },
            { $set: { content: newContent } }
        );
        updatedCount++;
        console.log(`✅ Actualizado: ${prompt.name}`);
    }
    console.log(`\nFin. ${updatedCount} especialistas actualizados.`);
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
