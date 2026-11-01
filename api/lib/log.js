// Logs simples no terminal (na Vercel aparecem em "Logs" do projeto).
// Nunca logar o token nem a senha do usuário.

function log(...partes) {
  console.log(new Date().toISOString(), ...partes);
}

function logErro(...partes) {
  console.error(new Date().toISOString(), 'ERRO', ...partes);
}

// Uma linha por chamada à API quando a resposta termina: método, caminho, status e tempo
function logRequisicao(req, res, caminho) {
  const inicio = Date.now();
  res.on('finish', () => {
    log(req.method, caminho, res.statusCode, `${Date.now() - inicio}ms`, req.headers.origin || '');
  });
}

module.exports = { log, logErro, logRequisicao };
