const fs = require('fs');
const { connectMongo, getDb } = require('./src/db');

async function run() {
    await connectMongo();
    const db = getDb();
    
    // Get all prompts
    const prompts = await db.collection('prompts').find({}).toArray();
    // Get all formats
    const formats = await db.collection('doc_formats').find({}).toArray();
    
    let updatedCount = 0;

    for (const prompt of prompts) {
        // Skip Planixa_Asistente
        if (prompt.name === 'Planixa_Asistente') continue;

        // Extract the template names this specialist is supposed to handle from its description
        // For example: "Debe trabajar únicamente estas plantillas: Plantilla_X, Plantilla_Y."
        let relevantFormats = [];
        
        for (const format of formats) {
            if (prompt.description && prompt.description.includes(format.type)) {
                relevantFormats.push(format);
            }
        }

        if (relevantFormats.length > 0) {
            let newInstructions = `\n\n---\n\n### ESTRUCTURAS JSON REQUERIDAS POR PLANTILLA [MODIFICADO POR ANTIGRAVITY]\n`;
            newInstructions += `El Orquestador necesita que entregues el resultado en formato JSON para poder generar el documento Word. DEPENDIENDO DE LA PLANTILLA QUE ELIJAS, DEBES generar tu respuesta OBLIGATORIAMENTE usando el formato JSON exacto correspondiente, rellenando los campos curriculares:\n\n`;

            for (const format of relevantFormats) {
                // Extract variables from the instruction string
                // Format instructions usually look like: "Genera un JSON con las siguientes variables obligatorias: var1, var2, var3. Si no hay..."
                const match = format.instructions.match(/variables obligatorias: (.+?)\. Si no hay/i);
                if (match) {
                    const vars = match[1].split(',').map(v => v.trim());
                    const jsonExample = {};
                    vars.forEach(v => {
                        jsonExample[v] = "";
                    });
                    
                    newInstructions += `**Si usas ${format.type}**, tu respuesta debe ser EXACTAMENTE este bloque JSON:\n`;
                    newInstructions += "```json\n";
                    newInstructions += JSON.stringify(jsonExample, null, 2);
                    newInstructions += "\n```\n\n";
                }
            }
            
            // Append the new instructions to the prompt content if not already there
            if (!prompt.content.includes("ESTRUCTURAS JSON REQUERIDAS POR PLANTILLA")) {
                const newContent = prompt.content + newInstructions;
                await db.collection('prompts').updateOne({ _id: prompt._id }, { $set: { content: newContent } });
                console.log(`Updated specialist: ${prompt.name}`);
                updatedCount++;
            } else {
                console.log(`Specialist ${prompt.name} already has JSON instructions.`);
            }
        }
    }
    
    console.log(`Finished updating ${updatedCount} specialists.`);
    process.exit(0);
}

run().catch(console.error);
