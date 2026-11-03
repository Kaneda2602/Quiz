// POST /api/respostas { partida_id, pergunta_id, escolhidas: ["a"] }
// Grava a resposta e só DEPOIS busca o gabarito: a RLS esconde o gabarito
// até a pergunta ser respondida, e a resposta não pode ser trocada depois.
const { responderJson, responderErro, lerJson } = require('../lib/http');
const { autenticar } = require('../lib/supabase');
const { log } = require('../lib/log');

module.exports = async function respostas(req, res) {
  const sessao = await autenticar(req, res);
  if (!sessao) return;
  const { supabase } = sessao;

  const { partida_id, pergunta_id, escolhidas } = await lerJson(req);
  const { error } = await supabase.from('respostas').insert({ partida_id, pergunta_id, escolhidas });

  if (error) {
    // 23505 = já respondida, 23514 = alternativas inválidas, 42501 = partida de outro usuário
    log('[respostas] Supabase recusou:', error.code || '', error.message || '');
    if (error.code === '23505') return responderErro(res, 409, 'already_answered', 'Question was already answered');
    if (error.code === '23514') return responderErro(res, 400, 'no_option_selected', 'Select at least one option');
    return responderErro(res, 400, 'answer_not_saved', 'Could not save the answer');
  }

  // throwOnError: falha do Supabase vira 502 no server.js
  const { data: gabarito } = await supabase
    .from('gabaritos')
    .select('corretas, explicacao, fonte, fonte_tipo')
    .eq('pergunta_id', Number(pergunta_id))
    .single()
    .throwOnError();

  // Acerto = marcou exatamente as corretas (tudo ou nada, igual à view ranking)
  const acertou =
    escolhidas.length === gabarito.corretas.length &&
    gabarito.corretas.every((letra) => escolhidas.includes(letra));

  log('[respostas] partida', partida_id, 'pergunta', pergunta_id, acertou ? 'acertou' : 'errou');
  responderJson(res, 201, { acertou, ...gabarito });
};
