require('dotenv').config();
const { connectMongo, getDb } = require('./src/db');

async function run() {
    await connectMongo();
    const db = getDb();
    const prompts = await db.collection('prompts').find({}).toArray();
    let updatedCount = 0;

    for (let prompt of prompts) {
        if (!prompt.content) continue;
        let content = prompt.content;
        let originalContent = content;

        content = content
            .replace(/PLANTILLAS QUE PUEDES USAR[\s\S]*?(?=\n---|\n[A-Z][A-Z]|\n$|$)/gi, '')
            .replace(/"ESTADO"\s*:.*?PLANTILLA_INCORRECTA.*?(?=\n|\})/gi, '')
            .replace(/seleccionar la plantilla correcta[^.]*\./gi, '')
            .replace(/seleccionar la plantilla correspondiente[^.]*\./gi, '')
            .replace(/validar.*?plantilla[^.]*\./gi, '')
            .replace(/verificar.*?plantilla[^.]*\./gi, '')
            .replace(/Plantilla_\w+\.docx/g, '')
            .replace(/Plantilla_\w+/g, '')
            .replace(/rellenar la plantilla correspondiente[^.]*\./gi, 'generar el contenido estructurado.')
            .replace(/rellenar la plantilla[^.]*\./gi, 'generar el contenido.')
            .replace(/documento Word \.docx/g, 'contenido en formato Markdown')
            .replace(/documento Word/g, 'contenido Markdown')
            .replace(/devolver a PLANIXA_principal un documento[^.]*\./gi, 'generar el contenido y devolverlo a PLANIXA_principal.')
            .replace(/\{[\s]*"ESTADO"[\s]*:[\s]*"PLANTILLA_INCORRECTA"[\s]*\}/gi, '')
            .replace(/ESTADO.*?PLANTILLA_INCORRECTA.*?\n/gi, '')
            .replace(/\{[^}]*"ESTADO"[^}]*"PLANTILLA_INCORRECTA"[^}]*\}/gi, '');

        if (content !== originalContent) {
            await db.collection('prompts').updateOne({ _id: prompt._id }, { $set: { content: content } });
            updatedCount++;
            console.log(`Updated prompt: ${prompt.name}`);
        }
    }
    console.log(`Finished. Updated ${updatedCount} prompts.`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
