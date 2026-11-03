// GET /api/me: o Supabase diz de quem é o token; se recusar, é 401.
// Junto vem o username (public.perfis), para o front dar as boas-vindas.
const { responderJson } = require('../lib/http');
const { autenticar } = require('../lib/supabase');
const { log } = require('../lib/log');

module.exports = async function me(req, res) {
  const sessao = await autenticar(req, res);
  if (!sessao) return;
  const { supabase, usuario } = sessao;

  // Sem perfil (cadastro que falhou no username) o username vem null
  const { data: perfil } = await supabase.from('perfis').select('username').eq('id', usuario.id).maybeSingle();

  log('[me] usuário', usuario.id, perfil?.username || '(sem perfil)');
  responderJson(res, 200, { id: usuario.id, email: usuario.email, username: perfil?.username || null });
};
