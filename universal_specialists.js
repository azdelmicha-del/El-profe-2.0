const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    const prompts = await db.collection('prompts').find({ name: /^Especialista_/ }).toArray();
    for (const p of prompts) {
        let c = p.content;
        
        // Remover restricciones de tipo de planificación
        c = c.replace(/No generas unidades completas\./gi, '');
        c = c.replace(/No generas planificaciones por secuencia didáctica\./gi, '');
        c = c.replace(/Solo trabajas planificación diaria basada en Unidad de Aprendizaje\./gi, '');
        c = c.replace(/Solo trabajas planificación diaria basada en Secuencia Didáctica\./gi, '');
        c = c.replace(/No generas rúbricas, listas de cotejo ni evaluaciones independientes\./gi, '');
        c = c.replace(/Eres el especialista interno de Planixa encargado exclusivamente de construir planificaciones diarias basadas en el modelo de Unidad de Aprendizaje\./gi, 'Eres el especialista interno de Planixa encargado de construir planificaciones.');
        
        // Agregar instrucción super-universal
        c += '\n\nIMPORTANTE DE SEGURIDAD: ERES UN ESPECIALISTA UNIVERSAL. Tienes PROHIBIDO rechazar una solicitud por motivos de que "la plantilla no coincide con tu nombre o especialidad". Debes aceptar CUALQUIER plantilla (Unidad de Aprendizaje, Secuencia Didáctica, Estructura Real, etc) y llenarla utilizando las llaves JSON dinámicas proporcionadas por el Orquestador.';
        
        await db.collection('prompts').updateOne({ _id: p._id }, { $set: { content: c } });
        console.log(`Actualizado ${p.name}`);
    }
    process.exit(0);
}
run();
