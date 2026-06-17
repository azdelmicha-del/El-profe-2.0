const fs = require('fs');

function refactorWebhook() {
    const file = 'src/routes/webhook.js';
    let content = fs.readFileSync(file, 'utf8');
    const startIdx = content.indexOf('                let selectedPrompt = null;');
    
    // Find end line
    const endStr = 'Si solo está haciendo una pregunta conversacional, charlando, o pidiendo consejos/ideas sueltas, respóndele normalmente. Esta prohibición es SOLO para generar documentos formales o planificaciones estructuradas).`;\n                }';
    const endIdx = content.indexOf(endStr) + endStr.length;
    
    if(startIdx === -1 || content.indexOf(endStr) === -1) {
        console.error('Indices not found in webhook.js!');
        process.exit(1);
    }
    
    const newBlock = `                const formats = await getDb().collection('doc_formats').find({}).toArray();
                let selectedPrompt = prompts.length > 0 ? prompts[0] : null;
                let hasFormat = false;

                let routerPromise = null;
                if (prompts.length > 1) {
                    const routerPrompt = \`Eres un enrutador inteligente. Tienes los siguientes Especialistas (Prompts) disponibles:\\n\${prompts.map(p => \`- ID: \${p._id.toString()} | Nombre: \${p.name} | Cuándo usar: \${p.description}\`).join('\\n')}\\n\\nEl usuario ha dicho: "\${text}"\\n\\nResponde ÚNICAMENTE con el ID del Especialista que mejor puede atender esta solicitud. Si ninguno aplica claramente, responde con el ID del Especialista más general o principal.\`;
                    
                    routerPromise = fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\` },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages: [{ role: 'system', content: routerPrompt }],
                            max_tokens: 50,
                            temperature: 0
                        })
                    });
                }

                let formatPromise = null;
                if (formats.length > 0) {
                    const formatMatcherPrompt = \`Eres un clasificador. Revisa si el mensaje del usuario está pidiendo generar un documento. Formatos disponibles: \${formats.map(f => f.type).join(', ')}. Si pide uno de esos, responde EXACTAMENTE con el tipo. Si no, responde "NINGUNO".\\nMensaje: "\${text}"\`;
                    
                    formatPromise = fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\` },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages: [{ role: 'system', content: formatMatcherPrompt }],
                            max_tokens: 20,
                            temperature: 0
                        })
                    });
                }

                // Ejecutar ambas llamadas en paralelo
                const [routerRes, fRes] = await Promise.all([
                    routerPromise ? routerPromise.catch(e => { console.error("Router error", e); return null; }) : Promise.resolve(null),
                    formatPromise ? formatPromise.catch(e => { console.error("Format error", e); return null; }) : Promise.resolve(null)
                ]);

                if (routerRes && routerRes.ok) {
                    const rData = await routerRes.json();
                    if (rData.usage) await logApiUsage(user._id.toString(), 'WhatsApp: Enrutador IA', 'gpt-4o-mini', rData.usage);
                    const chosenId = rData.choices?.[0]?.message?.content?.trim();
                    selectedPrompt = prompts.find(p => p._id.toString() === chosenId) || prompts[0];
                }

                if (selectedPrompt) {
                    MINERD_SYSTEM_PROMPT = selectedPrompt.content;
                }
                
                // Inject User Profile Info
                MINERD_SYSTEM_PROMPT += \`\\n\\nDATOS DEL PROFESOR:\\nNombre: \${user.name || 'Profe'}\\nGrado: \${user.grade || 'No especificado'}\\nÁrea/Materia: \${user.area || 'No especificada'}\\nCentro Educativo: \${user.school || 'No especificado'}\\nUsa estos datos siempre que necesites rellenar información personal del profesor o adaptar la planificación a su grado/materia, a menos que el profesor indique algo distinto para esta solicitud en particular.\\n\` +
                (user.preferences ? \`\\nPREFERENCIAS GUARDADAS DEL PROFESOR:\\n\${user.preferences}\\n(RESPETA ESTAS PREFERENCIAS ABSOLUTAMENTE)\\n\` : '') +
                \`\\nREGLA DE APRENDIZAJE: Si el profesor expresa un gusto, preferencia, o cómo le gustan los formatos a futuro (ej. "no me des rubricas", "me gustan los juegos"), debes incluir AL FINAL de tu respuesta esta etiqueta exacta: [MEMORIA: la preferencia aquí]. Yo la guardaré en la base de datos.\`;
                
                MINERD_SYSTEM_PROMPT += \`\\n\\nREGLA DE PERFIL E IDENTIDAD (MUY IMPORTANTE):\\nAntes de enviar o comenzar la creación de CUALQUIER planificación o documento, verifica el "Nombre" en los DATOS DEL PROFESOR. Si el nombre es genérico (ej. "hola", "Profe", "Maestro") o está vacío, DEBES preguntarle cortésmente cuál es su nombre completo antes de generar el documento.\\n\\nCuando el profesor te diga su nombre, grado, materia o escuela (ej. "soy Juan", "doy 2do", "de naturales"), DEBES incluir AL FINAL de tu respuesta esta etiqueta con los datos en formato JSON para guardarlos:\\n[UPDATE_PROFILE: {"name": "Juan Perez", "grade": "2do", "area": "Naturales"}]\\nIncluye solo los campos que te haya confirmado. Nunca omitas esta regla.\`;

                MINERD_SYSTEM_PROMPT += \`\\n\\nREGLA DE ENTREGA POR WHATSAPP:\\nPara que el profesor pueda copiar y pegar la planificación fácilmente, NUNCA mezcles la charla conversacional con el documento de la planificación en el mismo bloque. Usa EXACTAMENTE el separador \\\`|||\\\` para dividir los mensajes.
Ejemplo de cómo DEBES responder:
¡Excelente profe! Aquí te presento la estructura de la unidad:
|||
*Unidad Didáctica: El Cuento*
Grado: 2do grado
...
|||
¿Te parece bien esta estructura, profe? ¿Quieres hacer algún ajuste?\`;

                // --- FORMAT INJECTOR ---
                if (fRes && fRes.ok) {
                    const fData = await fRes.json();
                    if (fData.usage) await logApiUsage(user._id.toString(), 'WhatsApp: Clasificador Formato', 'gpt-4o-mini', fData.usage);
                    const chosenType = fData.choices?.[0]?.message?.content?.trim();
                    if (chosenType && chosenType !== "NINGUNO") {
                        const matchedFormat = formats.find(f => f.type.toLowerCase() === chosenType.toLowerCase());
                        if (matchedFormat) {
                            hasFormat = true;
                            let tmplIns = \`\\n\\nREGLA ESTRICTA DE FORMATO VISUAL (PLANTILLA WORD):\\nEl administrador ha asignado una plantilla Word para este documento.\`;
                            if (matchedFormat.instructions) tmplIns += \`\\nINSTRUCCIONES EXTRA DEL ADMIN: \${matchedFormat.instructions}\`;
                            
                            tmplIns += \`\\n\\nREGLA DE APROBACIÓN (MUY IMPORTANTE):
1. NO entregues una muestra de la planificación ni el texto completo en el chat. Mantén tus respuestas conversacionales y breves.
2. Si faltan datos para completar la plantilla, hazle al profesor las preguntas necesarias para obtenerlos.
3. Una vez tengas todos los datos y la planificación esté mentalmente lista, AL FINAL de tu mensaje pregúntale: "¿Tengo todos los datos listos, deseas que te genere tu documento en Word ahora?". 
4. NO USES la etiqueta [GENERATE_WORD] en este momento.
5. SÓLO usa [GENERATE_WORD] en tu SIGUIENTE mensaje si el profesor te responde que SÍ lo quiere en documento.

CUANDO EL PROFESOR DE LA APROBACIÓN:
Debes responder EXACTAMENTE con este formato, SIN agregar toda la planificación en texto plano:
[GENERATE_WORD]
\\\`\\\`\\\`json
{
  "etiqueta_del_word1": "Valor rellenado por ti",
  "etiqueta_del_word2": "Valor rellenado por ti"
}
\\\`\\\`\\\`
Nota: Asegúrate de adivinar/usar las claves correctas para el JSON según el contexto.\`;
                            MINERD_SYSTEM_PROMPT += tmplIns;
                            if (activeConv) {
                                activeConv.pendingFormatId = matchedFormat._id.toString();
                            } else {
                                req.pendingFormatId = matchedFormat._id.toString();
                            }
                        }
                    }
                }
                
                if (!hasFormat) {
                    MINERD_SYSTEM_PROMPT += \`\\n\\nREGLA ESTRICTA DE DISPONIBILIDAD:\\nSi notas que el usuario te está pidiendo explícitamente que le generes o crees una planificación, examen, rúbrica o cualquier documento estructurado, DEBES OBLIGATORIAMENTE rechazar la creación del mismo con este texto exacto:\\n"Aún no tengo el recurso o diseño activo para esa solicitud. Sin embargo, puedo pasarte con servicio al cliente para poder ayudarte desde el sistema."\\n(Nota: Si solo está haciendo una pregunta conversacional, charlando, o pidiendo consejos/ideas sueltas, respóndele normalmente. Esta prohibición es SOLO para generar documentos formales o planificaciones estructuradas).\`;
                }`;
    
    const finalContent = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
    fs.writeFileSync(file, finalContent);
    console.log('Successfully applied rewrite to webhook.js');
}

function refactorChat() {
    const file = 'src/routes/chat.js';
    let content = fs.readFileSync(file, 'utf8');
    const startIdx = content.indexOf('        let selectedPrompt = null;');
    
    const endStr = 'Si solo está haciendo una pregunta conversacional, charlando, o pidiendo consejos/ideas sueltas, respóndele normalmente. Esta prohibición es SOLO para generar documentos formales o planificaciones estructuradas).`;\n        }';
    const endIdx = content.indexOf(endStr) + endStr.length;
    
    if(startIdx === -1 || content.indexOf(endStr) === -1) {
        console.error('Indices not found in chat.js!');
        process.exit(1);
    }
    
    const newBlock = `        const formats = await getDb().collection('doc_formats').find({}).toArray();
        let selectedPrompt = prompts.length > 0 ? prompts[0] : null;
        let hasFormat = false;

        let routerPromise = null;
        if (prompts.length > 1) {
            const routerPrompt = \`Eres un enrutador inteligente. Tienes los siguientes Especialistas (Prompts) disponibles:\\n\${prompts.map(p => \`- ID: \${p._id.toString()} | Nombre: \${p.name} | Cuándo usar: \${p.description}\`).join('\\n')}\\n\\nEl usuario ha dicho: "\${text}"\\n\\nResponde ÚNICAMENTE con el ID del Especialista que mejor puede atender esta solicitud. Si ninguno aplica claramente, responde con el ID del Especialista más general o principal.\`;
            
            routerPromise = fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\` },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: routerPrompt }],
                    max_tokens: 50,
                    temperature: 0
                })
            });
        }

        let formatPromise = null;
        if (formats.length > 0) {
            const formatMatcherPrompt = \`Eres un clasificador. Revisa si el mensaje del usuario está pidiendo generar un documento. Formatos disponibles: \${formats.map(f => f.type).join(', ')}. Si pide uno de esos, responde EXACTAMENTE con el tipo. Si no, responde "NINGUNO".\\nMensaje: "\${text}"\`;
            
            formatPromise = fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\` },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: formatMatcherPrompt }],
                    max_tokens: 20,
                    temperature: 0
                })
            });
        }

        // Ejecutar en paralelo
        const [routerRes, fRes] = await Promise.all([
            routerPromise ? routerPromise.catch(e => { console.error("Router error", e); return null; }) : Promise.resolve(null),
            formatPromise ? formatPromise.catch(e => { console.error("Format error", e); return null; }) : Promise.resolve(null)
        ]);

        if (routerRes && routerRes.ok) {
            const rData = await routerRes.json();
            if (rData.usage) await logApiUsage(userId, 'Web: Enrutador IA', 'gpt-4o-mini', rData.usage);
            const chosenId = rData.choices?.[0]?.message?.content?.trim();
            selectedPrompt = prompts.find(p => p._id.toString() === chosenId) || prompts[0];
        }

        if (selectedPrompt) {
            MINERD_SYSTEM_PROMPT = selectedPrompt.content;
        }

        // Inject Profile
        MINERD_SYSTEM_PROMPT += profileBlock;
        MINERD_SYSTEM_PROMPT += identityRule;

        if (fRes && fRes.ok) {
            const fData = await fRes.json();
            if (fData.usage) await logApiUsage(userId, 'Web: Clasificador Formato', 'gpt-4o-mini', fData.usage);
            const chosenType = fData.choices?.[0]?.message?.content?.trim();
            if (chosenType && chosenType !== "NINGUNO") {
                const matchedFormat = formats.find(f => f.type.toLowerCase() === chosenType.toLowerCase());
                if (matchedFormat) {
                    hasFormat = true;
                    let tmplIns = \`\\n\\nREGLA ESTRICTA DE FORMATO VISUAL (PLANTILLA WORD):\\nEl administrador ha asignado una plantilla Word para este documento.\`;
                    if (matchedFormat.instructions) tmplIns += \`\\nINSTRUCCIONES EXTRA DEL ADMIN: \${matchedFormat.instructions}\`;
                    
                    tmplIns += \`\\n\\nREGLA DE APROBACIÓN (MUY IMPORTANTE):
1. NO entregues una muestra de la planificación ni el texto completo en el chat. Mantén tus respuestas conversacionales y breves.
2. Si faltan datos para completar la plantilla, hazle al profesor las preguntas necesarias para obtenerlos.
3. Una vez tengas todos los datos y la planificación esté mentalmente lista, AL FINAL de tu mensaje pregúntale: "¿Tengo todos los datos listos, deseas que te genere tu documento en Word ahora?". 
4. NO USES la etiqueta [GENERATE_WORD] en este momento.
5. SÓLO usa [GENERATE_WORD] en tu SIGUIENTE mensaje si el profesor te responde que SÍ lo quiere en documento.

CUANDO EL PROFESOR DE LA APROBACIÓN:
Debes responder EXACTAMENTE con este formato, SIN agregar toda la planificación en texto plano:
[GENERATE_WORD]
\\\`\\\`\\\`json
{
  "etiqueta_del_word1": "Valor rellenado por ti",
  "etiqueta_del_word2": "Valor rellenado por ti"
}
\\\`\\\`\\\`
Nota: Asegúrate de adivinar/usar las claves correctas para el JSON según el contexto.\`;
                    MINERD_SYSTEM_PROMPT += tmplIns;
                    if (conversationId) {
                        await getDb().collection('conversations').updateOne(
                            { _id: new (require('mongoose').Types.ObjectId)(conversationId) },
                            { $set: { pendingFormatId: matchedFormat._id.toString() } }
                        );
                    }
                }
            }
        }
        
        if (!hasFormat) {
            MINERD_SYSTEM_PROMPT += \`\\n\\nREGLA ESTRICTA DE DISPONIBILIDAD:\\nSi notas que el usuario te está pidiendo explícitamente que le generes o crees una planificación, examen, rúbrica o cualquier documento estructurado, DEBES OBLIGATORIAMENTE rechazar la creación del mismo con este texto exacto:\\n"Aún no tengo el recurso o diseño activo para esa solicitud. Sin embargo, puedo pasarte con servicio al cliente para poder ayudarte desde el sistema."\\n(Nota: Si solo está haciendo una pregunta conversacional, charlando, o pidiendo consejos/ideas sueltas, respóndele normalmente. Esta prohibición es SOLO para generar documentos formales o planificaciones estructuradas).\`;
        }`;
    
    const finalContent = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
    fs.writeFileSync(file, finalContent);
    console.log('Successfully applied rewrite to chat.js');
}

try {
    refactorWebhook();
    refactorChat();
} catch (e) {
    console.error(e);
}
