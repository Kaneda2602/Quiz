# Passos 1 a 3 — Contexto, minimundo e requisitos

Marco M1. Copiem para `entregas/01-contexto.md`.

## 1. Introdução e contexto

O CodeQuest é uma aplicação desktop de quiz de múltipla escolha sobre tecnologia, desenvolvida em português brasileiro (PT-BR). O sistema apresenta dez questões por partida, abordando temas como cibersegurança, desenvolvimento Front-End e Back-End, internet, história da computação e Inteligência Artificial.

O sistema destina-se a estudantes, profissionais e demais interessados em tecnologia. O jogador informa nickname e senha para participar, enquanto o administrador utiliza credenciais de acesso para gerenciar o conteúdo do quiz.

### **Escopo.**

**O banco faz**  
-- Armazenar o cadastro dos jogadores, incluindo nickname e senha armazenada de forma segura.

-- Permitir autenticar jogadores por meio de nickname e senha.

-- Armazenar o cadastro dos administradores e suas credenciais de acesso.

-- Manter as categorias, questões, alternativas, gabaritos, explicações e URLs de referência.

-- Registrar as partidas, as respostas fornecidas e a pontuação final.

-- Manter o histórico de desempenho dos jogadores.

-- Permitir selecionar questões aleatoriamente por categoria ou no modo geral.

-- Permitir consultar e atualizar o ranking dos jogadores. 

### **O banco não faz**  
-- Armazenar senhas em texto puro.

-- Gerar questões automaticamente.

-- Realizar, por conta própria, a interface gráfica do login ou do quiz. A aplicação desktop será responsável pela interação com o usuário.  


### **Usuários**  
 

| Usuário | O que faz |
| --- | --- |
| Jogador | Informar nickname e senha, iniciar partidas, responder questões, consultar o resultado e jogar novamente (opcional)|  
| Interessados em tecnologia| Informar nickname e senha, iniciar partidas, responder questões, consultar o resultado e jogar novamente (opcional)
| Administrador | Gerenciar categorias, questões, alternativas, gabaritos, explicações e referências|

## 2. Minimundo

O CodeQuest funciona da seguinte maneira:

- Identificação do jogador:

Para acessar o CodeQuest, o jogador deverá realizar um cadastro informando obrigatoriamente seu nickname e uma senha. Após o cadastro, poderá iniciar sessão utilizando suas credenciais. O sistema deverá validar os dados informados e permitir o acesso às funcionalidades do quiz somente após a autenticação bem-sucedida.

O administrador também deverá realizar autenticação para acessar as funcionalidades de gerenciamento, como cadastrar, consultar, alterar e excluir questões e categorias.

- Início da partida

Cada jogador receberá um identificador único gerado automaticamente pelo sistema. Esse identificador será utilizado para registrar e definir o modo de jogo escolhido, relacionar o jogador às suas partidas, respostas, pontuações e histórico de desempenho.

As senhas dos jogadores e administradores deverão ser armazenadas de forma segura, utilizando hashes de senha, sem guardar os valores originais em texto puro.

- Seleção das questões:

    O jogador escolhe uma categoria específica ou o modo geral. O sistema seleciona aleatoriamente dez questões disponíveis, respeitando o modo escolhido.
    
- Apresentação das questões:
    
    Cada questão possui um enunciado e exatamente quatro alternativas, identificadas por A, B, C e D, com apenas uma alternativa correta.
    
- Registro e correção da resposta:
    
    O sistema registra a alternativa selecionada, verifica se está correta e apresenta feedback imediato, explicação e referência externa.
    
- Conclusão da partida:
    
    Após as dez questões, o sistema calcula a pontuação final, registra o encerramento e mantém o histórico de respostas.
    
- Atualização do ranking:
    
    O sistema consulta as pontuações registradas e apresenta os dez melhores resultados conforme os critérios definidos.

> 

## 3. Requisitos e regras de negócio

Cada RD01–RD11 e cada RA01–RA07 entra numa linha. Não deixem código de fora.

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RD01| O banco deve armazenar o identificador único, o nickname e o hash da senha de cada jogador.| Requisito de Dado |
| RD02| O banco deve armazenar os dados necessários para autenticação dos administradores, incluindo identificador, nome, e-mail e hash da senha.| Requisito de Dado |
| RD03 | O banco deve armazenar as categorias do quiz, incluindo identificador, nome e descrição. | Requisito de Dado |
| RD04  | O banco deve armazenar as questões, incluindo identificador, enunciado, dificuldade, explicação, URL de referência, pontuação e categoria.  | Requisito de Dado |
| RD05   | O banco deve armazenar as quatro alternativas de cada questão, incluindo letra, texto e indicação de alternativa correta.  | Requisito de Dado |
| RD06    | O banco deve armazenar cada partida, vinculando-a a um jogador e registrando datas, modo de jogo, estado e pontuação final.  |  Requisito de Dado |
| RD07    | O banco deve registrar as questões selecionadas em cada partida e a ordem em que foram apresentadas.  | Requisito de Dado |
| RD08     | O banco deve armazenar as respostas dos jogadores, incluindo a alternativa selecionada, o resultado da correção e a data da resposta.  | Requisito de Dado |
| RD09      | O banco deve manter o relacionamento entre jogadores, partidas, questões, alternativas e respostas por meio de chaves primárias e estrangeiras.  | Requisito de Dado |
| RD10       | Os identificadores das entidades devem ser únicos e obrigatórios. | Requisito de Dado |
| RD11       | Os dados obrigatórios não podem receber valores nulos ou vazios, conforme as regras de cada atributo. | Requisito de Dado |
| RD12       | O nickname de jogador e o e-mail de administrador devem ser únicos, caso sejam utilizados como identificadores de acesso. | Requisito de Dado |
| RD13       |Cada questão deve possuir exatamente quatro alternativas cadastradas e somente uma alternativa correta. | Requisito de Dado |
| RD14       | O sistema deve registrar a data e a hora de início e de término de cada partida. | Requisito de Dado |
| RD15       | O banco deve impedir respostas duplicadas para a mesma questão dentro de uma mesma partida. | Requisito de Dado |
| RD16       | O banco deve preservar os registros necessários ao histórico das partidas concluídas, mesmo que questões deixem de ser disponibilizadas para novas partidas. | Requisito de Dado |
| RD17       | O banco deve permitir obter o ranking a partir das pontuações registradas, sem exigir o armazenamento de uma cópia permanente da classificação. | Requisito de Dado |

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RA01| O sistema deve utilizar um Sistema Gerenciador de Banco de Dados (SGBD) para armazenar e consultar os dados do quiz.| Não Funcional |
| RA02| O sistema não deve permitir questões sem enunciado, alternativas ou gabarito.| Não Funcional |
| RA03 | Cada questão deve possuir exatamente quatro alternativas, identificadas de A a D, e apenas uma delas deve ser marcada como correta. | Não Funcional |
| RA04  | O código de identificação gerado para cada jogador/partida deve ser único e não pode ser duplicado.  | Não Funcional |
| RA05   | O nickname e a senha devem ser obrigatórios no cadastro do jogador e não podem ser nulos ou vazios.  | Não Funcional |
| RA06    | O sistema deve garantir a integridade dos relacionamentos entre jogadores, partidas, respostas e questões, impedindo registros relacionados a dados inexistentes.  |  Integridade |
| RA07    | O sistema deve garantir que os dados obrigatórios das questões, categorias, respostas e pontuações não sejam armazenados como nulos.  | Não Funcional |
| RA08     | Uma partida concluída deve conter exatamente dez questões distintas, selecionadas de acordo com o modo de jogo.  | Integridade |
| RA09      | Uma mesma questão não pode aparecer mais de uma vez na mesma partida.  | Integridade |
| RA10       | Cada questão vinculada à partida deve permitir, no máximo, uma resposta registrada para aquela partida. | Integridade |
| RA11       | A pontuação final e o histórico de respostas devem permanecer associados à partida correspondente. | Integridade |
| RA12       | Uma partida deve possuir um estado que permita distinguir partidas em andamento de partidas concluídas. | Integridade |
| RA13       | As senhas dos jogadores e administradores devem ser armazenadas por meio de hashes seguros, nunca em texto puro. | Segurança |
| RA14       | O sistema não deve permitir a autenticação com credenciais inválidas. | Segurança |

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RF01| O sistema deve permitir o cadastro de jogadores mediante o preenchimento de nickname e senha.| Funcional |
| RF02| O sistema deve permitir que o jogador realize login utilizando nickname e senha.| Funcional |
| RF03 | O sistema deve validar as credenciais e permitir o acesso às funcionalidades do quiz somente após autenticação bem-sucedida. | Funcional |
| RF04  | O sistema deve gerar automaticamente um identificador único para cada jogador e para cada partida.  | Funcional |
| RF05   | O sistema deve permitir que o jogador inicie uma partida após realizar login.  | Funcional |
| RF06    | O sistema deve permitir selecionar uma categoria específica ou escolher o modo geral do quiz.  |  Funcional |
| RF07    | O sistema deve selecionar aleatoriamente dez questões disponíveis conforme o modo de jogo escolhido.  | Funcional |
| RF08     | O sistema deve apresentar o enunciado e as quatro alternativas de cada questão.  | Funcional |
| RF09      | O sistema deve permitir que o jogador selecione uma alternativa e possa alterá-la para responder a cada questão.  | Funcional |
| RF10       | O sistema deve informar imediatamente se a resposta selecionada está correta ou incorreta. | Funcional |
| RF11       | O sistema deve exibir a explicação da resposta correta e a URL de referência relacionada à questão. | Funcional |
| RF12       | O sistema deve registrar as respostas fornecidas pelo jogador em cada partida. | Funcional |
| RF13       | O sistema deve calcular e exibir a pontuação final após a conclusão das dez questões. | Funcional |
| RF14       | O sistema deve armazenar o histórico de partidas, respostas e pontuações de cada jogador. | Funcional |
| RF15       | O sistema deve consultar e exibir o ranking geral, apresentando os dez melhores resultados conforme os critérios definidos. | Funcional |
| RF16       | O sistema deve permitir que o administrador realize login para acessar as funcionalidades administrativas. | Funcional |
| RF17       | O sistema deve permitir que o administrador cadastre, consulte, altere e exclua categorias e questões. | Funcional |
| RF18       | O sistema deve permitir que o administrador gerencie as alternativas, o gabarito, as explicações e as referências das questões. | Funcional |

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RNF01 |O sistema deve utilizar um SGBD relacional para armazenar e consultar os dados.| Não Funcional |
| RNF02 | O sistema deve possuir interface desktop e apresentar seus conteúdos em português brasileiro (PT-BR).| Não Funcional |
| RNF03 | As senhas de jogadores e administradores devem ser armazenadas por meio de hashes seguros, utilizando algoritmos apropriados para senhas. | Não Funcional |
| RNF04  | O sistema deve proteger o acesso às funcionalidades administrativas, permitindo seu uso somente por administradores autenticados e autorizados.  | Não Funcional |
| RNF05   | O sistema deve manter a integridade dos dados durante as operações de cadastro, alteração, exclusão e consulta.  | Não Funcional |
| RNF06    | O sistema deve apresentar mensagens claras de erro e de confirmação, permitindo que o usuário compreenda o resultado de suas ações.  |  Não Funcional |
| RNF07    | A interface deve atender a requisitos básicos de acessibilidade, incluindo contraste adequado, navegação por teclado e identificação clara dos elementos interativos.  | Não Funcional |
| RNF08     | O sistema deve evitar a exposição de senhas e de informações sensíveis em mensagens de erro e registros de execução.  | Não Funcional |

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RN01|Cada partida deve conter dez questões distintas.| Regra de Negócio |
| RN02| O jogador deve estar autenticado para iniciar uma partida.| Regra de Negócio |
| RN03 | O jogador deve informar um nickname e uma senha obrigatórios para realizar o cadastro. | Regra de Negócio |
| RN04  | Cada questão deve possuir exatamente quatro alternativas, identificadas pelas letras A, B, C e D.  | Regra de Negócio |
| RN05   | Cada questão deve possuir exatamente uma alternativa correta.  | Regra de Negócio |
| RN06    | No modo por categoria, as questões devem pertencer à categoria selecionada.  |  Regra de Negócio |
| RN07    | No modo geral, as questões devem ser selecionadas entre as categorias disponíveis.  | Regra de Negócio |
| RN08     | A seleção das questões deve ser aleatória, sem repetição de uma mesma questão dentro da partida.  | Regra de Negócio |
| RN09     | Uma resposta deve corresponder a uma alternativa pertencente à questão apresentada naquela partida.  | Regra de Negócio |
| RN10     | Cada questão apresentada em uma partida pode possuir, no máximo, uma resposta registrada.  | Regra de Negócio |
| RN11     | A pontuação final deve ser calculada conforme a pontuação atribuída às questões respondidas corretamente.  | Regra de Negócio |
| RN12     | O histórico de uma partida concluída deve preservar as questões apresentadas, as respostas registradas e o resultado obtido.  | Regra de Negócio |
| RN13     | O ranking principal deve exibir somente dez resultados, ordenados da maior para a menor pontuação.  | Regra de Negócio |
| RN14     | O critério de desempate do ranking deve ser definido pelo projeto, por exemplo, priorizando a conclusão mais antiga da partida.  | Regra de Negócio |
| RN15     | Uma partida deve possuir um estado que permita distinguir uma partida em andamento de uma partida concluída.  | Regra de Negócio |
| RN16     | Uma questão não pode ser disponibilizada em uma partida se estiver inativa ou não possuir conteúdo completo e válido.  | Regra de Negócio |

Não funcional inclui, no mínimo, o SGBD e a integridade (o que não pode duplicar nem ficar nulo).
