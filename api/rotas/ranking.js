// GET /api/ranking?categoria=IA: os 10 melhores jogadores do tema.
// Lê a view public.ranking, que já traz a melhor partida de cada jogador
// por tema; aqui só filtra o tema, ordena e limita.
const { responderJson, lerToken } = require('../lib/http');
const { chamarSupabase, buscarUsuario } = require('../lib/supabase');
const { log } = require('../lib/log');

const LIMITE = 10;

module.exports = async function ranking(req, res) {
  const token = lerToken(req);
  const usuario = await buscarUsuario(token);
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  const categoria = new URL(req.url, 'http://localhost').searchParams.get('categoria') || '';
  // Empate em pontos: quem fez primeiro fica na frente
  const resposta = await chamarSupabase(
    `/rest/v1/ranking?select=username,pontos,acertos,respondidas` +
      `&categoria=eq.${encodeURIComponent(categoria)}&order=pontos.desc,criada_em.asc&limit=${LIMITE}`,
    token
  );

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    log('[ranking] Supabase recusou:', resposta.status, erro.code || '', erro.message || '');
    return responderJson(res, 400, { erro: 'Não foi possível carregar o ranking.' });
  }

  responderJson(res, 200, { categoria, jogadores: await resposta.json() });
};
