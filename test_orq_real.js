const { connectMongo, getDb } = require('./src/db');
async function run() {
    await connectMongo();
    const db = getDb();
    
    const p = await db.collection('prompts').findOne({ name: 'Planixa_Asistente' });
    let MINERD_SYSTEM_PROMPT = p.content + `
=== REGLAS DE GENERACIÓN (OBLIGATORIAS) ===
1. RECOLECCIÓN: Primero debes recolectar el Nivel, Grado, Materia y Tema que quiere el docente para su planificación.
2. CONFIRMACIÓN: Luego de tener esos datos, dile al profe qué vas a generar y pregúntale si está de acuerdo.
3. EJECUCIÓN TÉCNICA: Si el profe dice que SÍ, DEBES LLAMAR INMEDIATAMENTE a la herramienta "consultar_especialista" enviándole los parámetros detallados. 
4. GENERACIÓN FINAL: Cuando el especialista devuelva la estructura técnica (ESTADO: DOCUMENTO_LISTO), simplemente responde al profesor amigablemente terminando tu respuesta con la etiqueta: [GENERATE_DOCX]`;

    const messages = [
        { role: 'system', content: MINERD_SYSTEM_PROMPT },
        { role: 'assistant', content: 'Perfecto, profe. ¿Para qué nivel, grado, materia y tema necesitas la nueva planificación?' },
        { role: 'user', content: 'matematica, segundo grado' },
        { role: 'assistant', content: 'Perfecto, profe. ¿Cuál es el tema que deseas trabajar en Matemática para segundo grado?' },
        { role: 'user', content: 'numero entero' },
        { role: 'assistant', content: 'Listo, profe. Tengo estos datos:\n\nDocumento: Planificación diaria\nNivel: Primario\nGrado: 2do\nMateria: Matemática\nTema: Números enteros\nDuración: 45 minutos\n\n¿Procedo a generarla en Word editable?' },
        { role: 'user', content: 'si' }
    ];

    const tools = [{
        type: "function",
        function: {
            name: "consultar_especialista",
            description: "Envía los datos recolectados al especialista correspondiente para que genere la estructura final (Unidad, Diaria, Rúbrica, etc.).",
            parameters: {
                type: "object",
                properties: {
                    especialista_id: { type: "string" },
                    instrucciones_detalladas: { type: "string" }
                },
                required: ["especialista_id", "instrucciones_detalladas"]
            }
        }
    }];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages,
            tools: tools,
            tool_choice: "auto",
            max_tokens: 1500,
            temperature: 0.3
        })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("RESPONSE TOOL_CALLS:", JSON.stringify(data.choices[0].message.tool_calls, null, 2));
        console.log("RESPONSE CONTENT:", data.choices[0].message.content);
    }
    process.exit(0);
}
run();
