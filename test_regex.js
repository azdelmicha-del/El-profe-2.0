const fs = require('fs');
const PizZip = require('pizzip');
const content = fs.readFileSync('public/uploads/formats/Plantilla_Planificacion_Diaria_Nivel_Inicial_Secuencia_De_Experiencias.docx', 'binary');
const zip = new PizZip(content);
const rawXml = zip.files['word/document.xml'].asText();
const pureText = rawXml.replace(/<[^>]+>/g, '');
console.log(pureText.match(/\{\{([^}]+)\}\}/g) || []);
