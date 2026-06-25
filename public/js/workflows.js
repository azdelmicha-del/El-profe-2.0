window.switchWfTab = function(tabName) {
  ['Core', 'Bg', 'Admin'].forEach(t => {
    const btn = document.getElementById('wfTab' + t);
    const view = document.getElementById('wfView' + t);
    if(btn && view) {
      if(t === tabName) {
        btn.style.color = 'var(--primary)';
        btn.style.fontWeight = 'bold';
        btn.style.borderBottom = '2px solid var(--primary)';
        view.style.display = 'block';
      } else {
        btn.style.color = 'var(--text-light)';
        btn.style.fontWeight = 'normal';
        btn.style.borderBottom = '2px solid transparent';
        view.style.display = 'none';
      }
    }
  });
};

window.loadAdminWorkflows = function() {
  const coreList = document.getElementById('workflowsCoreList');
  const bgList = document.getElementById('workflowsBgList');
  if (!coreList || !bgList) return;

  coreList.innerHTML = `
    <div style="background:rgba(16, 185, 129, 0.1); border:1px solid #10b981; border-radius:8px; padding:15px; position:relative;">
      <h4 style="margin:0 0 5px 0; color:#10b981; font-size:15px;">1. Interacción con el Docente (Planixa - Orquestador)</h4>
      <p style="margin:0; font-size:13px; color:var(--text-light);">El docente escribe su petición. Planixa (Orquestador) recopila la información necesaria (grado, materia, tema) y elige el especialista adecuado. Llama a la función interna <code>consultar_especialista</code> con las instrucciones detalladas.</p>
      <div style="position:absolute; bottom:-18px; left:50%; width:2px; height:18px; background:var(--border);"></div>
      <div style="position:absolute; bottom:-23px; left:50%; transform:translateX(-50%); color:var(--text-muted);">⬇️</div>
    </div>
    
    <div style="background:rgba(56, 189, 248, 0.1); border:1px solid #38bdf8; border-radius:8px; padding:15px; position:relative; margin-top:20px;">
      <h4 style="margin:0 0 5px 0; color:#38bdf8; font-size:15px;">2. Especialista Back-Office (Markdown)</h4>
      <p style="margin:0; font-size:13px; color:var(--text-light);">El servidor despierta al <strong>Especialista Pedagógico</strong> (segunda IA) con su prompt técnico + la base de conocimientos MINERD. El especialista genera el contenido pedagógico completo en formato <strong>Markdown</strong> (NO JSON) y agrega <code>[GENERATE_DOCX]</code> al final de su respuesta.</p>
      <div style="position:absolute; bottom:-18px; left:50%; width:2px; height:18px; background:var(--border);"></div>
      <div style="position:absolute; bottom:-23px; left:50%; transform:translateX(-50%); color:var(--text-muted);">⬇️</div>
    </div>

    <div style="background:rgba(245, 158, 11, 0.1); border:1px solid #f59e0b; border-radius:8px; padding:15px; position:relative; margin-top:20px;">
      <h4 style="margin:0 0 5px 0; color:#f59e0b; font-size:15px;">3. Google Docs API → DOCX Profesional</h4>
      <p style="margin:0; font-size:13px; color:var(--text-light);">El servidor toma el Markdown del especialista, lo convierte a HTML con <code>marked</code>. Si el formato seleccionado tiene una <strong>Plantilla HTML personalizada</strong>, se inyecta el contenido donde esté <code>{<!-- -->{content}}</code>. Si no, se usa el estilo genérico <code>buildProfessionalHtml()</code> con membrete MINERD. Luego crea un documento temporal en Google Docs, lo exporta como <code>.docx</code>, borra el doc temporal y entrega el enlace de descarga al docente.</p>
    </div>
  `;

  bgList.innerHTML = `
    <div style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:15px;">
      <h4 style="margin:0 0 5px 0; color:var(--primary); font-size:14px;">☁️ Google Docs API (OAuth)</h4>
      <p style="margin:0; font-size:12px; color:var(--text-muted);">Autenticación OAuth con <code>planixaasistente@gmail.com</code> (Drive 15GB). Crea un documento temporal en Google Docs desde HTML, lo exporta a .docx y lo elimina. Soporta variables de entorno (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) para producción en Render.</p>
    </div>
    <div style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:15px;">
      <h4 style="margin:0 0 5px 0; color:var(--primary); font-size:14px;">📡 Orquestador de Prompts</h4>
      <p style="margin:0; font-size:12px; color:var(--text-muted);">El sistema alimenta constantemente a Planixa y al Especialista con los prompts definidos en la base de datos (System Instructions), asegurando que siempre tengan su comportamiento actualizado.</p>
    </div>
  `;

  const adminList = document.getElementById('workflowsAdminList');
  if (adminList) {
    adminList.innerHTML = `
      <div style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:15px; border-top:3px solid #10b981;">
        <h4 style="margin:0 0 5px 0; color:#10b981; font-size:14px;">💳 Flujo de Pagos y Suscripciones</h4>
        <p style="margin:0; font-size:12px; color:var(--text-muted);">Verifica las transferencias y pagos aprobados. Actualiza automáticamente el estado de la cuenta del usuario, eliminando límites y activando su plan Premium/Ilimitado en la base de datos sin requerir intervención manual constante.</p>
      </div>
      <div style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:15px; border-top:3px solid #3b82f6;">
        <h4 style="margin:0 0 5px 0; color:#3b82f6; font-size:14px;">📢 Difusión Masiva (Broadcast)</h4>
        <p style="margin:0; font-size:12px; color:var(--text-muted);">Un agente encolador que toma los mensajes de anuncio globales y los despacha progresivamente a los WhatsApp de todos los usuarios filtrados, evitando bloqueos por spam o sobrecarga de los servicios de mensajería externa.</p>
      </div>
      <div style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:15px; border-top:3px solid #f59e0b;">
        <h4 style="margin:0 0 5px 0; color:#f59e0b; font-size:14px;">🧠 Gestión de Memoria y Perfil</h4>
        <p style="margin:0; font-size:12px; color:var(--text-muted);">Un flujo paralelo, asíncrono y silencioso donde Planixa analiza el contexto conversacional, extrayendo datos clave (nombre, materia, curso) para actualizar el perfil del usuario dinámicamente, permitiéndole "recordarlo" en el futuro.</p>
      </div>
    `;
  }
};
