module.exports = function (app) {
    app.get('/healthz', (req, res) => res.sendStatus(200));
};
