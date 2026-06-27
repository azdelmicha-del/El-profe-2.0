require('dotenv').config();
const { connectMongo, getDb } = require('./src/db');

// HTML de la Plantilla Etapa VI — Planificación de Clase Diaria MINERD 2025-2026
const ETAPA_VI_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { size: A4; margin: 15mm 12mm; }
body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.3; color: #000; }
h1.titulo-principal { font-size: 11pt; font-weight: bold; text-align: center; margin: 0 0 4px 0; border-bottom: 2px solid #1a3a6b; padding-bottom: 4px; }
h2.subtitulo { font-size: 10pt; font-weight: bold; text-align: center; color: #1a3a6b; margin: 0 0 8px 0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
th { background-color: #1a3a6b; color: white; font-weight: bold; padding: 4px 6px; font-size: 8.5pt; text-align: left; border: 1px solid #1a3a6b; }
td { border: 1px solid #aaa; padding: 4px 6px; font-size: 8.5pt; vertical-align: top; }
td.label { background-color: #dce6f1; font-weight: bold; width: 18%; white-space: nowrap; }
td.valor { width: 32%; }
.seccion-header { background-color: #1a3a6b; color: white; font-weight: bold; padding: 4px 6px; font-size: 9pt; margin-top: 6px; margin-bottom: 0; }
.momento-header { background-color: #2e75b6; color: white; font-weight: bold; text-align: center; padding: 3px; font-size: 8.5pt; }
ul { margin: 0; padding-left: 14px; }
li { margin-bottom: 2px; }
.checkbox-list { list-style: none; padding-left: 0; margin: 0; }
.checkbox-list li { margin-bottom: 2px; }
</style>
</head>
<body>

<h1 class="titulo-principal">Ministerio de Educación de la República Dominicana</h1>
<h2 class="subtitulo">Planificación de Clase Diaria — Etapa VI · EDD 2025-2026</h2>

<!-- DATOS GENERALES -->
<div class="seccion-header">Datos Generales</div>
<table>
  <tr>
    <td class="label">Nombre completo</td><td class="valor">{{nombre_completo_docente}}</td>
    <td class="label">Cédula</td><td class="valor">{{cedula}}</td>
  </tr>
  <tr>
    <td class="label">Regional</td><td class="valor">{{regional}}</td>
    <td class="label">Distrito</td><td class="valor">{{distrito}}</td>
  </tr>
  <tr>
    <td class="label">Centro Educativo</td><td class="valor">{{centro_educativo}}</td>
    <td class="label">Código del Centro</td><td class="valor">{{codigo_centro}}</td>
  </tr>
  <tr>
    <td class="label">Nivel / Subsistema</td><td class="valor">{{nivel_subsistema}}</td>
    <td class="label">Ciclo</td><td class="valor">{{ciclo}}</td>
  </tr>
  <tr>
    <td class="label">Grado y Sección</td><td class="valor">{{grado_y_seccion}}</td>
    <td class="label">Modalidad</td><td class="valor">{{modalidad}}</td>
  </tr>
  <tr>
    <td class="label">Área</td><td class="valor">{{area_curricular}}</td>
    <td class="label">Asignatura</td><td class="valor">{{asignatura}}</td>
  </tr>
  <tr>
    <td class="label">Fecha</td><td class="valor">{{fecha}}</td>
    <td class="label">Duración</td><td class="valor">{{duracion}}</td>
  </tr>
</table>

<!-- ESPECIFICACIÓN CURRICULAR -->
<div class="seccion-header">Especificación Curricular</div>
<table>
  <tr>
    <td class="label">Unidad de Aprendizaje</td><td class="valor">{{unidad_de_aprendizaje}}</td>
    <td class="label">Semana</td><td style="width:10%">{{semana}}</td>
    <td class="label">N°</td><td style="width:8%">{{numero_unidad}}</td>
  </tr>
  <tr>
    <td class="label">Actividad / Tema</td><td colspan="5">{{actividad_o_tema_del_dia}}</td>
  </tr>
  <tr>
    <td class="label">Situación de Aprendizaje</td><td colspan="5">{{situacion_de_aprendizaje_contextualizada}}</td>
  </tr>
</table>

<!-- COMPETENCIAS E INDICADORES -->
<div class="seccion-header">Competencias e Indicadores de Logro</div>
<table>
  <tr>
    <td class="label" style="width:20%">Competencias Fundamentales</td>
    <td style="width:30%">
      <ul class="checkbox-list">
        <li>{{check_etica}} Ética y Ciudadana</li>
        <li>{{check_comunicativa}} Comunicativa</li>
        <li>{{check_pensamiento}} Pensamiento Lógico, Creativo y Crítico</li>
        <li>{{check_resolucion}} Resolución de Problemas</li>
        <li>{{check_cientifica}} Científica y Tecnológica</li>
        <li>{{check_ambiental}} Ambiental y de la Salud</li>
        <li>{{check_desarrollo}} Desarrollo Personal y Espiritual</li>
      </ul>
    </td>
    <td class="label" style="width:20%">Competencias Específicas</td>
    <td>{{competencias_especificas_del_grado_y_area}}</td>
  </tr>
  <tr>
    <td class="label">Indicadores de Logro</td>
    <td colspan="3">{{indicadores_de_logro_seleccionados_del_curriculo}}</td>
  </tr>
</table>

<!-- CONTENIDOS -->
<div class="seccion-header">Contenidos</div>
<table>
  <tr>
    <th>Conceptuales</th>
    <th>Procedimentales</th>
    <th>Actitudinales</th>
  </tr>
  <tr>
    <td>{{contenidos_conceptuales_html_list}}</td>
    <td>{{contenidos_procedimentales_html_list}}</td>
    <td>{{contenidos_actitudinales_html_list}}</td>
  </tr>
</table>

<!-- INTENCIÓN PEDAGÓGICA Y ESTRATEGIA -->
<div class="seccion-header">Intención Pedagógica y Estrategia</div>
<table>
  <tr>
    <td class="label">Intención Pedagógica</td>
    <td>{{intencion_pedagogica_del_dia}}</td>
  </tr>
  <tr>
    <td class="label">Estrategia / Metodología</td>
    <td>{{estrategia_metodologia}}</td>
  </tr>
</table>

<!-- DESARROLLO DE LA CLASE -->
<div class="seccion-header">Desarrollo de la Clase</div>
<table>
  <tr>
    <th>Momento / Tiempo</th>
    <th>Actividades</th>
    <th>Evidencias</th>
    <th>Evaluación</th>
    <th>Recursos</th>
  </tr>
  <tr>
    <td class="momento-header" style="background:#2e75b6;color:white;font-weight:bold;text-align:center;">INICIO<br>{{tiempo_inicio}} min</td>
    <td>{{actividades_de_inicio_html_list}}</td>
    <td>{{evidencias_inicio}}</td>
    <td>Tipo: {{tipo_eval_inicio}}<br>Técnica: {{tecnica_inicio}}<br>Instrumento: {{instrumento_inicio}}</td>
    <td>{{recursos_inicio}}</td>
  </tr>
  <tr>
    <td style="background:#2e75b6;color:white;font-weight:bold;text-align:center;">DESARROLLO<br>{{tiempo_desarrollo}} min</td>
    <td>{{actividades_de_desarrollo_html_list}}</td>
    <td>{{evidencias_desarrollo}}</td>
    <td>Tipo: {{tipo_eval_desarrollo}}<br>Técnica: {{tecnica_desarrollo}}<br>Instrumento: {{instrumento_desarrollo}}</td>
    <td>{{recursos_desarrollo}}</td>
  </tr>
  <tr>
    <td style="background:#2e75b6;color:white;font-weight:bold;text-align:center;">CIERRE<br>{{tiempo_cierre}} min</td>
    <td>{{actividades_de_cierre_html_list}}</td>
    <td>{{evidencias_cierre}}</td>
    <td>Tipo: {{tipo_eval_cierre}}<br>Técnica: {{tecnica_cierre}}<br>Instrumento: {{instrumento_cierre}}</td>
    <td>{{recursos_cierre}}</td>
  </tr>
</table>

<!-- METACOGNICIÓN -->
<div class="seccion-header">Metacognición</div>
<table>
  <tr>
    <td class="label">Preguntas Metacognitivas</td>
    <td>{{preguntas_metacognitivas_del_cierre}}</td>
  </tr>
</table>

<!-- ADAPTACIONES (NEAE) -->
<div class="seccion-header">Adaptaciones (NEAE)</div>
<table>
  <tr>
    <th>De acceso</th>
    <th>Metodológicas</th>
    <th>De evaluación</th>
  </tr>
  <tr>
    <td>{{adaptaciones_de_acceso}}</td>
    <td>{{adaptaciones_metodologicas}}</td>
    <td>{{adaptaciones_de_evaluacion}}</td>
  </tr>
</table>

<!-- RESUMEN DE EVALUACIÓN Y OBSERVACIONES -->
<div class="seccion-header">Resumen de Evaluación y Observaciones</div>
<table>
  <tr>
    <th>Técnicas</th>
    <th>Instrumentos</th>
    <th>Observaciones</th>
  </tr>
  <tr>
    <td>
      <ul class="checkbox-list">
        <li>{{check_tecnica_observacion}} Observación directa</li>
        <li>{{check_tecnica_producciones}} Análisis de producciones</li>
        <li>{{check_tecnica_orales}} Intercambios orales</li>
        <li>{{check_tecnica_respuestas}} Preguntas y respuestas</li>
        <li>{{check_tecnica_cuadernos}} Revisión de cuadernos</li>
        <li>Otro: {{otra_tecnica}}</li>
      </ul>
    </td>
    <td>
      <ul class="checkbox-list">
        <li>{{check_inst_cotejo}} Lista de cotejo</li>
        <li>{{check_inst_rubrica}} Rúbrica analítica</li>
        <li>{{check_inst_valoracion}} Escala de valoración</li>
        <li>{{check_inst_obs}} Registro de observación</li>
        <li>{{check_inst_anecdotico}} Registro anecdótico</li>
        <li>Otro: {{otro_instrumento}}</li>
      </ul>
    </td>
    <td>
      <strong>Generales:</strong> {{observaciones_generales}}<br><br>
      <strong>Necesidades de refuerzo:</strong> {{necesidades_de_refuerzo}}<br><br>
      <strong>Seguimiento pedagógico:</strong> {{seguimiento_pedagogico}}
    </td>
  </tr>
</table>

</body>
</html>`;

// Lista de todas las variables de la plantilla (para el prompt del Especialista)
const ETAPA_VI_VARIABLES = [
    "nombre_completo_docente","cedula","regional","distrito","centro_educativo","codigo_centro",
    "nivel_subsistema","ciclo","grado_y_seccion","modalidad","area_curricular","asignatura",
    "fecha","duracion","unidad_de_aprendizaje","semana","numero_unidad",
    "actividad_o_tema_del_dia","situacion_de_aprendizaje_contextualizada",
    "check_etica","check_comunicativa","check_pensamiento","check_resolucion",
    "check_cientifica","check_ambiental","check_desarrollo",
    "competencias_especificas_del_grado_y_area","indicadores_de_logro_seleccionados_del_curriculo",
    "contenidos_conceptuales_html_list","contenidos_procedimentales_html_list","contenidos_actitudinales_html_list",
    "intencion_pedagogica_del_dia","estrategia_metodologia",
    "tiempo_inicio","actividades_de_inicio_html_list","evidencias_inicio",
    "tipo_eval_inicio","tecnica_inicio","instrumento_inicio","recursos_inicio",
    "tiempo_desarrollo","actividades_de_desarrollo_html_list","evidencias_desarrollo",
    "tipo_eval_desarrollo","tecnica_desarrollo","instrumento_desarrollo","recursos_desarrollo",
    "tiempo_cierre","actividades_de_cierre_html_list","evidencias_cierre",
    "tipo_eval_cierre","tecnica_cierre","instrumento_cierre","recursos_cierre",
    "preguntas_metacognitivas_del_cierre",
    "adaptaciones_de_acceso","adaptaciones_metodologicas","adaptaciones_de_evaluacion",
    "check_tecnica_observacion","check_tecnica_producciones","check_tecnica_orales",
    "check_tecnica_respuestas","check_tecnica_cuadernos","otra_tecnica",
    "check_inst_cotejo","check_inst_rubrica","check_inst_valoracion","check_inst_obs",
    "check_inst_anecdotico","otro_instrumento",
    "observaciones_generales","necesidades_de_refuerzo","seguimiento_pedagogico"
];

async function run() {
    await connectMongo();
    const db = getDb();
    
    // Verificar si ya existe esta plantilla
    const existing = await db.collection('doc_formats').findOne({ type: 'Plantilla_Planificacion_Diaria_Primaria_EtapaVI_EDD' });
    
    if (existing) {
        // Actualizar
        await db.collection('doc_formats').updateOne(
            { _id: existing._id },
            { $set: { htmlTemplate: ETAPA_VI_HTML_TEMPLATE, variables: ETAPA_VI_VARIABLES, updatedAt: new Date() } }
        );
        console.log('✅ Plantilla Etapa VI ACTUALIZADA en BD. ID:', existing._id.toString());
    } else {
        // Crear nueva
        const result = await db.collection('doc_formats').insertOne({
            type: 'Plantilla_Planificacion_Diaria_Primaria_EtapaVI_EDD',
            description: 'Planificación de Clase Diaria — Etapa VI · EDD 2025-2026 (Primaria)',
            htmlTemplate: ETAPA_VI_HTML_TEMPLATE,
            variables: ETAPA_VI_VARIABLES,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('✅ Plantilla Etapa VI CREADA en BD. ID:', result.insertedId.toString());
    }
    
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
