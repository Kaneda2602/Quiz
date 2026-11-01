// GET /api/config: URL e anon key do Supabase para o front.
// A anon key é pública por design; assim o front não tem chaves fixas no código.
const { responderJson } = require('../lib/http');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../lib/supabase');

module.exports = function config(req, res) {
  responderJson(res, 200, { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
};
