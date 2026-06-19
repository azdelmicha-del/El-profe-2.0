const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

try {
    const content = fs.readFileSync('public/uploads/formats/Plantilla_Planificacion_Diaria_Nivel_Inicial_Secuencia_De_Experiencias.docx', 'binary');
    const zip = new PizZip(content);
    
    // Test with default options (which crashes)
    try {
        new Docxtemplater(zip);
        console.log('Default worked?');
    } catch(e) {
        console.log('Default failed as expected.');
    }
    
    // Now test with custom delimiters and options
    const zip2 = new PizZip(content);
    new Docxtemplater(zip2, {
        delimiters: { start: '{{', end: '}}' },
        paragraphLoop: true,
        linebreaks: true
    });
    console.log('SUCCESS WITH CUSTOM DELIMITERS!');
} catch (e) {
    console.log(e.properties ? e.properties.errors : e.message);
}
