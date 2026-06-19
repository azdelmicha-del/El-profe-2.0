const { connectMongo, getDb } = require('./src/db');

async function run() {
    await connectMongo();
    const db = getDb();
    
    const prompts = await db.collection('prompts').find({ name: { $regex: '^Especialista_' } }).toArray();
    
    for (const p of prompts) {
        let content = p.content;
        
        // Buscar y eliminar toda la sección de "ESTRUCTURAS JSON REQUERIDAS POR PLANTILLA"
        const startMarker = '### ESTRUCTURAS JSON REQUERIDAS POR PLANTILLA';
        const endMarker = 'IMPORTANTE: ESTÁS AUTORIZADO A TRABAJAR CON CUALQUIER TIPO DE PLANTILLA';
        
        const startIndex = content.indexOf(startMarker);
        
        if (startIndex !== -1) {
            // Eliminar desde startIndex hasta el final o hasta que encontremos algo relevante
            // En este caso, simplemente podemos truncar desde el startMarker, ya que webhook.js inyecta dinámicamente lo que falta al final
            content = content.substring(0, startIndex).trim();
            content += '\n\nIMPORTANTE: ESTÁS AUTORIZADO A TRABAJAR CON CUALQUIER TIPO DE PLANTILLA O MODALIDAD QUE EL ORQUESTADOR TE ASIGNE. El Orquestador te proporcionará la estructura JSON exacta que debes seguir en sus instrucciones dinámicas. DEBES usar el formato JSON que te indique el Orquestador.';
            
            await db.collection('prompts').updateOne({ _id: p._id }, { $set: { content: content } });
            console.log(`Prompt actualizado limpiando JSONs duros: ${p.name}`);
        }
    }
    
    process.exit(0);
}
run();
