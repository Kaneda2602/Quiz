// POST /api/partidas { categoria: "IA" }: começa uma partida do usuário logado.
// Devolve o id da partida e as perguntas embaralhadas, SEM o gabarito
// (a RLS só libera o gabarito depois que a pergunta for respondida).
const { responderJson, lerToken, lerJson } = require('../lib/http');
const { chamarSupabase, buscarUsuario } = require('../lib/supabase');
const { log } = require('../lib/log');

const MAX_PERGUNTAS = 10;

module.exports = async function partidas(req, res) {
  const token = lerToken(req);
  const usuario = await buscarUsuario(token);
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  const { categoria } = await lerJson(req);
  const respCategoria = await chamarSupabase(
    `/rest/v1/categorias?select=id,nome&nome=eq.${encodeURIComponent(categoria)}`,
    token
  );
  const [cat] = await respCategoria.json();
  if (!cat) return responderJson(res, 404, { erro: 'Tema não encontrado.' });

  const respPerguntas = await chamarSupabase(
    `/rest/v1/perguntas?select=id,enunciado,pontos,multipla,opcao_a,opcao_b,opcao_c,opcao_d&categoria_id=eq.${cat.id}`,
    token
  );
  const perguntas = await respPerguntas.json();
  if (perguntas.length === 0) return responderJson(res, 404, { erro: 'Este tema ainda não tem perguntas.' });

  // return=representation: o Supabase devolve a linha criada, com o id
  const respPartida = await chamarSupabase('/rest/v1/partidas', token, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ categoria_id: cat.id })
  });
  if (!respPartida.ok) {
    const erro = await respPartida.json().catch(() => ({}));
    log('[partidas] Supabase recusou:', respPartida.status, erro.code || '', erro.message || '');
    // 23503: partidas.jogador_id aponta para perfis; conta sem username não joga
    if (erro.code === '23503') return responderJson(res, 400, { erro: 'Sua conta está sem username. Cadastre-se de novo.' });
    return responderJson(res, 400, { erro: 'Não foi possível começar a partida.' });
  }
  const [partida] = await respPartida.json();

  // Embaralha (Fisher-Yates) e pega no máximo 10
  for (let i = perguntas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perguntas[i], perguntas[j]] = [perguntas[j], perguntas[i]];
  }

  log('[partidas] usuário', usuario.id, 'começou a partida', partida.id, 'em', cat.nome);
  responderJson(res, 201, { partida_id: partida.id, perguntas: perguntas.slice(0, MAX_PERGUNTAS) });
};
