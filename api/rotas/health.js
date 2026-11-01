// GET /api/health: confirma que o servidor está no ar
const { responderJson } = require('../lib/http');

module.exports = function health(req, res) {
  responderJson(res, 200, { status: 'ok' });
};
