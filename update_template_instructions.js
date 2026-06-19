const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const { connectMongo, getDb } = require('./src/db');

async function extractTagsFromDocx(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'binary');
        const zip = new PizZip(content);
        let textContent = '';
        
        // Extraer texto de todos los archivos XML (documento, encabezados, pies de página)
        for (const [key, file] of Object.entries(zip.files)) {
            if (key.startsWith('word/') && key.endsWith('.xml')) {
                textContent += file.asText();
            }
        }
        
        // Buscar todas las etiquetas del tipo {variable} o {#bucle} {/bucle}
        // Nota: en el XML de Word, las etiquetas a veces se rompen por el formato, ej: {<w:t>variable</w:t>}
        // Para simplificar, primero quitaremos todas las etiquetas XML para dejar solo texto plano
        const plainText = textContent.replace(/<[^>]+>/g, '');
        
        const tags = new Set();
        const regex = /\{([^}]+)\}/g;
        let match;
        while ((match = regex.exec(plainText)) !== null) {
            let tag = match[1].trim().replace(/[{}]/g, ''); // Limpiar llaves residuales
            if (!tag || tag.startsWith('/')) continue; // ignorar vacíos y cierres de bucles
            if (tag.startsWith('#')) {
                // Es un bucle
                tag = tag.substring(1).trim();
                tags.add(tag + " (Array de objetos)");
            } else {
                tags.add(tag);
            }
        }
        
        return Array.from(tags);
    } catch (e) {
        console.error("Error extrayendo tags de " + filePath, e);
        return [];
    }
}

async function run() {
    await connectMongo();
    const db = getDb();
    const formats = await db.collection('doc_formats').find({}).toArray();
    
    for (const f of formats) {
        const fullPath = path.join(__dirname, 'public', f.filePath);
        if (fs.existsSync(fullPath)) {
            const tags = await extractTagsFromDocx(fullPath);
            if (tags.length > 0) {
                // Crear un JSON esqueleto de ejemplo
                let jsonStr = '```json\n{\n';
                for (let i = 0; i < tags.length; i++) {
                    const t = tags[i];
                    if (t.includes('(Array')) {
                        const baseName = t.split(' ')[0];
                        jsonStr += `  "${baseName}": [\n    {\n      "//NOTA": "Agrega aquí las llaves correspondientes a los elementos de este bucle según veas necesario"\n    }\n  ]`;
                    } else {
                        jsonStr += `  "${t}": ""`;
                    }
                    if (i < tags.length - 1) jsonStr += ',\n';
                    else jsonStr += '\n';
                }
                jsonStr += '}\n```';
                
                await db.collection('doc_formats').updateOne(
                    { _id: f._id },
                    { $set: { ia_instructions: jsonStr } }
                );
                console.log(`Actualizado ${f.type} con ${tags.length} etiquetas.`);
            } else {
                console.log(`No se encontraron etiquetas para ${f.type}`);
            }
        } else {
            console.log(`No existe el archivo ${fullPath}`);
        }
    }
    
    console.log("¡Terminado!");
    process.exit(0);
}
run();
