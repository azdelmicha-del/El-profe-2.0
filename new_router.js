                // ══════════════════════════════════════════════════════════
                // NUEVA ARQUITECTURA: ORQUESTADOR MAESTRO (PLANIXA ASISTENTE)
                // ══════════════════════════════════════════════════════════
                
                profileWatcher(); // Ejecutar extracción de perfil de fondo

                const availableSpecialists = prompts.filter(p => p._id.toString() !== defaultPrompt._id.toString());
                const availableFormats = formats.map(f => f.type).join(', ');

                MINERD_SYSTEM_PROMPT = defaultPrompt.content + `
                
DATOS DEL PROFESOR:
Nombre: ${user.name || 'Profe'}
Grado: ${user.grade || 'No especificado'}
Área: ${user.area || 'No especificada'}
Centro Educativo: ${user.school || 'No especificado'}

REGLA DE PERFIL: Si el profesor expresa gusto/preferencia, usa la etiqueta [MEMORIA: pref]. Si el profesor dice su nombre/grado/área/escuela, usa la etiqueta [UPDATE_PROFILE: {"name":"...", "grade":"..."}].

PLANTILLAS DISPONIBLES: ${availableFormats}.
ESPECIALISTAS DISPONIBLES (BACK-OFFICE):
${availableSpecialists.map(p => `- ID: ${p._id.toString()} | ${p.name} | Cuándo usar: ${p.description}`).join('\n')}

TU ROL (EL ORQUESTADOR):
Eres el único que interactúa con el profesor. Si el profesor pide generar una planificación, unidad, rúbrica, o cualquier estructura técnica, DEBES delegar usando la herramienta "consultar_especialista" pasando el ID adecuado y todas las instrucciones necesarias (tema, grado, etc.). NO intentes redactar la planificación tú mismo.
Una vez que el especialista te devuelva la planificación cruda, audítala. Si está correcta, preséntala al profesor de manera amigable (usando el separador ||| para dividir tu saludo de la estructura, por ejemplo).
Si el documento final requiere exportarse a Word, agrega al final de tu mensaje la etiqueta [GENERATE_DOCX] o [GENERATE_WORD] y el bloque \`\`\`json con los datos requeridos. NUNCA inventes enlaces de descarga web [Descargar](#).`;

                const systemWithRefs = MINERD_SYSTEM_PROMPT + refBlock;
                const messages = [
                    { role: 'system', content: systemWithRefs },
                    ...historyMessages,
                    { role: 'user', content: text }
                ];

                const tools = [
                    {
                        type: "function",
                        function: {
                            name: "consultar_especialista",
                            description: "Delega la creación de una planificación o estructura a un Especialista técnico en el back-office. Usa esto siempre que el profesor pida crear un material.",
                            parameters: {
                                type: "object",
                                properties: {
                                    especialista_id: { type: "string", description: "El ID del especialista seleccionado." },
                                    instrucciones_detalladas: { type: "string", description: "Instrucciones detalladas y explícitas con TODO lo que el especialista necesita redactar (tema, grado, área, etc)." }
                                },
                                required: ["especialista_id", "instrucciones_detalladas"]
                            }
                        }
                    }
                ];

                let reply = '⚠️ Ocurrió un error en el Orquestador.';

                const orquestadorRes = await fetch('https://api.openai.com/v1/chat/completions', {
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

                if (orquestadorRes.ok) {
                    const orqData = await orquestadorRes.json();
                    if (orqData.usage) await logApiUsage(user._id.toString(), 'WhatsApp: Orquestador', 'gpt-4o', orqData.usage);
                    
                    const responseMessage = orqData.choices[0].message;

                    if (responseMessage.tool_calls) {
                        messages.push(responseMessage);
                        
                        for (const toolCall of responseMessage.tool_calls) {
                            if (toolCall.function.name === 'consultar_especialista') {
                                const args = JSON.parse(toolCall.function.arguments);
                                const specId = args.especialista_id;
                                const specInst = args.instrucciones_detalladas;
                                
                                const specPromptDoc = prompts.find(p => p._id.toString() === specId);
                                if (specPromptDoc) {
                                    req.app.emit('system_log', { type: 'ESPECIALISTA', color: '#f59e0b', title: 'Delegando al Back-Office', details: specPromptDoc.name });
                                    
                                    const specRes = await fetch('https://api.openai.com/v1/chat/completions', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                                        body: JSON.stringify({
                                            model: 'gpt-4o', 
                                            messages: [
                                                { role: 'system', content: specPromptDoc.content + refBlock },
                                                { role: 'user', content: specInst }
                                            ],
                                            max_tokens: 3500,
                                            temperature: 0.2
                                        })
                                    });

                                    let specResultText = 'Error en especialista.';
                                    if (specRes.ok) {
                                        const sData = await specRes.json();
                                        if (sData.usage) await logApiUsage(user._id.toString(), 'WhatsApp: Especialista Back', 'gpt-4o', sData.usage);
                                        specResultText = sData.choices[0].message.content;
                                    }

                                    messages.push({
                                        tool_call_id: toolCall.id,
                                        role: "tool",
                                        name: "consultar_especialista",
                                        content: specResultText
                                    });
                                } else {
                                    messages.push({
                                        tool_call_id: toolCall.id,
                                        role: "tool",
                                        name: "consultar_especialista",
                                        content: "Error: Especialista no encontrado."
                                    });
                                }
                            }
                        }

                        req.app.emit('system_log', { type: 'ORQUESTADOR', color: '#3b82f6', title: 'Auditando Trabajo', details: 'El Orquestador está revisando lo entregado.' });
                        const finalRes = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                            body: JSON.stringify({
                                model: 'gpt-4o',
                                messages: messages,
                                max_tokens: 3500,
                                temperature: 0.4
                            })
                        });

                        if (finalRes.ok) {
                            const fData = await finalRes.json();
                            if (fData.usage) await logApiUsage(user._id.toString(), 'WhatsApp: Orquestador Final', 'gpt-4o', fData.usage);
                            reply = fData.choices[0].message.content.trim();
                        }
                    } else {
                        reply = responseMessage.content?.trim() || '';
                    }
                }
