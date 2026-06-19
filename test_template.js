const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

try {
    const content = fs.readFileSync('public/uploads/formats/Plantilla_Planificacion_Diaria_Nivel_Inicial_Secuencia_De_Experiencias.docx', 'binary');
    const zip = new PizZip(content);
    new Docxtemplater(zip);
    console.log('SUCCESS');
} catch (e) {
    console.log(e.properties ? e.properties.errors : e.message);
}
