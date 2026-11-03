// GET /api/ranking?categoria=IA: os 10 melhores jogadores do tema.
// Lê a view public.ranking, que já traz a melhor partida de cada jogador
// por tema; aqui só filtra o tema, ordena e limita.
const { responderJson, responderErro } = require('../lib/http');
const { autenticar } = require('../lib/supabase');
const { log } = require('../lib/log');

const LIMITE = 10;

module.exports = async function ranking(req, res) {
  const sessao = await autenticar(req, res);
  if (!sessao) return;
  const { supabase } = sessao;

  const categoria = new URL(req.url, 'http://localhost').searchParams.get('categoria') || '';
  // Empate em pontos: quem fez primeiro fica na frente
  const { data: jogadores, error } = await supabase
    .from('ranking')
    .select('username, pontos, acertos, respondidas')
    .eq('categoria', categoria)
    .order('pontos', { ascending: false })
    .order('criada_em', { ascending: true })
    .limit(LIMITE);

  if (error) {
    log('[ranking] Supabase recusou:', error.code || '', error.message || '');
    return responderErro(res, 400, 'ranking_not_loaded', 'Could not load the ranking');
  }

  responderJson(res, 200, { categoria, jogadores });
};
