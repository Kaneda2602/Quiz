// /api/perfil: o username do usuário logado em public.perfis.
// O id vem sempre do próprio token e a RLS só deixa criar/editar o próprio.
//   GET   -> username + melhor partida em cada tema
//   POST  -> cria o username (cadastro)
//   PATCH -> troca o username (tela de perfil)
const { responderJson, responderErro, lerJson } = require('../lib/http');
const { autenticar } = require('../lib/supabase');
const { log } = require('../lib/log');

// Recusa do Supabase ao gravar username -> resposta clara para o front.
// Códigos do Postgres: 23505 = valor repetido, 23514/23502 = check/not null
function responderErroUsername(res, error, status, rota) {
  log(`[${rota}] Supabase recusou:`, status, error.code || '', error.message || '');
  if (status === 401) return responderErro(res, 401, 'invalid_session', 'Invalid or expired session');
  if (error.code === '23505') return responderErro(res, 409, 'username_taken', 'Username is already taken');
  if (error.code === '23514' || error.code === '23502') {
    return responderErro(res, 400, 'username_invalid_length', 'Username must be 3 to 20 characters');
  }
  responderErro(res, 400, 'username_not_saved', 'Could not save the username');
}

async function buscar(req, res) {
  const sessao = await autenticar(req, res);
  if (!sessao) return;
  const { supabase, usuario } = sessao;

  const { data: perfil } = await supabase.from('perfis').select('username').eq('id', usuario.id).maybeSingle();
  if (!perfil) return responderErro(res, 404, 'profile_missing', 'Account has no username');

  // A view ranking já guarda a melhor partida de cada jogador por tema
  const { data: recordes, error } = await supabase
    .from('ranking')
    .select('categoria, pontos, acertos, respondidas')
    .eq('username', perfil.username);
  if (error) {
    log('[perfil] Supabase recusou os recordes:', error.code || '', error.message || '');
    return responderErro(res, 400, 'profile_not_loaded', 'Could not load the profile');
  }

  responderJson(res, 200, { username: perfil.username, recordes });
}

async function criar(req, res) {
  // Confirma o usuário antes de gravar: token ruim vira 401 claro, não erro de RLS
  const sessao = await autenticar(req, res);
  if (!sessao) return;
  const { supabase, usuario } = sessao;

  const { username } = await lerJson(req);
  log('[perfil] usuário', usuario.id, `(${usuario.role})`, 'pedindo username:', username);
  const { error, status } = await supabase.from('perfis').insert({ username });
  if (error) return responderErroUsername(res, error, status, 'perfil');

  log('[perfil] criado:', username);
  responderJson(res, 201, { username });
}

async function alterar(req, res) {
  const sessao = await autenticar(req, res);
  if (!sessao) return;
  const { supabase, usuario } = sessao;

  const username = String((await lerJson(req)).username || '').trim();
  log('[perfil] usuário', usuario.id, 'trocando username para:', username);
  const { data, error, status } = await supabase
    .from('perfis')
    .update({ username })
    .eq('id', usuario.id)
    .select('username');
  if (error) return responderErroUsername(res, error, status, 'perfil');

  // Nenhuma linha alterada = a conta não tem perfil
  const [perfil] = data;
  if (!perfil) return responderErro(res, 404, 'profile_missing', 'Account has no username');

  log('[perfil] username alterado:', perfil.username);
  responderJson(res, 200, { username: perfil.username });
}

module.exports = { buscar, criar, alterar };
