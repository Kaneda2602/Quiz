// Acesso ao Supabase com o supabase-js. O back nunca faz login: ele repassa o
// token do usuário e age como ele, assim as políticas RLS valem para quem está logado.
const { createClient, isAuthRetryableFetchError } = require('@supabase/supabase-js');
const { responderErro, lerToken } = require('./http');
const { log } = require('./log');

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

// Um cliente por requisição com a anon key + token do usuário (nunca a service_role).
// Sem sessão guardada: no servidor cada requisição traz o próprio token
function criarCliente(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

// Pergunta ao Supabase de quem é o token. Devolve o usuário ou null se for recusado.
async function buscarUsuario(supabase, token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (data.user) return data.user;

  // Supabase fora do ar não é token ruim: vira 502 no server.js, não 401
  if (isAuthRetryableFetchError(error)) throw error;
  log('Supabase recusou o token:', error?.status || '', error?.code || error?.message || '');
  return null;
}

// Cliente + usuário da requisição. Token recusado: já responde 401 e devolve null
async function autenticar(req, res) {
  const token = lerToken(req);
  const supabase = criarCliente(token);
  const usuario = await buscarUsuario(supabase, token);
  if (!usuario) {
    responderErro(res, 401, 'invalid_session', 'Invalid or expired session');
    return null;
  }
  return { supabase, usuario };
}

module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY, autenticar };
