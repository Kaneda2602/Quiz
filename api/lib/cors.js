// CORS: front e API em domínios diferentes (ex.: GitHub Pages + Vercel).
// Sem esses headers o navegador bloqueia as chamadas do front.
// CORS_ORIGINS no .env: endereços do front separados por vírgula.
const ORIGENS = (process.env.CORS_ORIGINS || '').split(',').map((origem) => origem.trim());

function liberarCors(req, res) {
  const origem = req.headers.origin;
  if (!ORIGENS.includes(origem)) return;

  res.setHeader('Access-Control-Allow-Origin', origem);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Vary', 'Origin');
}

module.exports = { liberarCors };
