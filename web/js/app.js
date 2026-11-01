// Front do Code Quest: troca de telas e autenticação.
// Cadastro e login vão direto ao Supabase Auth; o resto passa pelo back com o token.

let config; // { url, anonKey }, vindo de GET /api/config

// Erros comuns do Supabase Auth traduzidos (chave = error_code)
const ERROS = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  user_already_exists: 'Este e-mail já está cadastrado.',
  email_exists: 'Este e-mail já está cadastrado.',
  weak_password: 'A senha precisa ter pelo menos 6 caracteres.',
  email_address_invalid: 'E-mail inválido.',
  validation_failed: 'Confira o e-mail e a senha.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco.',
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde um pouco.'
};

const el = (id) => document.getElementById(id);

// Mostra só a tela pedida. O foco vai para o título dela e o título da aba muda:
// assim o leitor de tela anuncia a troca, e o Tab começa do topo da tela nova
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach((tela) => (tela.hidden = tela.id !== id));
  const titulo = document.querySelector(`#${id} h1`);
  document.title = `${titulo.textContent} | Code Quest`;
  titulo.focus({ preventScroll: true });
}

// Aviso falado pelo leitor de tela (região #anuncio, invisível).
// Limpa antes de escrever para a mesma frase ser falada de novo se repetir
function anunciar(texto) {
  el('anuncio').textContent = '';
  setTimeout(() => (el('anuncio').textContent = texto), 100);
}

// Texto só para o leitor de tela, ex.: "10 de 12 pontos" no lugar de "10/12"
function textoLeitor(texto) {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = texto;
  return span;
}

// Mesmo valor em duas versões: a curta aparece, a completa é a lida
function textoDuplo(visivel, falado) {
  const tela = document.createElement('span');
  tela.setAttribute('aria-hidden', 'true');
  tela.textContent = visivel;
  return [tela, textoLeitor(falado)];
}

// Mostra o loading enquanto a tarefa (chamadas à rede + troca de tela) roda.
// Fica no mínimo 400ms na tela para não "piscar" quando a resposta é rápida.
async function comCarregando(tarefa) {
  const carregando = document.getElementById('carregando');
  carregando.hidden = false;
  const tempoMinimo = new Promise((resolver) => setTimeout(resolver, 400));
  try {
    return await tarefa();
  } finally {
    await tempoMinimo;
    carregando.hidden = true;
  }
}

function mostrarErro(form, mensagem) {
  form.querySelector('.erro').textContent = mensagem;
}

// Supabase Auth: só a anon key, que é pública
async function chamarAuth(caminho, corpo) {
  const resposta = await fetch(`${config.url}/auth/v1/${caminho}`, {
    method: 'POST',
    headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(ERROS[dados.error_code] || 'Algo deu errado. Tente novamente.');
  return dados;
}

// Back: toda chamada leva o token do usuário (API_URL vem de config.js)
async function chamarBack(caminho, corpo, metodo = corpo ? 'POST' : 'GET') {
  const resposta = await fetch(API_URL + caminho, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: corpo && JSON.stringify(corpo)
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro);
  return dados;
}

// Saudação da tela de temas. textContent: o username vem do banco e nunca deve virar HTML
function mostrarBoasVindas(username) {
  document.getElementById('boas-vindas-nome').textContent = username || '';
}

// ---------- Setas do teclado ----------
// Como num jogo: a seta leva o foco ao botão mais próximo naquela direção,
// na tela que está aberta. Por posição na tela, então funciona igual na grade
// de 2 colunas do celular e na de 3 do desktop, sem configurar nada.

const DIRECOES = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0]
};

function centro(elemento) {
  const caixa = elemento.getBoundingClientRect();
  return { x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 };
}

// Os dois botões se cruzam no eixo de lado? (ex.: para baixo, alguma coluna em comum)
function alinhados(a, b, direcao) {
  const ca = a.getBoundingClientRect();
  const cb = b.getBoundingClientRect();
  return direcao[0] === 0
    ? ca.left < cb.right && cb.left < ca.right
    : ca.top < cb.bottom && cb.top < ca.bottom;
}

document.addEventListener('keydown', (evento) => {
  const direcao = DIRECOES[evento.key];
  if (!direcao || evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
  if (!el('carregando').hidden) return;

  const atual = document.activeElement;
  // Dentro do campo de texto, esquerda/direita andam pelas letras
  if (atual.tagName === 'INPUT' && direcao[0] !== 0) return;

  // Menu de acessibilidade aberto: as setas andam só dentro dele.
  // Senão: a tela aberta mais o cabeçalho (botão de acessibilidade)
  const areas = el('menu-acessibilidade').open
    ? [el('menu-acessibilidade')]
    : [document.querySelector('header'), document.querySelector('.tela:not([hidden])')];
  // getClientRects: ignora o que está escondido (funciona também com os botões fixos)
  const alvos = areas
    .flatMap((area) => [...area.querySelectorAll('button:not(:disabled), a[href], input')])
    .filter((alvo) => alvo.getClientRects().length > 0);
  if (alvos.length === 0) return;

  // Foco no título (acabou de abrir a tela): a primeira seta vai ao primeiro botão
  if (!alvos.includes(atual)) {
    evento.preventDefault();
    return alvos[0].focus();
  }

  // Candidatos à frente na direção da seta; ganha o mais perto, punindo o desvio
  // lateral (assim "para baixo" prefere o card logo abaixo ao da diagonal)
  const origem = centro(atual);
  let melhor;
  let menorDistancia = Infinity;
  alvos.forEach((alvo) => {
    if (alvo === atual) return;
    const destino = centro(alvo);
    const dx = destino.x - origem.x;
    const dy = destino.y - origem.y;
    const frente = dx * direcao[0] + dy * direcao[1];
    if (frente <= 1) return;
    const lado = Math.abs(dx * direcao[1] + dy * direcao[0]);
    // Só vale o que está mesmo naquela direção: desvio de até 2x o avanço, ou alinhado
    // com o atual. Sem isso, "direita" no fim da linha pularia na diagonal para os
    // botões lá embaixo
    if (lado > frente * 2 && !alinhados(atual, alvo, direcao)) return;
    const distancia = frente + lado * 2;
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = alvo;
    }
  });

  // Sem nada naquela direção (borda da tela): a seta só rola a página, como sempre
  // (é assim que se lê a explicação comprida do quiz, que não recebe foco)
  if (!melhor) return;
  evento.preventDefault();
  melhor.focus();
  melhor.scrollIntoView({ block: 'nearest' });
});

// ---------- Acessibilidade ----------
// Tamanho da fonte e alto contraste. Valem para o app inteiro e ficam
// guardados no navegador. O CSS faz o resto: --fonte multiplica todos os
// font-size e a classe .alto-contraste troca as cores.

const NIVEIS_FONTE = [0.85, 1, 1.15, 1.3, 1.5];

// localStorage pode falhar (aba anônima, bloqueio): aí só não lembra entre visitas
function lerPreferencias() {
  try {
    return JSON.parse(localStorage.getItem('acessibilidade')) || {};
  } catch {
    return {};
  }
}

const preferencias = { fonte: 1, contraste: false, ...lerPreferencias() };

function aplicarAcessibilidade() {
  const raiz = document.documentElement;
  raiz.style.setProperty('--fonte', NIVEIS_FONTE[preferencias.fonte]);
  raiz.classList.toggle('alto-contraste', preferencias.contraste);

  el('fonte-valor').textContent = `${Math.round(NIVEIS_FONTE[preferencias.fonte] * 100)}%`;
  // aria-disabled (e não disabled): no limite o botão continua focável, então o
  // foco não pula sozinho nem as setas o atravessam; o leitor diz "indisponível"
  el('fonte-menor').setAttribute('aria-disabled', preferencias.fonte === 0);
  el('fonte-maior').setAttribute('aria-disabled', preferencias.fonte === NIVEIS_FONTE.length - 1);
  el('botao-contraste').setAttribute('aria-pressed', preferencias.contraste);

  try {
    localStorage.setItem('acessibilidade', JSON.stringify(preferencias));
  } catch {}
}

function mudarFonte(passo) {
  preferencias.fonte = Math.min(Math.max(preferencias.fonte + passo, 0), NIVEIS_FONTE.length - 1);
  aplicarAcessibilidade();
}

el('botao-acessibilidade').addEventListener('click', () => el('menu-acessibilidade').showModal());
el('fechar-acessibilidade').addEventListener('click', () => el('menu-acessibilidade').close());
el('fonte-menor').addEventListener('click', () => mudarFonte(-1));
el('fonte-maior').addEventListener('click', () => mudarFonte(1));
el('botao-contraste').addEventListener('click', () => {
  preferencias.contraste = !preferencias.contraste;
  aplicarAcessibilidade();
});

// Clique no fundo escurecido (fora do painel) também fecha
el('menu-acessibilidade').addEventListener('click', (evento) => {
  if (evento.target === el('menu-acessibilidade')) el('menu-acessibilidade').close();
});

aplicarAcessibilidade();

// Botões de navegação: data-ir="id-da-tela"
document.querySelectorAll('[data-ir]').forEach((botao) => {
  botao.addEventListener('click', () => mostrarTela(botao.dataset.ir));
});

document.getElementById('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  mostrarErro(form, '');

  try {
    await comCarregando(async () => {
      const sessao = await chamarAuth('token?grant_type=password', {
        email: form.email.value,
        password: form.senha.value
      });
      localStorage.setItem('token', sessao.access_token);
      const eu = await chamarBack('/api/me');
      mostrarBoasVindas(eu.username);
      form.reset();
      mostrarTela('tela-temas');
    });
  } catch (erro) {
    mostrarErro(form, erro.message);
  }
});

document.getElementById('form-cadastro').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  mostrarErro(form, '');

  if (form.senha.value !== form.confirmar.value) return mostrarErro(form, 'As senhas não conferem.');

  try {
    await comCarregando(async () => {
      // Se o usuário já foi criado e só o username falhou (ex.: repetido),
      // a nova tentativa pula o signup e tenta só o perfil de novo
      if (!localStorage.getItem('token')) {
        const sessao = await chamarAuth('signup', { email: form.email.value, password: form.senha.value });
        // Sem access_token = a confirmação de e-mail está ativa no Supabase
        if (!sessao.access_token) return mostrarErro(form, 'Confirme seu e-mail e depois faça login.');
        localStorage.setItem('token', sessao.access_token);
      }
      const perfil = await chamarBack('/api/perfil', { username: form.username.value });
      mostrarBoasVindas(perfil.username);
      form.reset();
      mostrarTela('tela-temas');
    });
  } catch (erro) {
    mostrarErro(form, erro.message);
  }
});

// ---------- Quiz ----------

// Estado da partida em andamento
let quiz;

const LETRAS = ['a', 'b', 'c', 'd'];

// Clique num tema: o back cria a partida e devolve as perguntas (sem gabarito)
document.querySelectorAll('[data-categoria]').forEach((botao) => {
  botao.addEventListener('click', () => iniciarQuiz(botao.dataset.categoria));
});

async function iniciarQuiz(categoria) {
  el('erro-temas').textContent = '';
  try {
    await comCarregando(async () => {
      const dados = await chamarBack('/api/partidas', { categoria });
      quiz = {
        categoria,
        partidaId: dados.partida_id,
        perguntas: dados.perguntas,
        atual: 0,
        acertos: 0,
        pontos: 0,
        inicio: Date.now() // para o tempo da tela de resultado
      };
      el('quiz-titulo').textContent = `Quiz de ${categoria}`;
      mostrarPergunta();
      mostrarTela('tela-quiz');
    });
  } catch (erro) {
    el('erro-temas').textContent = erro.message;
    mostrarTela('tela-temas');
  }
}

function mostrarPergunta() {
  const pergunta = quiz.perguntas[quiz.atual];
  const total = quiz.perguntas.length;
  quiz.respondida = false;

  // Quadro da barra (0 a 9) proporcional ao avanço, mesmo com menos de 10 perguntas
  el('quiz-progresso').style.setProperty('--quadro', Math.round(((quiz.atual + 1) / total) * 10) - 1);
  // Sem contador em texto: a barra é o contador; o aria-label diz o número para leitores de tela
  el('quiz-progresso').setAttribute('aria-label', `Pergunta ${quiz.atual + 1} de ${total}`);
  el('quiz-enunciado').textContent = pergunta.enunciado;
  el('quiz-dica').hidden = !pergunta.multipla;
  // Na múltipla escolha, o leitor ouve "Marque todas as corretas" ao entrar nas alternativas
  if (pergunta.multipla) el('quiz-alternativas').setAttribute('aria-describedby', 'quiz-dica');
  else el('quiz-alternativas').removeAttribute('aria-describedby');
  el('quiz-feedback').hidden = true;
  el('quiz-erro').textContent = '';
  el('quiz-avancar').setAttribute('aria-label', 'Responder');

  // textContent (e não innerHTML) para o texto do banco nunca virar HTML
  const lista = el('quiz-alternativas');
  lista.replaceChildren();
  LETRAS.forEach((letra) => {
    const botao = document.createElement('button');
    botao.className = 'alternativa';
    botao.dataset.letra = letra;
    botao.setAttribute('aria-pressed', 'false'); // o leitor diz "marcado"/"não marcado"
    const marca = document.createElement('span');
    marca.className = 'letra';
    marca.textContent = letra.toUpperCase();
    // O quadradinho "A" é visual; o leitor ouve "Alternativa A: texto" (sem colar "ATexto")
    marca.setAttribute('aria-hidden', 'true');
    botao.append(marca, textoLeitor(`Alternativa ${letra.toUpperCase()}: `), pergunta[`opcao_${letra}`]);
    botao.addEventListener('click', () => selecionar(botao, pergunta.multipla));
    lista.append(botao);
  });
}

// Única escolha: marcar uma desmarca as outras. Múltipla: cada clique liga/desliga.
function selecionar(botao, multipla) {
  if (quiz.respondida) return;
  if (!multipla) {
    document.querySelectorAll('.alternativa').forEach((outro) => outro !== botao && outro.classList.remove('selecionada'));
  }
  botao.classList.toggle('selecionada');
  document.querySelectorAll('.alternativa').forEach((alternativa) => {
    alternativa.setAttribute('aria-pressed', alternativa.classList.contains('selecionada'));
  });
}

// O mesmo botão Avançar primeiro responde e depois vai para a próxima pergunta
el('quiz-avancar').addEventListener('click', () => (quiz.respondida ? proximaPergunta() : responder()));

async function responder() {
  const pergunta = quiz.perguntas[quiz.atual];
  const escolhidas = [...document.querySelectorAll('.alternativa.selecionada')].map((botao) => botao.dataset.letra);
  if (escolhidas.length === 0) return (el('quiz-erro').textContent = 'Escolha uma alternativa.');
  if (quiz.enviando) return; // evita resposta dupla com clique repetido

  quiz.enviando = true;
  el('quiz-erro').textContent = '';
  try {
    const gabarito = await chamarBack('/api/respostas', {
      partida_id: quiz.partidaId,
      pergunta_id: pergunta.id,
      escolhidas
    });
    quiz.respondida = true;
    if (gabarito.acertou) {
      quiz.acertos++;
      quiz.pontos += pergunta.pontos;
    }
    mostrarCorrecao(gabarito);
  } catch (erro) {
    el('quiz-erro').textContent = erro.message;
  } finally {
    quiz.enviando = false;
  }
}

// Pinta as alternativas e mostra a explicação com a fonte.
// A cor não chega ao leitor de tela, então cada alternativa ganha também o texto
function mostrarCorrecao(gabarito) {
  document.querySelectorAll('.alternativa').forEach((botao) => {
    botao.disabled = true;
    const marcada = botao.classList.contains('selecionada');
    if (gabarito.corretas.includes(botao.dataset.letra)) {
      botao.classList.add('correta');
      botao.append(textoLeitor(marcada ? ', sua resposta, correta' : ', correta'));
    } else if (marcada) {
      botao.classList.add('errada');
      botao.append(textoLeitor(', sua resposta, errada'));
    }
  });

  el('quiz-resultado').textContent = gabarito.acertou ? 'Acertou!' : 'Errou!';
  el('quiz-explicacao').textContent = gabarito.explicacao;

  const fonte = el('quiz-fonte');
  fonte.textContent = 'Fonte: ';
  if (gabarito.fonte_tipo === 'link') {
    const link = document.createElement('a');
    link.href = gabarito.fonte;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'abrir referência';
    link.append(textoLeitor(' (abre em nova aba)'));
    fonte.append(link);
  } else {
    fonte.append(gabarito.fonte);
  }

  el('quiz-feedback').hidden = false;
  const ultima = quiz.atual === quiz.perguntas.length - 1;
  el('quiz-avancar').setAttribute('aria-label', ultima ? 'Ver resultado' : 'Próxima pergunta');

  // Fala o resultado sem tirar o foco do botão: "Errou! Resposta certa: C. <explicação>"
  const certas = gabarito.corretas.map((letra) => letra.toUpperCase()).join(' e ');
  anunciar(`${gabarito.acertou ? 'Acertou!' : 'Errou!'} Resposta certa: ${certas}. ${gabarito.explicacao}`);
}

function proximaPergunta() {
  quiz.atual++;
  if (quiz.atual >= quiz.perguntas.length) return mostrarResultado();
  mostrarPergunta();
  // Mesma tela, pergunta nova: o foco vai ao enunciado para ele ser lido
  el('quiz-enunciado').focus({ preventScroll: true });
}

// Medalha pela porcentagem de pontos: ouro >= 80%, prata >= 50%, bronze abaixo
function mostrarResultado() {
  const total = quiz.perguntas.reduce((soma, pergunta) => soma + pergunta.pontos, 0);
  const porcentagem = quiz.pontos / total;
  const medalha = porcentagem >= 0.8 ? 'ouro' : porcentagem >= 0.5 ? 'prata' : 'bronze';

  // Tempo desde o início da partida, em mm:ss
  const segundos = Math.round((Date.now() - quiz.inicio) / 1000);
  const mmss = (n) => String(n).padStart(2, '0');

  el('resultado-medalha').src = `assets/medalhas/${medalha}.png`;
  el('resultado-medalha').alt = `Medalha de ${medalha}`;
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  // Na tela "10/12" e "02:35"; o leitor de tela ouve "10 de 12 pontos" e "2 minutos e 35 segundos"
  el('resultado-pontuacao').replaceChildren(...textoDuplo(`${quiz.pontos}/${total}`, `${quiz.pontos} de ${total} pontos`));
  el('resultado-aproveitamento').textContent = `${Math.round(porcentagem * 100)}%`;
  el('resultado-tempo').replaceChildren(
    ...textoDuplo(
      `${mmss(minutos)}:${mmss(resto)}`,
      `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} e ${resto} ${resto === 1 ? 'segundo' : 'segundos'}`
    )
  );
  mostrarTela('tela-resultado');
}


// ---------- Ranking ----------

const MEDALHAS = ['ouro', 'prata', 'bronze'];

// Abre no tema da última partida jogada; se ainda não jogou (ou foi um tema
// sem ranking, como o Aleatório), em IA
el('botao-ranking').addEventListener('click', () => {
  const temRanking = document.querySelector(`[data-ranking="${quiz?.categoria}"]`);
  mostrarTela('tela-ranking');
  carregarRanking(temRanking ? quiz.categoria : 'IA');
});

document.querySelectorAll('[data-ranking]').forEach((botao) => {
  botao.addEventListener('click', () => carregarRanking(botao.dataset.ranking));
});

async function carregarRanking(categoria) {
  // Marca o tema escolhido (2º quadro do sprite) e limpa o card
  document.querySelectorAll('[data-ranking]').forEach((botao) => {
    const escolhido = botao.dataset.ranking === categoria;
    botao.classList.toggle('selecionado', escolhido);
    botao.setAttribute('aria-pressed', escolhido);
  });
  el('ranking-titulo').textContent = categoria;
  el('ranking-lista').replaceChildren();
  el('ranking-vazio').hidden = true;
  el('erro-ranking').textContent = '';
  el('ranking-lista').setAttribute('aria-busy', 'true');

  try {
    await comCarregando(async () => {
      const { jogadores } = await chamarBack(`/api/ranking?categoria=${encodeURIComponent(categoria)}`);
      el('ranking-vazio').hidden = jogadores.length > 0;
      jogadores.forEach((jogador, i) => el('ranking-lista').append(linhaRanking(jogador, i)));
      anunciar(
        jogadores.length
          ? `Ranking de ${categoria}: ${jogadores.length} ${jogadores.length === 1 ? 'jogador' : 'jogadores'}.`
          : `Ranking de ${categoria}: ${el('ranking-vazio').textContent}`
      );
    });
  } catch (erro) {
    el('erro-ranking').textContent = erro.message;
  } finally {
    el('ranking-lista').removeAttribute('aria-busy');
  }
}

// Uma linha do ranking. Top 3: medalha no lugar do número e classe de destaque.
function linhaRanking(jogador, i) {
  const linha = document.createElement('li');
  linha.className = 'ranking-linha';

  // Medalha ou "4º" são só visuais; o leitor de tela ouve "1º lugar:", o nome e
  // "12 pontos, 10 de 10 acertos" (na tela: "12 pts 10/10")
  const posicao = document.createElement('span');
  posicao.className = 'posicao texto-borda';
  posicao.setAttribute('aria-hidden', 'true');
  if (i < 3) {
    linha.classList.add('destaque', MEDALHAS[i]);
    const medalha = document.createElement('img');
    medalha.className = 'medalha-pequena';
    medalha.src = `assets/medalhas/${MEDALHAS[i]}.png`;
    medalha.alt = '';
    posicao.append(medalha);
  } else {
    posicao.textContent = `${i + 1}º`;
  }

  // textContent: o username vem do banco e nunca deve virar HTML
  const nome = document.createElement('span');
  nome.className = 'nome texto-borda';
  nome.textContent = jogador.username;

  const pontos = document.createElement('span');
  pontos.className = 'pontos texto-borda';
  pontos.textContent = `${jogador.pontos} pts`;
  const acertos = document.createElement('small');
  acertos.className = 'acertos';
  acertos.textContent = `${jogador.acertos}/${jogador.respondidas}`;
  // A palavra "acertos" fica num span próprio para o CSS esconder no celular
  const rotulo = document.createElement('span');
  rotulo.className = 'acertos-rotulo';
  rotulo.textContent = ' acertos';
  acertos.append(rotulo);
  pontos.append(acertos);
  pontos.setAttribute('aria-hidden', 'true');

  linha.append(
    posicao,
    textoLeitor(`${i + 1}º lugar: `),
    nome,
    pontos,
    textoLeitor(`, ${jogador.pontos} pontos, ${jogador.acertos} de ${jogador.respondidas} acertos`)
  );
  return linha;
}

// ---------- Perfil ----------

el('botao-perfil').addEventListener('click', async () => {
  el('erro-temas').textContent = '';
  const form = el('form-perfil');
  mostrarErro(form, '');
  el('perfil-salvo').hidden = true;

  try {
    await comCarregando(async () => {
      const { username, recordes } = await chamarBack('/api/perfil');
      form.username.value = username;
      mostrarRecordes(recordes);
      mostrarTela('tela-perfil');
    });
  } catch (erro) {
    el('erro-temas').textContent = erro.message;
  }
});

// Uma linha por tema do ranking (mesmo ícone); quem ainda não jogou vê "—"
function mostrarRecordes(recordes) {
  const linhas = [...document.querySelectorAll('[data-ranking]')].map((botao) => {
    const categoria = botao.dataset.ranking;
    const recorde = recordes.find((r) => r.categoria === categoria);

    const linha = document.createElement('li');
    linha.className = 'ranking-linha';

    const icone = document.createElement('img');
    icone.className = 'recorde-icone';
    icone.src = botao.querySelector('img').src;
    icone.alt = '';
    const posicao = document.createElement('span');
    posicao.className = 'posicao';
    posicao.append(icone);

    const nome = document.createElement('span');
    nome.className = 'nome texto-borda';
    nome.textContent = categoria;

    // Na tela "6 pts 6/10" ou "—"; o leitor ouve a frase completa
    const pontos = document.createElement('span');
    pontos.className = 'pontos texto-borda';
    pontos.setAttribute('aria-hidden', 'true');
    let falado = ': ainda não jogado';
    if (recorde) {
      pontos.textContent = `${recorde.pontos} pts`;
      const acertos = document.createElement('small');
      acertos.className = 'acertos';
      acertos.textContent = `${recorde.acertos}/${recorde.respondidas}`;
      pontos.append(acertos);
      falado = `: ${recorde.pontos} pontos, ${recorde.acertos} de ${recorde.respondidas} acertos`;
    } else {
      pontos.textContent = '—';
    }

    linha.append(posicao, nome, pontos, textoLeitor(falado));
    return linha;
  });
  el('perfil-lista').replaceChildren(...linhas);
}

el('form-perfil').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  mostrarErro(form, '');
  el('perfil-salvo').hidden = true;

  try {
    await comCarregando(async () => {
      const { username } = await chamarBack('/api/perfil', { username: form.username.value }, 'PATCH');
      form.username.value = username;
      mostrarBoasVindas(username);
      el('perfil-salvo').hidden = false;
      anunciar('Nome salvo!');
    });
  } catch (erro) {
    mostrarErro(form, erro.message);
  }
});

// Mexeu no nome de novo: some o "Nome salvo!"
el('form-perfil').username.addEventListener('input', () => (el('perfil-salvo').hidden = true));

document.getElementById('botao-sair').addEventListener('click', () => {
  localStorage.removeItem('token');
  mostrarTela('tela-login');
});

// Ao abrir: se há token válido vai direto aos temas; senão, login
async function iniciar() {
  config = await (await fetch(API_URL + '/api/config')).json();

  if (localStorage.getItem('token')) {
    const resposta = await fetch(API_URL + '/api/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (resposta.ok) {
      mostrarBoasVindas((await resposta.json()).username);
      return mostrarTela('tela-temas');
    }
    localStorage.removeItem('token');
  }
  mostrarTela('tela-login');
}

// O loading já começa visível no HTML; some quando a primeira tela estiver pronta
comCarregando(iniciar);
