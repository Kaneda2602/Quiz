# Code Quest

> 🚧 Em desenvolvimento.

Quiz de tecnologia em pixel art. O jogador entra com e-mail e senha, escolhe um tema e responde perguntas de única ou múltipla escolha. A cada resposta, vê a correção com explicação e fonte; no fim, vê pontuação, aproveitamento, tempo e medalha.

Trabalho acadêmico feito **sem frameworks nem bibliotecas**:

| Parte | Tecnologia |
|---|---|
| Front (`web/`) | HTML, CSS e JavaScript puros |
| API (`api/`) | Node.js só com módulos nativos (`http`, `fs`, `path`) e `fetch` nativo — sem Express, sem dependências npm |
| Banco e login (`supabase/`) | Supabase (Postgres + Auth), acessado pela API REST com `fetch`, sem SDK |

## Como rodar localmente

### 1. Pré-requisitos

- **Node.js 20.6 ou mais novo** (por causa do `--env-file`). Confira com `node -v`.
- Um projeto no **Supabase** com o schema de [`supabase/migrations/`](supabase/migrations/) aplicado.

### 2. Configure o `.env` da API

Copie o exemplo e preencha com os dados do seu projeto Supabase (painel → **Project Settings → API**):

```bash
cp api/.env.example api/.env
```

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

- Use a **anon key** (pública por design). **Nunca** a `service_role`.
- `CORS_ORIGINS` só importa se o front rodar em outro endereço (ver abaixo).
- O `.env` está no `.gitignore` e não vai para o repositório.

### 3. Confira o Supabase Auth

No painel: **Authentication → Sign In / Providers**

- Provedor **Email** ativo
- **Confirm email** desativado (assim o login funciona logo após o cadastro)

### 4. Suba o servidor

```bash
cd api
npm start
```

Abra **http://localhost:3000**. O mesmo servidor entrega o front (`web/`) e a API (`/api/...`), então não é preciso mais nada.

Durante o desenvolvimento, use o modo que reinicia sozinho ao salvar um arquivo:

```bash
npm run dev
```

> Não há `npm install`: o projeto não tem dependências.

### Rodando o front separado (opcional)

Para rodar o front e a API em endereços diferentes, abra a pasta `web/` com o Live Server do VS Code (porta 5500) com a API rodando na 3000. O endereço do front precisa estar em `CORS_ORIGINS`, e o endereço da API fica em [`web/js/config.js`](web/js/config.js).

## Como funciona

### Autenticação

1. O **front** faz cadastro e login direto no Supabase Auth (`/auth/v1/signup` e `/auth/v1/token`) e guarda o `access_token` no `localStorage`.
2. Toda chamada à API leva `Authorization: Bearer <token>`.
3. A **API não faz login**: ela repassa o token do usuário ao Supabase junto com a anon key. Assim o Supabase aplica as políticas **RLS** como se fosse o próprio usuário.
4. Ao abrir o site, o front chama `/api/me`: token válido vai direto aos temas; inválido (ou expirado, após 1h) volta para o login.

### Rotas da API

| Método | Rota | Autenticação | O que faz |
|---|---|---|---|
| GET | `/api/health` | — | Confirma que o servidor está no ar |
| GET | `/api/config` | — | Devolve a URL e a anon key do Supabase para o front |
| GET | `/api/me` | Bearer | Dados do usuário logado (id, e-mail e username), ou `401` |
| GET | `/api/perfil` | Bearer | Username e a melhor partida em cada tema |
| POST | `/api/perfil` | Bearer | Cria o username (`{ username }`) |
| PATCH | `/api/perfil` | Bearer | Troca o username (`{ username }`) |
| POST | `/api/partidas` | Bearer | Começa uma partida (`{ categoria }`) e devolve as perguntas embaralhadas, **sem gabarito** |
| POST | `/api/respostas` | Bearer | Grava a resposta (`{ partida_id, pergunta_id, escolhidas }`) e só então devolve o gabarito |
| GET | `/api/ranking?categoria=IA` | Bearer | Os 10 melhores jogadores do tema |

Os erros vêm em JSON (`{ "erro": "mensagem" }`) com o status HTTP correto.

### Banco de dados

O schema está em [`supabase/migrations/`](supabase/migrations/). Resumo:

| Tabela | Conteúdo |
|---|---|
| `perfis` | username de cada usuário |
| `categorias` | temas do quiz |
| `perguntas` | enunciado e alternativas A–D |
| `gabaritos` | alternativas corretas, explicação e fonte |
| `partidas` / `respostas` | jogadas de cada usuário |
| `ranking` (view) | melhor partida de cada jogador em cada tema |

Regras importantes garantidas pela RLS:

- O **gabarito** de uma pergunta só fica visível depois que o jogador a responde.
- Uma resposta **não pode ser trocada** depois de enviada.
- Cada jogador só vê e cria as próprias partidas.
- Acerto é **tudo ou nada**: na múltipla escolha, é preciso marcar exatamente as corretas.

## Estrutura

```
api/
├── server.js          # servidor e tabela de rotas
├── rotas/             # um arquivo por rota
├── lib/               # http, supabase, cors, logs e arquivos estáticos
├── .env.example
├── package.json       # só scripts (start/dev), sem dependências
└── vercel.json        # deploy da API na Vercel
web/
├── index.html         # todas as telas (login, cadastro, temas, ranking, perfil, quiz, resultado)
├── css/style.css      # mobile-first
├── js/config.js       # endereço da API
├── js/app.js          # troca de telas, login, quiz, ranking e perfil
└── assets/            # pixel art (sprites, painéis, ícones, medalhas)
supabase/
└── migrations/        # schema e políticas RLS
```

### Detalhes do visual

- Fonte **Press Start 2P** (Google Fonts) e texto branco com contorno preto (`.texto-borda`).
- **Botões em sprite**: cada PNG tem o quadro normal e o pressionado; a animação de hover é só CSS, trocando o `background-position`.
- **Painéis e alternativas** usam `border-image` (9-slice): os cantos da pixel art nunca esticam, em qualquer tamanho.
- No desktop, o quiz usa duas colunas para caber na tela sem rolagem.
- No celular, os botões das telas de temas e do quiz ficam fixos no fundo da tela.
- **Teclado**: as setas levam o foco ao botão mais próximo naquela direção (como num jogo); Enter ou Espaço clicam. Tab também funciona.
- **Menu de acessibilidade** (botão no topo, em todas as telas): fonte de 85% a 150% e modo alto contraste (fundo preto, cores das alternativas com contraste mínimo de 4,5:1). As escolhas ficam salvas no navegador.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Ao subir: `ERRO SUPABASE_URL ou SUPABASE_ANON_KEY ausente` | Faltou o `api/.env` ou o servidor não foi iniciado com `npm start` |
| `EADDRINUSE` na porta 3000 | Já existe um servidor rodando; feche-o. Se usar outra porta (`PORT`), atualize também o `API_URL` em `web/js/config.js` |
| Mudou o código e nada mudou | API antiga ainda rodando; reinicie ou use `npm run dev` |
| `Failed to fetch` no navegador | API desligada, ou front aberto num endereço fora de `CORS_ORIGINS` |
| "Confirme seu e-mail..." após cadastrar | **Confirm email** está ativo no Supabase |
| "Sua conta está sem username" | Conta criada sem perfil; apague o usuário no painel e cadastre de novo |

Cada chamada à API aparece no terminal (método, rota, status e tempo), junto com o motivo quando o Supabase recusa algo — é o primeiro lugar para olhar.
