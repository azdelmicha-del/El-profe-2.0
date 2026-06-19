const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

const zip = new PizZip();
zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{tag1}}{{tag2}}</w:t></w:r></w:p></w:body></w:document>');
zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');

// FIX ADJACENT TAGS
let xml = zip.file('word/document.xml').asText();
xml = xml.replace(/\}\}(<[^>]*>)*\{\{/g, '}} $1{{');
zip.file('word/document.xml', xml);

try {
    new Docxtemplater(zip);
    console.log('SUCCESS!');
} catch (e) {
    console.log(e.properties ? e.properties.errors : e.message);
}
