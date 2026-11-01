// GET /api/me: o Supabase diz de quem é o token; se recusar, é 401.
// Junto vem o username (public.perfis), para o front dar as boas-vindas.
const { responderJson, lerToken } = require('../lib/http');
const { chamarSupabase, buscarUsuario } = require('../lib/supabase');
const { log } = require('../lib/log');

module.exports = async function me(req, res) {
  const token = lerToken(req);
  const usuario = await buscarUsuario(token);
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  // Sem perfil (cadastro que falhou no username) o username vem null
  const resposta = await chamarSupabase(`/rest/v1/perfis?select=username&id=eq.${usuario.id}`, token);
  const [perfil] = resposta.ok ? await resposta.json() : [];

  log('[me] usuário', usuario.id, perfil?.username || '(sem perfil)');
  responderJson(res, 200, { id: usuario.id, email: usuario.email, username: perfil?.username || null });
};
