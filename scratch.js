const fs = require('fs');
['src/routes/webhook.js', 'src/routes/chat.js'].forEach(f => {
    let code = fs.readFileSync(f, 'utf8');
    code = code.replace(/type: 'SISTEMA'/g, "type: 'PLANIXA ASISTENTE'");
    fs.writeFileSync(f, code);
});
console.log('Replaced successfully');
