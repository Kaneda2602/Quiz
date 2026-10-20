# Passo 4 — Modelo conceitual

Marco M1. A entrega deste passo é o modelo conceitual: o desenho em `entregas/02-conceitual.pdf` (ou `.png`) e as tabelas abaixo.

É um DER na notação de Chen, no brModelo ou no Visual Paradigm Online. Entidades, atributos, relacionamentos e cardinalidades. Ainda não aparecem tabela, chave estrangeira nem tipo de coluna: isso é o modelo lógico, no passo 5.

## Entidades

| Entidade | Atributos | Identificador |
| --- | --- | --- |
| JOGADOR| CÓDIGO, NICKNAME, SENHA, DATA_CADASTRO| CÓDIGO |
|CATEGORIA| CÓDIGO, NOME, DESCRICAO| CÓDIGO |
|QUESTÃO | CÓDIGO, ENUNCIADO, DIFICULDADE, EXPLICAÇÃO, REFERÊNCIA, PONTUAÇÃO, CATEGORIAFK| CÓDIGO |
|PARTIDA | CÓDIGO, MODO_JOGO, JOGADORFK, DATA_INÍCIO, DATA_FIM, PONTUAÇÃO_FINAL, STATUS| CÓDIGO |
|RESPOSTA| CÓDIGO, ACERTO, ALTERNATIVAFK, PARTIDA_QUESTÃOFK, DATA_RESPOSTA| CÓDIGO |
|PARTIDA_QUESTÃO| CÓDIGO, PARTIDAFK, QUESTÃOFK, ORDEM| CÓDIGO |
|ALTERNATIVA| CÓDIGO, QUESTÃOFK, LETRA, TEXTO, CORRETA| CÓDIGO |
|RANKING | CÓDIGO, PONTUAÇÃO, NOME_JOGADORFK, HISTORICOFK| CÓDIGO
|ADMINISTRADOR | CÓDIGO, PONTUAÇÃO, NOME_JOGADORFK, HISTORICOFK| CÓDIGO

## Relacionamentos

Uma frase por linha, ligada a um requisito. Cardinalidade dos dois lados, mínimo e máximo.

| Relacionamento | Cardinalidade | Justificativa | Requisito |
| --- | --- | --- | --- |
| JOGADOR realiza PARTIDA | 1:N  | Um jogador pode realizar várias partidas; cada partida pertence a um jogador. | RF04 |
| CATEGORIA classifica QUESTAO | 1:N | Uma categoria pode possuir várias questões; cada questão pertence a uma categoria.  | RD04, RN06, RN07 |
| QUESTAO possui ALTERNATIVA | 1:4  | Cada questão possui exatamente quatro alternativas; cada alternativa pertence a uma questão. | RN04, RN09, RF08 |
| PARTIDA contém PARTIDA_QUESTAO | 1:N  | Uma partida reúne várias questões selecionadas. | RN09, RN10 |
| QUESTAO participa de PARTIDA_QUESTAO | 1:N  | Uma questão pode ser utilizada em várias partidas diferentes. | RN09 |
| PARTIDA_QUESTAO recebe RESPOSTA | 1:0..1  | Cada questão apresentada precisa possuir uma resposta. | RA06, RA07, RA10 |
| ALTERNATIVA é selecionada em RESPOSTA | 1:N  | Uma alternativa pode ser selecionada em respostas de diferentes jogadores e partidas. | RN09 |
| ADMINISTRADOR|
