const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const p = await db.collection('prompts').findOne({ name: 'Especialista_Planificacion_Diaria_Unidad' });
    let c = p.content;
    c += '\n\nIMPORTANTE: ESTÁS AUTORIZADO A TRABAJAR CON CUALQUIER TIPO DE PLANTILLA O MODALIDAD QUE EL ORQUESTADOR TE ASIGNE (Unidad de Aprendizaje, Secuencia Didáctica, etc.). NUNCA DEVUELVAS FALTA_DATO_ESENCIAL PORQUE LA PLANTILLA NO COINCIDA CON TU NOMBRE.';
    await db.collection('prompts').updateOne({ name: 'Especialista_Planificacion_Diaria_Unidad' }, { $set: { content: c } });
    console.log('Prompt actualizado');
    process.exit(0);
}
run();
