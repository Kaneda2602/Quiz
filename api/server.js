// Servidor do Code Quest: só módulos nativos do Node e o fetch nativo.
// Aqui fica só o roteamento; cada rota mora em rotas/.
const http = require('http');
const { responderJson } = require('./lib/http');
const { liberarCors } = require('./lib/cors');
const { servirArquivo } = require('./lib/estaticos');
const { log, logErro, logRequisicao } = require('./lib/log');

const PORTA = process.env.PORT || 3000;

// "MÉTODO /caminho" -> função da rota
const ROTAS = {
  'GET /api/health': require('./rotas/health'),
  'GET /api/config': require('./rotas/config'),
  'GET /api/me': require('./rotas/me'),
  'POST /api/perfil': require('./rotas/perfil'),
  'POST /api/partidas': require('./rotas/partidas'),
  'POST /api/respostas': require('./rotas/respostas')
};

async function tratarRequisicao(req, res) {
  // Sem decodeURIComponent: uma URL malformada (ex.: "%E0") derrubaria o processo
  const caminho = new URL(req.url, 'http://localhost').pathname;
  // Só loga a API; os arquivos do front (imagens, css...) poluiriam o terminal
  if (caminho.startsWith('/api/')) logRequisicao(req, res, caminho);

  liberarCors(req, res);
  // Pré-verificação do navegador antes de chamadas com Authorization
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const rota = ROTAS[`${req.method} ${caminho}`];

  try {
    if (rota) return await rota(req, res);
    if (caminho.startsWith('/api/')) return responderJson(res, 404, { erro: 'Rota não encontrada' });
    // Só no uso local: na Vercel o front fica no GitHub Pages
    if (req.method === 'GET') return servirArquivo(caminho, res);
    responderJson(res, 405, { erro: 'Método não permitido' });
  } catch (erro) {
    // Ex.: Supabase fora do ar
    logErro(req.method, caminho, erro);
    responderJson(res, 502, { erro: 'Falha ao falar com o Supabase' });
  }
}

// Rodando com "node server.js": sobe o servidor.
// Importado pela Vercel: ela mesma chama tratarRequisicao a cada requisição.
if (require.main === module) {
  http
    .createServer(tratarRequisicao)
    .listen(PORTA, () => {
      log(`Code Quest em http://localhost:${PORTA}`);
      // Avisa logo na largada se o .env não foi carregado
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        logErro('SUPABASE_URL ou SUPABASE_ANON_KEY ausente. Rodou com --env-file=.env?');
      }
    });
}

module.exports = tratarRequisicao;
