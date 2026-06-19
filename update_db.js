const { connectMongo, getDb } = require('./src/db');

async function run() {
    await connectMongo();
    const db = getDb();
    
    // Rename Planixa_Principal
    await db.collection('prompts').updateOne({name: 'Planixa_Principal'}, {$set: {name: 'Planixa_Asistente'}});
    
    // Prepend instructions to Specialists
    const specPrefix = 'INSTRUCCIÓN ESTRUCTURAL DE BACK-OFFICE:\nERES UNA MÁQUINA GENERADORA DE ESTRUCTURAS, NO UN ASISTENTE CONVERSACIONAL.\nTu único objetivo es recibir parámetros de entrada y generar la estructura curricular solicitada.\nREGLA ABSOLUTA: NO saludes al usuario. NO te despidas. NO hagas preguntas. NO ofrezcas ayuda adicional. Simplemente entrega el contenido técnico puro.\n\n';
    
    const specs = await db.collection('prompts').find({name: /^Especialista/}).toArray();
    for(const s of specs) {
        if(!s.content.includes('MÁQUINA GENERADORA')) {
            await db.collection('prompts').updateOne({_id: s._id}, {$set: {content: specPrefix + s.content}});
        }
    }
    console.log('Base de datos actualizada correctamente.');
    process.exit(0);
}

run();
