// GET /api/me: o Supabase diz de quem é o token; se recusar, é 401
const { responderJson, lerToken } = require('../lib/http');
const { buscarUsuario } = require('../lib/supabase');
const { log } = require('../lib/log');

module.exports = async function me(req, res) {
  const usuario = await buscarUsuario(lerToken(req));
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  log('[me] usuário', usuario.id);
  responderJson(res, 200, { id: usuario.id, email: usuario.email });
};
