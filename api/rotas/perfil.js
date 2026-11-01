// POST /api/perfil: cria o username do usuário logado em public.perfis.
// O id vem do próprio token (default auth.uid()) e a RLS só deixa criar o próprio.
const { responderJson, lerToken, lerJson } = require('../lib/http');
const { chamarSupabase, buscarUsuario } = require('../lib/supabase');
const { log } = require('../lib/log');

module.exports = async function perfil(req, res) {
  const token = lerToken(req);
  // Confirma o usuário antes de gravar: token ruim vira 401 claro, não erro de RLS
  const usuario = await buscarUsuario(token);
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  const { username } = await lerJson(req);
  log('[perfil] usuário', usuario.id, `(${usuario.role})`, 'pedindo username:', username);
  const resposta = await chamarSupabase('/rest/v1/perfis', token, {
    method: 'POST',
    body: JSON.stringify({ username })
  });
  if (resposta.ok) {
    log('[perfil] criado:', username);
    return responderJson(res, 201, { username });
  }

  // Códigos do Postgres: 23505 = valor repetido, 23514/23502 = check/not null
  const erro = await resposta.json().catch(() => ({}));
  log('[perfil] Supabase recusou:', resposta.status, erro.code || '', erro.message || '');
  if (resposta.status === 401) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });
  if (erro.code === '23505') return responderJson(res, 409, { erro: 'Este username já está em uso.' });
  if (erro.code === '23514' || erro.code === '23502') {
    return responderJson(res, 400, { erro: 'O username precisa ter de 3 a 20 caracteres.' });
  }
  responderJson(res, 400, { erro: 'Não foi possível salvar o username.' });
};
