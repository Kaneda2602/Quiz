// Acesso ao Supabase. O back nunca faz login: ele repassa o token do usuário
// e age como ele, assim as políticas RLS valem para quem está logado.

const { log } = require('./log');

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

// Toda chamada usa a anon key + token do usuário (nunca a service_role)
function chamarSupabase(caminho, token, opcoes = {}) {
  return fetch(`${SUPABASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...opcoes.headers // ex.: Prefer: return=representation
    }
  });
}

// Pergunta ao Supabase de quem é o token. Devolve o usuário ou null se for recusado.
async function buscarUsuario(token) {
  const resposta = await chamarSupabase('/auth/v1/user', token);
  if (resposta.ok) return resposta.json();

  const erro = await resposta.json().catch(() => ({}));
  log('Supabase recusou o token:', resposta.status, erro.error_code || erro.msg || '');
  return null;
}

module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY, chamarSupabase, buscarUsuario };
