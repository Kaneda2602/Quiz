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

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach((tela) => (tela.hidden = tela.id !== id));
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
async function chamarBack(caminho, corpo) {
  const resposta = await fetch(API_URL + caminho, {
    method: corpo ? 'POST' : 'GET',
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

// Botões de navegação: data-ir="id-da-tela"
document.querySelectorAll('[data-ir]').forEach((botao) => {
  botao.addEventListener('click', () => mostrarTela(botao.dataset.ir));
});

document.getElementById('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  mostrarErro(form, '');

  try {
    const sessao = await chamarAuth('token?grant_type=password', {
      email: form.email.value,
      password: form.senha.value
    });
    localStorage.setItem('token', sessao.access_token);
    form.reset();
    mostrarTela('tela-temas');
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
    // Se o usuário já foi criado e só o username falhou (ex.: repetido),
    // a nova tentativa pula o signup e tenta só o perfil de novo
    if (!localStorage.getItem('token')) {
      const sessao = await chamarAuth('signup', { email: form.email.value, password: form.senha.value });
      // Sem access_token = a confirmação de e-mail está ativa no Supabase
      if (!sessao.access_token) return mostrarErro(form, 'Confirme seu e-mail e depois faça login.');
      localStorage.setItem('token', sessao.access_token);
    }
    await chamarBack('/api/perfil', { username: form.username.value });
    form.reset();
    mostrarTela('tela-temas');
  } catch (erro) {
    mostrarErro(form, erro.message);
  }
});

// ---------- Quiz ----------

// Estado da partida em andamento
let quiz;

const LETRAS = ['a', 'b', 'c', 'd'];
const el = (id) => document.getElementById(id);

// Clique num tema: o back cria a partida e devolve as perguntas (sem gabarito)
document.querySelectorAll('[data-categoria]').forEach((botao) => {
  botao.addEventListener('click', () => iniciarQuiz(botao.dataset.categoria));
});

async function iniciarQuiz(categoria) {
  el('erro-temas').textContent = '';
  try {
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
    mostrarPergunta();
    mostrarTela('tela-quiz');
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
  el('quiz-contador').textContent = `Pergunta ${quiz.atual + 1} de ${total}`;
  el('quiz-enunciado').textContent = pergunta.enunciado;
  el('quiz-dica').hidden = !pergunta.multipla;
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
    const marca = document.createElement('span');
    marca.className = 'letra';
    marca.textContent = letra.toUpperCase();
    botao.append(marca, pergunta[`opcao_${letra}`]);
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

// Pinta as alternativas e mostra a explicação com a fonte
function mostrarCorrecao(gabarito) {
  document.querySelectorAll('.alternativa').forEach((botao) => {
    botao.disabled = true;
    if (gabarito.corretas.includes(botao.dataset.letra)) botao.classList.add('correta');
    else if (botao.classList.contains('selecionada')) botao.classList.add('errada');
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
    fonte.append(link);
  } else {
    fonte.append(gabarito.fonte);
  }

  el('quiz-feedback').hidden = false;
  el('quiz-avancar').setAttribute('aria-label', 'Próxima pergunta');
}

function proximaPergunta() {
  quiz.atual++;
  if (quiz.atual < quiz.perguntas.length) return mostrarPergunta();
  mostrarResultado();
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
  el('resultado-pontuacao').textContent = `${quiz.pontos}/${total}`;
  el('resultado-aproveitamento').textContent = `${Math.round(porcentagem * 100)}%`;
  el('resultado-tempo').textContent = `${mmss(Math.floor(segundos / 60))}:${mmss(segundos % 60)}`;
  mostrarTela('tela-resultado');
}


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
    if (resposta.ok) return mostrarTela('tela-temas');
    localStorage.removeItem('token');
  }
  mostrarTela('tela-login');
}

iniciar();
