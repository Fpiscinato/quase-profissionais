/**
 * English translations, keyed by the Portuguese source string (see i18n.ts).
 * {placeholders} must match the keys used in the matching t() call.
 */
export const EN: Record<string, string> = {
  // Court/serve sides — also drive the D/E side-history letters (first
  // character of the translated word), so keep these to a single word.
  Direita: 'Right',
  Esquerda: 'Left',

  // App shell (App.tsx)
  'Carregando...': 'Loading...',
  '‹ Início': '‹ Home',

  // HomeScreen
  'Os Quase Profissionais': 'The Almost Professionals',
  'Atletas de fim de semana. Vai quem aguentar.': 'Weekend athletes. Whoever can hang.',
  Torneio: 'Tournament',
  Praticar: 'Practice',
  'Um jogo único (1×1 ou uma dupla), sem montar um torneio inteiro.':
    'A single match (1v1 or one pair), without setting up a whole tournament.',
  Jogadores: 'Players',
  'Adicionar, editar, remover': 'Add, edit, remove',
  Ranking: 'Ranking',
  'Do dia e geral': "Today's and overall",
  Histórico: 'History',
  'Torneios e partidas anteriores': 'Previous tournaments and matches',
  'Como jogar': 'How to play',
  'Regras básicas em 6 cards': 'Basic rules in 6 cards',
  'Como usar': 'How to use',
  'Passo a passo do app': 'Step-by-step app guide',
  Backup: 'Backup',
  'Exportar / importar dados': 'Export / import data',

  // AvailabilityStep
  'Quem joga hoje?': "Who's playing today?",
  'Marque os jogadores disponíveis. Mínimo 2.': 'Check the available players. Minimum 2.',
  'Marque pelo menos mais um jogador.': 'Check at least one more player.',
  Continuar: 'Continue',
  jogador: 'player',
  jogadores: 'players',

  // FormatRotationStep
  'Formato e rotação': 'Format and rotation',
  'jogadores disponíveis.': 'players available.',
  Formato: 'Format',
  'Duplas (Americano) precisa de 4+ jogadores e forma times de 2. Individual é todos-contra-todos, um jogador por vez, a partir de 2.':
    'Doubles (American) needs 4+ players and forms teams of 2. Singles is everyone-against-everyone, one player at a time, from 2 players.',
  'Duplas (Americano)': 'Doubles (American)',
  Individual: 'Singles',
  'Duplas precisa de 4+ jogadores disponíveis.': 'Doubles needs 4+ available players.',
  'Formação das duplas': 'Pairing method',
  'Balanceado sorteia e distribui as duplas de forma justa (descanso e parceiros variados). Manual deixa você escolher quem joga com quem em cada rodada.':
    'Balanced draws and distributes pairs fairly (rest and partners varied). Manual lets you choose who plays with whom each round.',
  'Balanceado (recomendado)': 'Balanced (recommended)',
  Manual: 'Manual',
  'Games para vencer o set': 'Games to win the set',
  'Quantos games o time precisa fazer (com 2 de vantagem) pra vencer o set. Padrão: 4. Se empatar nesse número, vai pro tiebreak.':
    'How many games a team needs (winning by 2) to take the set. Default: 4. A tie at that number goes to a tiebreak.',
  'No tênis oficial o set vai até 6 games (com 2 de vantagem) — vale pra Duplas e Individual. Aqui você pode encurtar pra jogos mais rápidos.':
    'In official tennis the set goes up to 6 games (winning by 2) — the same for Doubles and Singles. Here you can shorten it for faster matches.',
  'No Individual todo mundo joga contra todo mundo uma vez — não há escolha de duplas.':
    'In Singles everyone plays everyone once — there is no pairing to choose.',
  'Sets para vencer a partida': 'Sets to win the match',
  '1 set': 'Best of 1',
  'Melhor de 3': 'Best of 3',
  'Melhor de 5 (Grand Slam)': 'Best of 5 (Grand Slam)',
  'Melhor de 3 ou de 5: quem fizer mais sets primeiro vence. Se empatar no set decisivo (1-1 ou 2-2), ele vira um super-tiebreak até 10 pontos em vez de um set cheio, pra não alongar demais.':
    'Best of 3 or 5: whoever wins the most sets first takes the match. If it ties at the deciding set (1-1 or 2-2), that set becomes a super-tiebreak up to 10 points instead of a full set, so it does not drag on.',
  'Sortear novamente': 'Redraw',
  'Confirmar e criar torneio': 'Confirm and create tournament',
  'Criando...': 'Creating...',
  Voltar: 'Back',
  Rodada: 'Round',
  'Descansa:': 'Resting:',

  // ManualRoundsEditor
  'Toque em 2 jogadores de cada rodada para formar o Time 1 — os outros 2 formam o Time 2. Quem descansa já está balanceado.':
    'Tap 2 players in each round to form Team 1 — the other 2 form Team 2. Who rests is already balanced.',
  'Time 1': 'Team 1',
  'Time 2': 'Team 2',
  'Escolha exatamente 2 para o Time 1.': 'Choose exactly 2 for Team 1.',

  // MatchSetupStep
  'Configurar partida': 'Set up match',
  'Ordem de saque': 'Serve order',
  'Cada jogador saca um game inteiro; a ordem roda entre os dois times, então quem saca em seguida é sempre do time adversário.':
    'Each player serves a whole game; the order rotates between the two teams, so the next server is always from the opposing team.',
  Sortear: 'Draw',
  Escolher: 'Choose',
  'Toque na ordem em que cada jogador vai sacar (jogadores consecutivos são sempre de times opostos).':
    "Tap the order each player will serve in (consecutive players are always from opposite teams).",
  Reiniciar: 'Restart',
  'Lado inicial da quadra': 'Starting side of the court',
  'De que lado da quadra o Time 1 começa (visto de quem está assistindo). O Time 2 começa do lado oposto. Isso muda a cada troca de lado durante a partida.':
    'Which side of the court Team 1 starts on (as seen by a spectator). Team 2 starts on the opposite side. This changes with every change of ends during the match.',
  'Time 1 na esquerda': 'Team 1 on the left',
  'Time 1 na direita': 'Team 1 on the right',
  'Salvando...': 'Saving...',
  'Confirmar partida': 'Confirm match',
  'Confirmar e iniciar partida': 'Confirm and start match',
  'Jogador com o controle remoto': 'Player holding the remote control',
  'Se alguém vai marcar os pontos pelo controle físico, escolha quem é aqui — o time dele fica sempre fixado como Time 1 ou Time 2, trocando os times automaticamente se precisar, pra os botões do controle nunca mudarem de lugar de uma rodada pra outra. Fica lembrado no aparelho pras próximas partidas.':
    "If someone is going to score points with the physical remote, pick who here — their team always stays fixed as Team 1 or Team 2, swapping teams automatically when needed, so the remote's buttons never move from one round to the next. Remembered on this device for future matches.",
  Nenhum: 'None',
  'Time dele: Time 1': 'Their team: Team 1',
  'Time dele: Time 2': 'Their team: Team 2',

  // RoundsListStep
  'Carregando torneio...': 'Loading tournament...',
  Rodadas: 'Rounds',
  rodada: 'round',
  rodadas: 'rounds',
  Pendente: 'Pending',
  'Concluída ✓': 'Completed ✓',
  Configurada: 'Set up',
  'Ordem de saque:': 'Serve order:',
  '⚠ Excluir esta configuração de partida (times e ordem de saque)? Você vai precisar configurar de novo. Isso não pode ser desfeito.':
    '⚠ Delete this match setup (teams and serve order)? You will need to set it up again. This cannot be undone.',
  Cancelar: 'Cancel',
  'Confirmar exclusão': 'Confirm deletion',
  'Continuar partida': 'Continue match',
  'Iniciar partida': 'Start match',
  Excluir: 'Delete',
  'Encerrar este torneio? As partidas já jogadas continuam no histórico e no ranking. Você poderá começar um torneio novo em seguida.':
    'End this tournament? Matches already played stay in history and ranking. You can start a new tournament right after.',
  'Encerrar e começar novo': 'End and start a new one',
  '⚠ Excluir este torneio inteiro, com todas as suas partidas? Essa ação não pode ser desfeita.':
    '⚠ Delete this entire tournament, along with all its matches? This action cannot be undone.',
  'Sim, excluir tudo': 'Yes, delete everything',
  'Encerrar torneio': 'End tournament',
  'Excluir torneio': 'Delete tournament',
  'Excluir dia': 'Delete day',
  '⚠ Excluir o dia todo — todos os torneios e partidas dessa data? Essa ação não pode ser desfeita.':
    '⚠ Delete the whole day — every tournament and match on that date? This action cannot be undone.',
  'Sim, excluir dia': 'Yes, delete day',
  'Excluindo...': 'Deleting...',

  // GuideScreen
  'As regras do Tennis Americano, resumidas. A tela ao vivo te guia durante a partida — quem saca, de que lado, e quando trocar de lado.':
    'The rules of Tennis Americano, in short. The live screen guides you through the match — who serves, which side, and when to change ends.',
  Pontos: 'Points',
  '0 → 15 → 30 → 40 → game. Em 40-40 ("deuce"/iguais), precisa ganhar 2 pontos seguidos pra fechar o game.':
    '0 → 15 → 30 → 40 → game. At 40-40 ("deuce"), you need 2 straight points to close the game.',
  'Set curto': 'Short set',
  'Vence o set quem fizer primeiro um número de games definido pelo organizador na criação do torneio (de 2 a 6, padrão 4), com 2 de diferença. Se os dois times chegarem juntos nesse número (ex.: 4-4), vai pro tiebreak. No tênis oficial o padrão é set até 6 games — aqui usamos um set mais curto de propósito, pra jogos mais rápidos e mais rodadas no dia. Todas as outras regras (pontuação, saque, troca de lado, tiebreak) seguem exatamente o padrão oficial.':
    'The set is won by whichever team first reaches a number of games set by the organiser at tournament creation (2 to 6, default 4), winning by 2. If both teams reach that number together (e.g. 4-4), it goes to a tiebreak. Official tennis defaults to a 6-game set — here we deliberately use a shorter set, for faster matches and more rounds in a day. Every other rule (scoring, serve, change of ends, tiebreak) follows the official standard exactly.',
  'Saque em duplas': 'Doubles serve',
  'Cada jogador saca um game inteiro (todos os pontos daquele game). A vez de sacar roda entre os quatro jogadores em quadra, alternando os times a cada game. Dentro do game, o lado da quadra troca a cada ponto: Direita no placar 0 e nos pares, Esquerda nos ímpares.':
    'Each player serves a whole game (every point in it). The turn to serve rotates among the four players on court, alternating teams each game. Within a game, the service side changes every point: Right at 0 and on even scores, Left on odd scores.',
  'Troca de lado': 'Change of ends',
  'Os times trocam de lado da quadra a cada número ímpar de games completados (após o 1º, 3º, 5º...). A tela ao vivo avisa "Troquem de lado" com uma animação de quadra na hora certa.':
    'Teams change ends after every odd number of completed games (after the 1st, 3rd, 5th...). The live screen shows "Change ends" with a court animation at the right moment.',
  'Ponto de ouro (no-ad)': 'Golden point (no-ad)',
  'Quando essa opção está ativada: no 40-40, o próximo ponto já decide o game — sem precisar de 2 de vantagem. É tudo ou nada.':
    'When this option is on: at 40-40, the next point decides the game outright — no need to win by 2. It is all or nothing.',
  Tiebreak: 'Tiebreak',
  'Quando os games empatam no topo do set (ex.: 4-4), joga-se um desempate até 7 pontos, precisando de 2 de vantagem, pra decidir o set.':
    'When games tie at the top of the set (e.g. 4-4), a tiebreak up to 7 points, winning by 2, decides the set.',

  // ManualScreen
  'Como usar o app': 'How to use the app',
  'Um passo a passo rápido, do cadastro dos jogadores até o fim do torneio. Tudo funciona offline, direto no seu aparelho.':
    'A quick walkthrough, from registering players to finishing a tournament. Everything works offline, right on your device.',
  '1. Cadastre os jogadores': '1. Register the players',
  'Em "Jogadores", adicione o grupo (nome e pronto). Dá pra editar ou excluir depois — quem já tem partida registrada é arquivado, não some do histórico. Cadastrou o mesmo jogador duas vezes por engano (nomes diferentes)? A seção "Mesclar jogadores duplicados", mais abaixo na mesma tela, junta os dois num só sem perder o histórico de nenhum dos dois.':
    'In "Players", add your group (just a name). You can edit or remove them later — anyone with a recorded match gets archived instead, so history keeps working. Registered the same player twice by mistake (different names)? The "Merge duplicate players" section further down that same screen joins them into one without losing either one\'s history.',
  '2. Comece um torneio': '2. Start a tournament',
  'No botão "Torneio": primeiro marque quem está jogando hoje, depois escolha o formato (Duplas ou Individual), a formação das duplas (Balanceado sorteia justo, Manual você escolhe), quantos games decidem o set e quantos sets decidem a partida (1 set, melhor de 3 ou melhor de 5 — no set decisivo de uma melhor-de-3/5, empate vira super-tiebreak até 10 pontos em vez de mais um set cheio). Toque em "Confirmar e criar torneio".':
    'In the "Tournament" button: first check who is playing today, then choose the format (Doubles or Singles), how pairs are formed (Balanced draws fairly, Manual lets you choose), how many games decide the set, and how many sets decide the match (1 set, best of 3, or best of 5 — at the deciding set of a best-of-3/5, a tie becomes a super-tiebreak up to 10 points instead of another full set). Tap "Confirm and create tournament".',
  '3. Ou pratique (sem torneio)': '3. Or practice (no tournament)',
  'Em "Praticar" você escolhe o formato, os jogadores dos dois times, quantos games decidem o set e quantos sets decidem a partida, sem passar pela disponibilidade ou rotação — direto pra configurar e jogar. Conta pro ranking e histórico normalmente, mas dá pra excluir essas partidas com o checkbox "Somente partidas de torneio" no Ranking e no Histórico, se quiser separar treino de valendo.':
    'In "Practice" you pick the format, the players on each side, how many games decide the set, and how many sets decide the match, skipping availability and rotation entirely — straight to setup and play. It counts toward ranking and history like any other match, but you can exclude these matches with the "Tournament matches only" checkbox on Ranking and History, if you want to keep practice separate from real matches.',
  '4. Jogue as rodadas': '4. Play the rounds',
  'A tela "Rodadas" lista os confrontos do dia. Toque em "Configurar partida" pra definir quem saca primeiro, o lado inicial da quadra e, se alguém for marcar os pontos pelo controle remoto físico, quem é essa pessoa e se o time dela fica sempre como Time 1 ou Time 2 (o app troca os times automaticamente pra isso — fica lembrado no aparelho pras próximas partidas). Depois é só "Iniciar partida" pra abrir a tela ao vivo. Se já sabe que vai começar na hora, use direto o botão "Confirmar e iniciar partida" — ele pula a volta pra lista de rodadas e já abre o jogo ao vivo.':
    'The "Rounds" screen lists the day\'s matchups. Tap "Set up match" to set who serves first, the starting side of the court, and — if someone is going to score with the physical remote control — who that is and whether their team always stays Team 1 or Team 2 (the app swaps teams automatically for this — remembered on the device for future matches). Then just "Start match" to open the live screen. If you already know you\'re starting right away, use the "Confirm and start match" button instead — it skips the trip back to the rounds list and opens the live game directly.',
  '5. Tela ao vivo': '5. Live screen',
  'Os botões grandes somam ponto pra cada time. A tela mostra quem saca, de que lado, e avisa na hora de trocar de lado ou de fechar o set. No topo, ao lado do cronômetro, o placar "Games: X de Y" e duas fileiras de caixinhas (uma por time, na cor de cada um) mostram quantos games cada time já ganhou e quantos faltam pra fechar o set. O histórico de lado da quadra (as letras D/E embaixo do nome do time) mostra só as últimas 5 trocas, pra não estourar a tela em sets que vão pro tiebreak longo. Numa partida melhor-de-3/5, uma segunda fileira azul mostra os sets ganhos por cada time, e um aviso "Set encerrado" aparece entre um set e outro; o set decisivo (empate 1-1 ou 2-2) vira um super-tiebreak até 10 pontos. Errou o toque? "Desfazer" volta um ponto. No final, "Salvar partida" grava o resultado.':
    'The big buttons add a point for each team. The screen shows who is serving, from which side, and alerts you when to change ends or when the set closes. At the top, next to the timer, the "Games: X of Y" label and two rows of boxes (one per team, in each team\'s color) show how many games each team has won and how many are left to close the set. The court-side history (the D/E letters under the team name) only shows the last 5 changes, so it doesn\'t overflow the screen on sets that go to a long tiebreak. In a best-of-3/5 match, a second blue row shows sets won by each team, and a "Set over" banner appears between sets; the deciding set (a 1-1 or 2-2 tie) becomes a super-tiebreak up to 10 points. Mistapped? "Undo" steps back one point. At the end, "Save match" records the result.',
  '6. Ranking': '6. Ranking',
  '"Ranking" mostra a classificação do dia (com seletor pra escolher outra data) e o ranking geral (todos os torneios já jogados), tanto individual quanto por dupla — as colunas SV/SP mostram sets vencidos/perdidos ao lado de games e pontos. Marque "Somente partidas de torneio" pra deixar de fora as partidas feitas em "Praticar". O botão "Compartilhar" gera uma imagem com os dois rankings, a legenda explicando cada coluna e o tempo jogado — sempre do mesmo recorte (dia ou geral) que está selecionado na tela.':
    '"Ranking" shows the day\'s standings (with a picker to choose another date) and the overall ranking (every tournament ever played), both individual and by pair — the SV/SP columns show sets won/lost alongside games and points. Check "Tournament matches only" to leave out matches made in "Practice". The "Compartilhar" button generates an image with both rankings, a legend explaining each column, and the time played — always matching whichever scope (day or overall) is selected on screen.',
  '7. Histórico': '7. History',
  '"Histórico" guarda todos os torneios e partidas anteriores, agrupados por dia — cada dia mostra quantas partidas teve e o tempo total jogado naquele dia, além do placar, duração e tempo total jogado por jogador e por dupla no card do topo. Numa partida melhor-de-3/5, o placar de cada partida mostra os sets (com o resultado de cada um) além do total de games. O mesmo checkbox "Somente partidas de torneio" também funciona aqui.':
    '"History" keeps every past tournament and match, grouped by day — each day shows how many matches it had and the total time played that day, plus score, duration and total time played per player and per pair in the card at the top. In a best-of-3/5 match, each match\'s placar shows the sets (with each one\'s result) alongside the total games. The same "Tournament matches only" checkbox also works here.',
  '8. Backup': '8. Backup',
  'Em "Backup" você exporta todos os dados (jogadores, torneios, partidas) num arquivo, pra guardar ou levar pra outro aparelho. No celular, "Exportar dados" abre o menu de compartilhar — escolha "Salvar no Drive" (ou outra pasta compartilhada) pra que os outros aparelhos consigam importar de lá depois. Importar mescla esse arquivo com o que já está salvo, sem apagar nada sem confirmar.':
    'In "Backup" you export all your data (players, tournaments, matches) to a file, to keep or move to another device. On a phone, "Exportar dados" opens the share menu — choose "Save to Drive" (or another shared folder) so other devices can import it from there later. Importing merges that file with what is already saved, never deleting anything without confirmation.',
  '9. Modo viva-voz': '9. Hands-free voice mode',
  'No topo da tela, "🎙 Voz" liga os anúncios falados (placar, quem saca, troca de lado), com um botão de velocidade ao lado (padrão 1.5x). "🎤 Comandos" é um toggle separado, desligado por padrão, que liga o reconhecimento de voz pra marcar ponto falando "Ponto Time 1" / "Ponto Time 2" ou repetir o último anúncio dizendo "Repita" — em testes reais isso errou bastante (microfone longe, tela apagando), então fica por sua conta ativar. Só funciona em Android/Chrome.':
    'At the top of the screen, "🎙 Voice" turns on spoken announcements (score, who serves, change of ends), with a speed button next to it (default 1.5x). "🎤 Commands" is a separate toggle, off by default, that turns on speech recognition to score by saying "Point Team 1" / "Point Team 2" or repeat the last announcement by saying "Repeat" — in real testing this missed a lot (mic too far, screen turning off), so it is up to you to turn on. Only works on Android/Chrome.',
  '10. Controle remoto': '10. Remote control',
  'Em "Controle remoto" você mapeia os botões de um controle físico (ex. um "clicker" de apresentação USB) pra Ponto Time 1, Ponto Time 2, Repetir anúncio, Desfazer e Salvar partida. Toque em "Definir", aperte o botão do controle, pronto — funciona com qualquer controle que emule teclado, não só um modelo específico. A tela ao vivo escuta esses botões o tempo todo, mesmo com o Modo viva-voz desligado. Se quem aperta o controle se confunde com a troca de times a cada rodada, use "Jogador com o controle remoto" em "Configurar partida" pra fixar o time dele sempre no mesmo botão.':
    'In "Remote control" you map a physical remote\'s buttons (e.g. a USB presentation "clicker") to Point Team 1, Point Team 2, Repeat announcement, Undo and Save match. Tap "Set", press the remote\'s button, done — works with any device that emulates a keyboard, not just one specific model. The live screen listens for these buttons the whole time, even with Hands-free voice mode off. If whoever holds the remote gets confused by teams swapping each round, use "Player holding the remote control" in "Set up match" to fix their team to the same button every time.',
  // WatchSetupScreen
  'Configurar relógio': 'Set up watch',
  'Marque os pontos direto do pulso — só relógios Samsung/Wear OS por enquanto.':
    'Score points straight from your wrist — Samsung/Wear OS watches only for now.',
  'O relay ainda não foi publicado (RELAY_URL continua com o valor de exemplo) — veja relay-worker/RELAY.md pra colocar no ar antes de parear um relógio.':
    'The relay hasn\'t been published yet (RELAY_URL is still the placeholder value) — see relay-worker/RELAY.md to bring it up before pairing a watch.',
  'Gerar código': 'Generate code',
  'Código do relógio': 'Watch code',
  'Relógio conectado ✓': 'Watch connected ✓',
  'Aguardando o relógio…': 'Waiting for the watch…',
  'Conectando ao relay…': 'Connecting to the relay…',
  'Gerar novo código': 'Generate new code',
  'No navegador do relógio, abra:': 'In the watch\'s browser, open:',
  'e digite o código acima.': 'and type the code above.',
  'Sem Wi-Fi na quadra? Ative o ponto de acesso do tablet/celular e conecte o Wi-Fi do relógio nele (não é o Bluetooth de sempre) — funciona igual.':
    'No Wi-Fi at the court? Turn on the tablet/phone\'s hotspot and connect the watch\'s own Wi-Fi to it (not the usual Bluetooth) — works the same way.',
  'Tela do relógio': 'Watch screen',
  'Escurecer sozinha economiza bateria; sempre ativa nunca escurece, mas gasta mais.':
    'Dimming on its own saves battery; always on never dims, but uses more.',
  'Escurecer sozinha': 'Dim on its own',
  'Sempre ativa': 'Always on',
  'Desparear relógio': 'Unpair watch',
  'Marcar pontos pelo Galaxy Watch': 'Score points via Galaxy Watch',

  '11. Layout tablet': '11. Tablet layout',
  'A tela ao vivo tem um botão "📐" (perto do cronômetro) que alterna entre Automático, Tablet e Smartphone. Automático detecta o tamanho da tela sozinho; Tablet espalha os times e o placar lado a lado, útil numa tela maior; Smartphone mantém o layout empilhado de sempre.':
    'The live screen has a "📐" button (near the timer) that cycles through Automatic, Tablet and Smartphone. Automatic detects the screen size on its own; Tablet spreads the teams and score side by side, useful on a bigger screen; Smartphone keeps the usual stacked layout.',
  '12. Termos do tênis': '12. Tennis terms',
  'Ace: ponto de saque que o adversário nem consegue tocar. Dupla falta: dois saques errados seguidos — ponto pro time adversário. Let: o saque toca a rede e cai no lugar certo — repete o saque, sem contar como falta. 40 a 40 é Deuce; quem ganha o ponto seguinte fica com a Vantagem (AD) e precisa vencer mais um ponto pra fechar o game (senão volta pro Deuce). Quebra de saque (break): vencer um game em que era o adversário quem estava sacando. Match point / set point: o ponto que, se vencido, decide a partida ou o set ali mesmo.':
    'Ace: a serve the opponent can\'t even touch. Double fault: two missed serves in a row — point to the other team. Let: the serve clips the net and still lands in — replay the serve, doesn\'t count as a fault. 40-40 is Deuce; whoever wins the next point gets Advantage (AD) and needs one more point to close the game (otherwise it\'s back to Deuce). Break: winning a game where the opponent was serving. Match point / set point: the point that, if won, ends the match or the set right there.',
  '13. Relógio (Wear OS)': '13. Watch (Wear OS)',
  'Quem estiver com o Galaxy Watch pode marcar os pontos direto do pulso, sem carregar o controle remoto pendurado no pescoço. Em "Configurar relógio" gere um código de 6 dígitos e escolha se a tela do relógio escurece sozinha (economiza bateria) ou fica sempre ativa. No navegador do relógio, abra o endereço indicado ali e digite o código — o placar (0/15/30/40), quem saca e o lado aparecem sozinhos, atualizados pelo aparelho principal. Sem conexão confirmada, os botões do relógio ficam travados (não marcam ponto à toa) até reconectar. Sem Wi-Fi na quadra? Ative o ponto de acesso do tablet/celular e conecte o Wi-Fi do relógio nele (não é o Bluetooth de sempre) — funciona igual. Só relógios Samsung/Wear OS por enquanto; Apple Watch não tem navegador de internet e ainda não é suportado.':
    'Whoever is wearing the Galaxy Watch can score points straight from their wrist, no remote control hanging off their neck. In "Set up watch" generate a 6-digit code and choose whether the watch screen dims on its own (saves battery) or stays always on. In the watch\'s browser, open the address shown there and type the code — the score (0/15/30/40), who serves and which side appear on their own, updated by the main device. Without a confirmed connection, the watch buttons stay locked (no scoring points into the void) until it reconnects. No Wi-Fi at the court? Turn on the tablet/phone\'s hotspot and connect the watch\'s own Wi-Fi to it (not the usual Bluetooth) — works the same way. Samsung/Wear OS watches only for now; Apple Watch has no general web browser and isn\'t supported yet.',

  // QuickMatchScreen
  'Um jogo único, sem rotação de torneio — vale pro ranking e pro histórico normalmente.':
    'A single match, with no tournament rotation — counts toward ranking and history like any other.',
  Duplas: 'Doubles',
  'Toque num jogador pra colocar no Time 1, toque de novo pra mover pro Time 2, e mais uma vez pra tirar.':
    'Tap a player to put them on Team 1, tap again to move them to Team 2, and once more to remove them.',
  'Ir para configurar partida': 'Go to match setup',

  // LiveMatchScreen
  'Histórico de lados:': 'Side history:',
  'Carregando partida...': 'Loading match...',
  Ponto: 'Point',
  'Games:': 'Games:',
  'Games: {x} de {y}': 'Games: {x} of {y}',
  'Sets:': 'Sets:',
  'Sets: {x} de {y}': 'Sets: {x} of {y}',
  '* super tiebreak': '* super tiebreak',
  'Super tiebreak (set decisivo)': 'Super tiebreak (deciding set)',
  'Saca agora:': 'Serving now:',
  'Resultado final': 'Final result',
  'Pontos:': 'Points:',
  'Duração:': 'Duration:',
  'Salvar partida': 'Save match',
  Desfazer: 'Undo',
  'Cancelar partida': 'Cancel match',
  '⚠ Cancelar esta partida? Os pontos jogados até agora serão perdidos e você vai precisar configurar a partida de novo (ordem de saque e lado). Isso não pode ser desfeito.':
    '⚠ Cancel this match? Points played so far will be lost and you will need to set up the match again (serve order and side). This cannot be undone.',
  'Cancelando...': 'Cancelling...',
  'Sim, cancelar partida': 'Yes, cancel match',
  'Não é possível cancelar uma partida já concluída.': 'A match that has already been completed cannot be cancelled.',

  // alerts.ts (ALERT_LABELS)
  'Set encerrado': 'Set over',
  'Tiebreak!': 'Tiebreak!',
  'Game!': 'Game!',
  'Troquem de lado': 'Change ends',
  'Ponto de ouro!': 'Golden point!',

  // PlayersScreen
  'Adicione, edite ou remova jogadores do grupo.': 'Add, edit or remove players from the group.',
  'Nome do novo jogador': 'New player name',
  Adicionar: 'Add',
  Salvar: 'Save',
  Remover: 'Remove',
  'Se já tiver partidas registradas, o jogador é arquivado (não some do histórico).':
    'If they already have recorded matches, the player is archived (does not disappear from history).',
  'Sim, remover': 'Yes, remove',
  Arquivado: 'Archived',
  Editar: 'Edit',
  'Já existe um jogador chamado "{name}".': 'A player named "{name}" already exists.',
  'O nome não pode ser vazio.': 'The name cannot be empty.',
  'O nome pode ter no máximo 16 caracteres.': 'The name can be at most 16 characters long.',
  Apelido: 'Nickname',
  'Apelido de até 3 letras': 'Nickname, up to 3 letters',
  'Usado nas telas pequenas, como o relógio — se não preencher, o app usa as 3 primeiras letras do nome.':
    'Used on small screens, like the watch — if left blank, the app uses the first 3 letters of the name.',
  'O apelido pode ter no máximo 3 letras.': 'The nickname can be at most 3 letters long.',
  'Erro ao adicionar jogador.': 'Error adding player.',
  'Erro ao salvar.': 'Error saving.',
  'Mesclar jogadores duplicados': 'Merge duplicate players',
  'Dois cadastros da mesma pessoa (ex.: nome digitado diferente)? Mescle em um só — o histórico e o ranking passam a contar tudo junto.':
    'Two records for the same person (e.g. name typed differently)? Merge them into one — history and ranking will count everything together.',
  Manter: 'Keep',
  'Mesclar e remover': 'Merge and remove',
  'Selecione...': 'Select...',
  Mesclar: 'Merge',
  'Confirmar mesclagem': 'Confirm merge',
  '⚠ Mesclar "{mergeName}" em "{keepName}"? O histórico de "{mergeName}" passa a contar como "{keepName}" e o cadastro de "{mergeName}" é removido. Essa ação não pode ser desfeita.':
    '⚠ Merge "{mergeName}" into "{keepName}"? "{mergeName}"\'s history will now count as "{keepName}", and the "{mergeName}" record will be removed. This cannot be undone.',
  'Selecione dois jogadores diferentes para mesclar.': 'Select two different players to merge.',
  'Jogador não encontrado.': 'Player not found.',
  'Esses jogadores já se enfrentaram em uma partida um contra o outro — não é possível mesclar automaticamente.':
    'These players have already faced each other in a match — cannot merge automatically.',
  'Erro ao mesclar jogadores.': 'Error merging players.',

  // RankingScreen
  'Ranking do dia': "Today's ranking",
  'Ranking geral': 'Overall ranking',
  'Do dia': 'Today',
  Geral: 'Overall',
  'Nenhuma partida concluída ainda.': 'No completed matches yet.',
  'Nem todos jogaram o mesmo número de partidas.': 'Not everyone has played the same number of matches.',
  'Agrupar por número de partidas jogadas': 'Group by number of matches played',
  'Somente partidas de torneio': 'Tournament matches only',
  Compartilhar: 'Share',
  'Gerando...': 'Generating...',
  'Gerado por Os Quase Profissionais': 'Generated by Os Quase Profissionais',
  Jogador: 'Player',
  Dupla: 'Pair',
  PJ: 'MP',
  PV: 'MW',
  SV: 'SW',
  SP: 'SL',
  GV: 'GW',
  GP: 'GL',
  PtV: 'PW',
  PtP: 'PL',
  'Ordenado por GV, desempate por PtV e depois PV. PJ partidas jogadas · PV partidas vencidas · SV sets vencidos · SP sets perdidos · GV games vencidos · GP games perdidos · PtV pontos vencidos · PtP pontos perdidos':
    'Sorted by GW, tiebroken by PW and then MW. MP matches played · MW matches won · SW sets won · SL sets lost · GW games won · GL games lost · PW points won · PL points lost',
  'Duplas: só conta quem jogou junto na mesma dupla.': 'Pairs: only counts those who played together as the same pair.',
  'Classificação por Games Vencidos (GV) — quem fez mais games no total. Empate é decidido por Pontos Vencidos (PtV) e, se ainda empatar, por Partidas Vencidas (PV). SV/SP (sets vencidos/perdidos) aparecem na tabela, de partidas melhor-de-3/5, mas não entram no critério de desempate. O critério é o mesmo pro ranking Individual e por Dupla; a diferença é só quem entra na conta: Individual credita cada jogador separadamente, Dupla só soma quando os dois jogaram juntos como a mesma dupla.':
    'Ranked by Games Won (GW) — whoever won the most games overall. Ties are broken by Points Won (PW), and if still tied, by Matches Won (MW). SV/SP (sets won/lost) show in the table, from best-of-3/5 matches, but do not factor into the tiebreak criteria. The criteria are the same for the Individual and Pair rankings; the only difference is who gets credited: Individual credits each player separately, Pair only counts it when the two played together as that exact pair.',

  // RankingReport (shared image)
  'Tempo jogado': 'Time played',
  'Média por partida': 'Average per match',

  // HistoryScreen
  'Nenhum torneio registrado ainda.': 'No tournament recorded yet.',
  'Tempo jogado (todos os torneios)': 'Time played (all tournaments)',
  'Por jogador': 'By player',
  'Por dupla': 'By pair',
  partida: 'match',
  partidas: 'matches',
  concluída: 'completed',
  concluídas: 'completed',
  'Nenhuma partida concluída.': 'No completed matches.',
  '⚠ Excluir este torneio e todas as suas partidas do histórico e do ranking? Essa ação não pode ser desfeita.':
    '⚠ Delete this tournament and all its matches from history and ranking? This action cannot be undone.',
  'Sim, excluir': 'Yes, delete',

  // BackupScreen
  'Exporte os dados pra guardar ou levar pra outro aparelho. Importar um backup só adiciona o que ainda não existe aqui — nada é sobrescrito ou duplicado.':
    'Export your data to keep or move to another device. Importing a backup only adds what does not already exist here — nothing is overwritten or duplicated.',
  Exportar: 'Export',
  'Baixa um arquivo .json com jogadores, torneios e partidas.':
    'Downloads a .json file with players, tournaments and matches.',
  'Exportar dados': 'Export data',
  'Dica: escolha "Salvar no Drive" (ou outra pasta compartilhada) pra que os outros aparelhos consigam importar depois.':
    'Tip: choose "Save to Drive" (or another shared folder) so other devices can import it later.',
  Importar: 'Import',
  'Escolha um arquivo .json exportado (deste ou de outro aparelho).':
    'Choose a .json file that was exported (from this or another device).',
  'Escolher arquivo...': 'Choose file...',
  'Importação concluída:': 'Import complete:',
  'Jogadores:': 'Players:',
  'Torneios:': 'Tournaments:',
  'Partidas:': 'Matches:',
  'adicionados,': 'added,',
  'adicionadas,': 'added,',
  'já existiam': 'already existed',
  'Resetar dados': 'Reset data',
  'Apaga todos os torneios, partidas e jogadores adicionados. Os 5 jogadores padrão (Jarede, Mateus, Mateus Adv, Emerson, Fernando) são restaurados.':
    'Erases every tournament, match and added player. The 5 default players (Jarede, Mateus, Mateus Adv, Emerson, Fernando) are restored.',
  'Dados resetados. Os 5 jogadores padrão foram restaurados.':
    'Data reset. The 5 default players have been restored.',
  '⚠ Essa ação não pode ser desfeita. Todo o histórico, ranking e jogadores personalizados serão perdidos. Digite':
    '⚠ This action cannot be undone. All history, ranking and custom players will be lost. Type',
  'pra confirmar.': 'to confirm.',
  'Resetando...': 'Resetting...',
  'Confirmar reset': 'Confirm reset',
  'Resetar tudo': 'Reset everything',
  RESETAR: 'RESET',
  'Arquivo não parece um backup válido.': 'File does not look like a valid backup.',
  'Erro ao importar o backup.': 'Error importing the backup.',

  // HelpHint
  Ajuda: 'Help',

  // Header options panel (App.tsx)
  Opções: 'Options',

  // Voice mode (App.tsx toggle + features/voice/*)
  'Modo viva-voz': 'Hands-free voice mode',
  'Velocidade da voz': 'Voice speed',
  'Voz: ON': 'Voice: ON',
  'Voz: OFF': 'Voice: OFF',
  'Voz ativada.': 'Voice on.',
  '{server} saca da {side}.': '{server} serves from the {side}.',
  'Fim de partida! {winner} venceu, {g1} a {g2}.': 'Match over! {winner} won, {g1} to {g2}.',
  'Fim de partida! {winner} venceu. Sets: {s1} a {s2}.': 'Match over! {winner} won. Sets: {s1} to {s2}.',
  'Fim do set! {winner} venceu, {g1} a {g2}. Sets: {s1} a {s2}.':
    'Set over! {winner} won, {g1} to {g2}. Sets: {s1} to {s2}.',
  'Super tiebreak decisivo!': 'Deciding super tiebreak!',
  'Troquem de lado — Time 1 na {side1}, Time 2 na {side2}.':
    'Change ends — Team 1 on the {side1}, Team 2 on the {side2}.',
  '{winner} venceu o game!': '{winner} won the game!',
  'Games: Time 1, {g1}. Time 2, {g2}.': 'Games: Team 1, {g1}. Team 2, {g2}.',
  'Tiebreak. Time 1, {p1}. Time 2, {p2}.': 'Tiebreak. Team 1, {p1}. Team 2, {p2}.',
  'Time 1, {p1}. Time 2, {p2}.': 'Team 1, {p1}. Team 2, {p2}.',
  'Comandos de voz': 'Voice commands',
  'Comandos: ON': 'Commands: ON',
  'Comandos: OFF': 'Commands: OFF',

  // Remote control (features/keys/*)
  'Controle remoto': 'Remote control',
  'Mapear teclas do apresentador': 'Map presenter keys',
  'Mapeie as teclas de um controle físico (ex. um "clicker" de apresentação USB) para marcar pontos e outros comandos sem tocar no aparelho. Funciona com qualquer controle que emule teclado, não só um modelo específico.':
    'Map the buttons of a physical remote (e.g. a USB presentation "clicker") to score points and other commands without touching the phone. Works with any device that emulates a keyboard, not just one specific model.',
  'Ponto Time 1': 'Point Team 1',
  'Ponto Time 2': 'Point Team 2',
  'Repetir anúncio': 'Repeat announcement',
  'Não definida': 'Not set',
  Definir: 'Set',
  Limpar: 'Clear',
  'Aguardando tecla... (Esc para cancelar)': 'Waiting for a key... (Esc to cancel)',

  // Layout mode (LiveMatchScreen)
  'Modo de layout': 'Layout mode',
  Automático: 'Automatic',
}
