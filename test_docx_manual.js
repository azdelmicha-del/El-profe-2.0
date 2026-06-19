const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('public/uploads/formats/Plantilla_Planificacion_Diaria_Nivel_Primario_Secuencia_Didactica.docx', 'binary');
const zip = new PizZip(content);

const doc = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => ''
});

const mockData = {
    fecha: "20-10-2023",
    grado_y_seccion: "Segundo grado",
    maestro_a: "Maria",
    area_curricular: "Lengua Española",
    tiempo: "45 min",
    competencia_especifica_del_grado: "Competencia 1",
    intencion_pedagogica: "Comprender homosintaxis",
    estrategias_y_tecnicas: "Estrategias varias",
    actividades_inicio: "Hacer preguntas iniciales.",
    numero_actividad_inicio: "1",
    recursos_inicio: "Pizarra",
    actividades_desarrollo: "Leer cuento en grupo.",
    numero_actividad_desarrollo: "2",
    recursos_desarrollo: "Lápices",
    actividades_cierre: "Resumir lo aprendido.",
    numero_actividad_cierre: "3",
    recursos_cierre: "Cuadernos",
    actividades_recuperacion_pedagogica: "Extra",
    numero_actividad_recuperacion: "4",
    recursos_recuperacion: "Nada",
    lecturas_recomendadas_o_libro: "Ninguno"
};

doc.render(mockData);

const buf = doc.getZip().generate({ type: 'nodebuffer' });
fs.writeFileSync('public/downloads/test_output.docx', buf);
console.log("Generado public/downloads/test_output.docx con éxito.");
