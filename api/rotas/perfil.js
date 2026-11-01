// /api/perfil: o username do usuário logado em public.perfis.
// O id vem sempre do próprio token e a RLS só deixa criar/editar o próprio.
//   GET   -> username + melhor partida em cada tema
//   POST  -> cria o username (cadastro)
//   PATCH -> troca o username (tela de perfil)
const { responderJson, lerToken, lerJson } = require('../lib/http');
const { chamarSupabase, buscarUsuario } = require('../lib/supabase');
const { log } = require('../lib/log');

// Recusa do Supabase ao gravar username -> resposta clara para o front.
// Códigos do Postgres: 23505 = valor repetido, 23514/23502 = check/not null
async function responderErroUsername(res, resposta, rota) {
  const erro = await resposta.json().catch(() => ({}));
  log(`[${rota}] Supabase recusou:`, resposta.status, erro.code || '', erro.message || '');
  if (resposta.status === 401) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });
  if (erro.code === '23505') return responderJson(res, 409, { erro: 'Este username já está em uso.' });
  if (erro.code === '23514' || erro.code === '23502') {
    return responderJson(res, 400, { erro: 'O username precisa ter de 3 a 20 caracteres.' });
  }
  responderJson(res, 400, { erro: 'Não foi possível salvar o username.' });
}

async function buscar(req, res) {
  const token = lerToken(req);
  const usuario = await buscarUsuario(token);
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  const resposta = await chamarSupabase(`/rest/v1/perfis?select=username&id=eq.${usuario.id}`, token);
  const [perfil] = resposta.ok ? await resposta.json() : [];
  if (!perfil) return responderJson(res, 404, { erro: 'Sua conta está sem username.' });

  // A view ranking já guarda a melhor partida de cada jogador por tema
  const recordes = await chamarSupabase(
    `/rest/v1/ranking?select=categoria,pontos,acertos,respondidas&username=eq.${encodeURIComponent(perfil.username)}`,
    token
  );
  if (!recordes.ok) {
    log('[perfil] Supabase recusou os recordes:', recordes.status);
    return responderJson(res, 400, { erro: 'Não foi possível carregar o perfil.' });
  }

  responderJson(res, 200, { username: perfil.username, recordes: await recordes.json() });
}

async function criar(req, res) {
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
  if (!resposta.ok) return responderErroUsername(res, resposta, 'perfil');

  log('[perfil] criado:', username);
  responderJson(res, 201, { username });
}

async function alterar(req, res) {
  const token = lerToken(req);
  const usuario = await buscarUsuario(token);
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  const username = String((await lerJson(req)).username || '').trim();
  log('[perfil] usuário', usuario.id, 'trocando username para:', username);
  const resposta = await chamarSupabase(`/rest/v1/perfis?id=eq.${usuario.id}`, token, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ username })
  });
  if (!resposta.ok) return responderErroUsername(res, resposta, 'perfil');

  // Nenhuma linha alterada = a conta não tem perfil
  const [perfil] = await resposta.json();
  if (!perfil) return responderJson(res, 404, { erro: 'Sua conta está sem username.' });

  log('[perfil] username alterado:', perfil.username);
  responderJson(res, 200, { username: perfil.username });
}

module.exports = { buscar, criar, alterar };
