const COMPETENCIAS = {
    fundamentales: [
        { code: 'CF1', name: 'Competencia Ética y Ciudadana', desc: 'Actúa con responsabilidad, respeto y solidaridad en su entorno.' },
        { code: 'CF2', name: 'Competencia Comunicativa', desc: 'Se expresa y comprende mensajes orales, escritos y corporales.' },
        { code: 'CF3', name: 'Competencia Pensamiento Lógico-Creativo', desc: 'Resuelve problemas usando el razonamiento lógico y la creatividad.' },
        { code: 'CF4', name: 'Competencia Resolución de Problemas', desc: 'Identifica y resuelve situaciones problemáticas de su contexto.' },
        { code: 'CF5', name: 'Competencia Científica y Tecnológica', desc: 'Usa conocimientos científicos y tecnológicos para entender su entorno.' },
        { code: 'CF6', name: 'Competencia Ambiental y de la Salud', desc: 'Promueve el cuidado del medio ambiente y su salud.' },
        { code: 'CF7', name: 'Competencia Desarrollo Personal y Espiritual', desc: 'Se conoce a sí mismo y desarrolla su proyecto de vida.' },
    ],
    areas: {
        'Matemática': ['Razonamiento lógico-matemático', 'Comunicación matemática', 'Modelación matemática', 'Resolución de problemas'],
        'Lengua Española': ['Comprensión oral', 'Comprensión escrita', 'Producción oral', 'Producción escrita'],
        'Ciencias Sociales': ['Investigación social', 'Interpretación social', 'Participación social'],
        'Ciencias de la Naturaleza': ['Indagación científica', 'Uso de evidencias', 'Comunicación científica'],
    }
};

module.exports = function (app) {

    app.get('/api/competencias', (req, res) => { res.json(COMPETENCIAS); });

};
