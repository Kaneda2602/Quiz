// POST /api/respostas { partida_id, pergunta_id, escolhidas: ["a"] }
// Grava a resposta e só DEPOIS busca o gabarito: a RLS esconde o gabarito
// até a pergunta ser respondida, e a resposta não pode ser trocada depois.
const { responderJson, lerToken, lerJson } = require('../lib/http');
const { chamarSupabase, buscarUsuario } = require('../lib/supabase');
const { log } = require('../lib/log');

module.exports = async function respostas(req, res) {
  const token = lerToken(req);
  const usuario = await buscarUsuario(token);
  if (!usuario) return responderJson(res, 401, { erro: 'Sessão inválida ou expirada' });

  const { partida_id, pergunta_id, escolhidas } = await lerJson(req);
  const respResposta = await chamarSupabase('/rest/v1/respostas', token, {
    method: 'POST',
    body: JSON.stringify({ partida_id, pergunta_id, escolhidas })
  });

  if (!respResposta.ok) {
    // 23505 = já respondida, 23514 = alternativas inválidas, 42501 = partida de outro usuário
    const erro = await respResposta.json().catch(() => ({}));
    log('[respostas] Supabase recusou:', respResposta.status, erro.code || '', erro.message || '');
    if (erro.code === '23505') return responderJson(res, 409, { erro: 'Esta pergunta já foi respondida.' });
    if (erro.code === '23514') return responderJson(res, 400, { erro: 'Escolha pelo menos uma alternativa.' });
    return responderJson(res, 400, { erro: 'Não foi possível salvar a resposta.' });
  }

  const respGabarito = await chamarSupabase(
    `/rest/v1/gabaritos?select=corretas,explicacao,fonte,fonte_tipo&pergunta_id=eq.${Number(pergunta_id)}`,
    token
  );
  const [gabarito] = await respGabarito.json();

  // Acerto = marcou exatamente as corretas (tudo ou nada, igual à view ranking)
  const acertou =
    escolhidas.length === gabarito.corretas.length &&
    gabarito.corretas.every((letra) => escolhidas.includes(letra));

  log('[respostas] partida', partida_id, 'pergunta', pergunta_id, acertou ? 'acertou' : 'errou');
  responderJson(res, 201, { acertou, ...gabarito });
};
