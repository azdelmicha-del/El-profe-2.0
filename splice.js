const fs = require('fs');

const webhookCode = fs.readFileSync('src/routes/webhook.js', 'utf8');
const newRouterCode = fs.readFileSync('new_router.js', 'utf8');

const lines = webhookCode.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('let routerPromise = null;')) {
        startIdx = i;
    }
    if (lines[i].includes('// SANITIZE LEAKED PROMPT DIRECTIVES')) {
        endIdx = i;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    const before = lines.slice(0, startIdx).join('\n');
    const after = lines.slice(endIdx).join('\n');
    const newFileContent = before + '\n' + newRouterCode + '\n' + after;
    fs.writeFileSync('src/routes/webhook.js', newFileContent);
    console.log('Reemplazo exitoso!');
} else {
    console.log('No se encontraron los indices', startIdx, endIdx);
}
