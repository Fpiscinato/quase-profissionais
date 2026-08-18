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
  'Em "Jogadores", adicione o grupo (nome e pronto). Dá pra editar ou excluir depois — quem já tem partida registrada é arquivado, não some do histórico.':
    'In "Players", add your group (just a name). You can edit or remove them later — anyone with a recorded match gets archived instead, so history keeps working.',
  '2. Comece um torneio': '2. Start a tournament',
  'No botão "Torneio": primeiro marque quem está jogando hoje, depois escolha o formato (Duplas ou Individual), a formação das duplas (Balanceado sorteia justo, Manual você escolhe) e quantos games decidem o set. Toque em "Confirmar e criar torneio".':
    'In the "Tournament" button: first check who is playing today, then choose the format (Doubles or Singles), how pairs are formed (Balanced draws fairly, Manual lets you choose) and how many games decide the set. Tap "Confirm and create tournament".',
  '3. Ou pratique (sem torneio)': '3. Or practice (no tournament)',
  'Em "Praticar" você escolhe o formato, os jogadores dos dois times e quantos games decidem o set, sem passar pela disponibilidade ou rotação — direto pra configurar e jogar. Conta pro ranking e histórico normalmente, mas dá pra excluir essas partidas com o checkbox "Somente partidas de torneio" no Ranking e no Histórico, se quiser separar treino de valendo.':
    'In "Practice" you pick the format, the players on each side, and how many games decide the set, skipping availability and rotation entirely — straight to setup and play. It counts toward ranking and history like any other match, but you can exclude these matches with the "Tournament matches only" checkbox on Ranking and History, if you want to keep practice separate from real matches.',
  '4. Jogue as rodadas': '4. Play the rounds',
  'A tela "Rodadas" lista os confrontos do dia. Toque em "Configurar partida" pra definir quem saca primeiro e o lado inicial da quadra, depois "Iniciar partida" pra abrir a tela ao vivo.':
    'The "Rounds" screen lists the day\'s matchups. Tap "Set up match" to set who serves first and the starting side of the court, then "Start match" to open the live screen.',
  '5. Tela ao vivo': '5. Live screen',
  'Os botões grandes somam ponto pra cada time. A tela mostra quem saca, de que lado, e avisa na hora de trocar de lado ou de fechar o set. Errou o toque? "Desfazer" volta um ponto. No final, "Salvar partida" grava o resultado.':
    'The big buttons add a point for each team. The screen shows who is serving, from which side, and alerts you when to change ends or when the set closes. Mistapped? "Undo" steps back one point. At the end, "Save match" records the result.',
  '6. Ranking': '6. Ranking',
  '"Ranking" mostra a classificação do torneio do dia e o ranking geral (todos os torneios já jogados), tanto individual quanto por dupla. Marque "Somente partidas de torneio" pra deixar de fora as partidas feitas em "Praticar". O botão "Compartilhar" gera uma imagem com os dois rankings e o tempo jogado, pronta pra mandar no grupo.':
    '"Ranking" shows today\'s tournament standings and the overall ranking (every tournament ever played), both individual and by pair. Check "Tournament matches only" to leave out matches made in "Practice". The "Compartilhar" button generates an image with both rankings and the time played, ready to send to the group.',
  '7. Histórico': '7. History',
  '"Histórico" guarda todos os torneios e partidas anteriores, com placar, duração e tempo total jogado por jogador e por dupla — o mesmo checkbox "Somente partidas de torneio" também funciona aqui, só pro card de tempo jogado.':
    '"History" keeps every past tournament and match, with score, duration and total time played per player and per pair — the same "Tournament matches only" checkbox also works here, just for the time-played card.',
  '8. Backup': '8. Backup',
  'Em "Backup" você exporta todos os dados (jogadores, torneios, partidas) num arquivo, pra guardar ou levar pra outro aparelho. No celular, "Exportar dados" abre o menu de compartilhar — escolha "Salvar no Drive" (ou outra pasta compartilhada) pra que os outros aparelhos consigam importar de lá depois. Importar mescla esse arquivo com o que já está salvo, sem apagar nada sem confirmar.':
    'In "Backup" you export all your data (players, tournaments, matches) to a file, to keep or move to another device. On a phone, "Exportar dados" opens the share menu — choose "Save to Drive" (or another shared folder) so other devices can import it from there later. Importing merges that file with what is already saved, never deleting anything without confirmation.',
  '9. Modo viva-voz': '9. Hands-free voice mode',
  'No topo da tela, "🎙 Voz" liga os anúncios falados (placar, quem saca, troca de lado), com um botão de velocidade ao lado (padrão 1.5x). "🎤 Comandos" é um toggle separado, desligado por padrão, que liga o reconhecimento de voz pra marcar ponto falando "Ponto Time 1" / "Ponto Time 2" ou repetir o último anúncio dizendo "Repita" — em testes reais isso errou bastante (microfone longe, tela apagando), então fica por sua conta ativar. Só funciona em Android/Chrome.':
    'At the top of the screen, "🎙 Voice" turns on spoken announcements (score, who serves, change of ends), with a speed button next to it (default 1.5x). "🎤 Commands" is a separate toggle, off by default, that turns on speech recognition to score by saying "Point Team 1" / "Point Team 2" or repeat the last announcement by saying "Repeat" — in real testing this missed a lot (mic too far, screen turning off), so it is up to you to turn on. Only works on Android/Chrome.',
  '10. Controle remoto': '10. Remote control',
  'Em "Controle remoto" você mapeia os botões de um controle físico (ex. um "clicker" de apresentação USB) pra Ponto Time 1, Ponto Time 2, Repetir anúncio, Desfazer e Salvar partida. Toque em "Definir", aperte o botão do controle, pronto — funciona com qualquer controle que emule teclado, não só um modelo específico. A tela ao vivo escuta esses botões o tempo todo, mesmo com o Modo viva-voz desligado.':
    'In "Remote control" you map a physical remote\'s buttons (e.g. a USB presentation "clicker") to Point Team 1, Point Team 2, Repeat announcement, Undo and Save match. Tap "Set", press the remote\'s button, done — works with any device that emulates a keyboard, not just one specific model. The live screen listens for these buttons the whole time, even with Hands-free voice mode off.',
  '11. Layout tablet': '11. Tablet layout',
  'A tela ao vivo tem um botão "📐" (perto do cronômetro) que alterna entre Automático, Tablet e Smartphone. Automático detecta o tamanho da tela sozinho; Tablet espalha os times e o placar lado a lado, útil numa tela maior; Smartphone mantém o layout empilhado de sempre.':
    'The live screen has a "📐" button (near the timer) that cycles through Automatic, Tablet and Smartphone. Automatic detects the screen size on its own; Tablet spreads the teams and score side by side, useful on a bigger screen; Smartphone keeps the usual stacked layout.',

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
  GV: 'GW',
  GP: 'GL',
  PtV: 'PW',
  PtP: 'PL',
  'Ordenado por GV, desempate por PtV e depois PV. PJ partidas jogadas · PV partidas vencidas · GV games vencidos · GP games perdidos · PtV pontos vencidos · PtP pontos perdidos':
    'Sorted by GW, tiebroken by PW and then MW. MP matches played · MW matches won · GW games won · GL games lost · PW points won · PL points lost',
  'Duplas: só conta quem jogou junto na mesma dupla.': 'Pairs: only counts those who played together as the same pair.',
  'Classificação por Games Vencidos (GV) — quem fez mais games no total. Empate é decidido por Pontos Vencidos (PtV) e, se ainda empatar, por Partidas Vencidas (PV). O critério é o mesmo pro ranking Individual e por Dupla; a diferença é só quem entra na conta: Individual credita cada jogador separadamente, Dupla só soma quando os dois jogaram juntos como a mesma dupla.':
    'Ranked by Games Won (GW) — whoever won the most games overall. Ties are broken by Points Won (PW), and if still tied, by Matches Won (MW). The criteria are the same for the Individual and Pair rankings; the only difference is who gets credited: Individual credits each player separately, Pair only counts it when the two played together as that exact pair.',

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
