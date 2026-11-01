// Serve os arquivos do front (pasta web/) com fs
const fs = require('fs');
const path = require('path');
const { responderJson } = require('./http');

const PASTA_WEB = path.join(__dirname, '..', '..', 'web');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png'
};

function servirArquivo(caminho, res) {
  const arquivo = path.join(PASTA_WEB, caminho === '/' ? 'index.html' : caminho);
  // Impede sair da pasta web com "../"
  if (!arquivo.startsWith(PASTA_WEB + path.sep)) return responderJson(res, 403, { erro: 'Acesso negado' });

  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) return responderJson(res, 404, { erro: 'Não encontrado' });
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(conteudo);
  });
}

module.exports = { servirArquivo };
