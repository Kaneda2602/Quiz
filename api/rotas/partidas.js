// POST /api/partidas { categoria: "IA" }: começa uma partida do usuário logado.
// Devolve o id da partida e as perguntas embaralhadas, SEM o gabarito
// (a RLS só libera o gabarito depois que a pergunta for respondida).
const { responderJson, responderErro, lerJson } = require('../lib/http');
const { autenticar } = require('../lib/supabase');
const { log } = require('../lib/log');

const MAX_PERGUNTAS = 10;

module.exports = async function partidas(req, res) {
  const sessao = await autenticar(req, res);
  if (!sessao) return;
  const { supabase, usuario } = sessao;

  const { categoria } = await lerJson(req);
  // throwOnError: falha do Supabase vira 502 no server.js
  const { data: cat } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('nome', categoria)
    .maybeSingle()
    .throwOnError();
  if (!cat) return responderErro(res, 404, 'theme_not_found', 'Theme not found');

  const { data: perguntas } = await supabase
    .from('perguntas')
    .select('id, enunciado, pontos, multipla, opcao_a, opcao_b, opcao_c, opcao_d')
    .eq('categoria_id', cat.id)
    .throwOnError();
  if (perguntas.length === 0) return responderErro(res, 404, 'theme_without_questions', 'Theme has no questions yet');

  // .select().single(): o Supabase devolve a linha criada, com o id
  const { data: partida, error } = await supabase
    .from('partidas')
    .insert({ categoria_id: cat.id })
    .select('id')
    .single();
  if (error) {
    log('[partidas] Supabase recusou:', error.code || '', error.message || '');
    // 23503: partidas.jogador_id aponta para perfis; conta sem username não joga
    if (error.code === '23503') return responderErro(res, 400, 'profile_missing', 'Account has no username');
    return responderErro(res, 400, 'match_not_started', 'Could not start the match');
  }

  // Embaralha (Fisher-Yates) e pega no máximo 10
  for (let i = perguntas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perguntas[i], perguntas[j]] = [perguntas[j], perguntas[i]];
  }

  log('[partidas] usuário', usuario.id, 'começou a partida', partida.id, 'em', cat.nome);
  responderJson(res, 201, { partida_id: partida.id, perguntas: perguntas.slice(0, MAX_PERGUNTAS) });
};
