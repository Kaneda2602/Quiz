// Ajudantes de requisição/resposta usados por todas as rotas

function responderJson(res, status, dados) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(dados));
}

// Erro sempre como { error: "codigo", message: "texto" }. O front mostra o
// texto em português a partir do código; message serve só para depuração
function responderErro(res, status, codigo, mensagem) {
  responderJson(res, status, { error: codigo, message: mensagem });
}

// "Authorization: Bearer <token>" -> "<token>"
function lerToken(req) {
  return (req.headers.authorization || '').replace('Bearer ', '');
}

// O módulo http entrega o corpo em pedaços; junta tudo e converte para objeto
function lerJson(req) {
  return new Promise((resolve) => {
    let corpo = '';
    req.on('data', (parte) => (corpo += parte));
    req.on('end', () => {
      try {
        resolve(JSON.parse(corpo));
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = { responderJson, responderErro, lerToken, lerJson };
