const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const prompts = await db.collection('prompts').find({ name: /^Especialista_/ }).toArray();
    for (const p of prompts) {
        let c = p.content;
        
        const startMarker = 'PLANTILLAS QUE PUEDES USAR';
        const endMarker = 'EXCEPCIÓN DE ERRORES:'; // u otra sección
        
        // Simplemente vamos a borrar toda la validación manual de plantillas
        // La mejor manera de no dañar el prompt es usando regex.
        c = c.replace(/PLANTILLAS QUE PUEDES USAR[\s\S]*?(?=---)/g, 'PLANTILLAS QUE PUEDES USAR\nAcepta la plantilla que te envíe el Orquestador de forma absoluta e incondicional. No debes validar si coincide con el nivel. Si el Orquestador te la envía, esa es la correcta.\n\n');
        
        await db.collection('prompts').updateOne({ _id: p._id }, { $set: { content: c } });
        console.log(`Actualizado validación de plantillas en ${p.name}`);
    }
    process.exit(0);
}
run();
