# Tennis Americano Manager — Authoritative Spec (v1)

Single source of truth. Read at the start of every session. If code conflicts
with this file, THIS FILE WINS. Do not add features not described here.
New repository, same delivery pipeline as the darts app (GitHub -> Cloudflare).

## 0. Non-negotiable architecture
- **Static PWA. NO backend, NO server, NO database server.** (Do NOT add
  PocketBase or any backend — the darts project drifted into that by mistake.)
- Persistence: IndexedDB via Dexie.js, on-device. localStorage only for tiny UI
  prefs. No login.
- Offline-first, installable PWA (manifest + service worker + standalone).
- Stack: React + TypeScript + Vite + Tailwind. shadcn/ui only for dialogs/inputs.
- Hosting: Cloudflare Pages (static), deploy from GitHub.
- Mobile-first, portrait, one phone operates the match. From ~320px wide.
- All scoring/tournament logic in pure, tested functions, separate from UI.
- UI language: Portuguese (Brazil).

## 1. Players & availability
- Preloaded players: Jarede, Mateus, Mateus Adv, Emerson, Fernando.
- Add / edit / remove players. Permanent internal IDs (never names as keys).
- **On first run AND on every full reset, seed exactly these 5 defaults.** A full
  reset clears tournaments/history and restores these five players.
- Before a tournament, the organiser marks who is available today (checkbox).
  The rotation is built only from available players.
- Minimum 2 available. Doubles needs 4 on court; with 2-3 available, only
  Individual (singles) is offered. Designed around ~2-8.

## 2. Rotation & formats (doubles Americano + singles, 1 court)
- 1 court: one match at a time. Each round, 4 play (2 v 2), the rest sit out.
- Schedule must be **balanced**, not pure random: rests spread evenly (no one
  rests twice before all have rested once); partners/opponents varied.
- Randomise the seeding, then apply the balanced schedule (feels random, plays fair).
- **Canonical 5-player schedule** (implement and unit-test this exact case) —
  each rests once and partners each of the others once across 5 rounds:
  - R1: A&B vs C&D  — E rests
  - R2: A&C vs B&E  — D rests
  - R3: A&E vs B&D  — C rests
  - R4: A&D vs C&E  — B rests
  - R5: B&C vs D&E  — A rests
- For other counts, generate an equivalent balanced rotation. Rounds configurable
  (default: one full cycle where everyone has rested once).
- **Individual (singles) format** — for low-turnout days (2-3) or when chosen.
  Round robin: everyone plays everyone once, 1 court, one match at a time.
  2 players = 1 match; 3 = 3 matches (one rests each); 4 = 6. Best for 2-4.
  Ranking stays individual (each match credits the single player).

## 3. Match format (defaults — configurable per Section 12)
- One short set per match: first to 4 games, win by 2 (default).
- At 4-4 games -> tiebreak: first to 7 points, win by 2. Set recorded 5-4.
- Game scoring: 0, 15, 30, 40, game. At 40-40 = deuce, advantage (win by 2 pts).
- One set = one match.
- Record per match: games and points won by each side, winner.

## 4. Serve / side / change-of-ends engine (CORE — get this right)
Compute everything from the point log to guide players live.
"Direita (iguais)" = deuce court, "Esquerda (vantagem)" = ad court.
- Serve order (set at match start; randomised or chosen): a rotation of the
  players [S1, S2, ...]; consecutive servers are on opposite teams; each serves a
  whole game; game 1 -> S1, game 2 -> S2, ...
- **Team size 1 (singles) or 2 (doubles).** Serve order list length 2 or 4,
  rotating by game the same way. Side/change-ends logic identical for singles.
- Serving side: point 1 from Direita, then alternate each point (deuce if points
  completed in the game is even, ad if odd).
- Change of ends: after every game where total games in the set is odd (1,3,5,7).
  In a tiebreak: change ends every 6 points. Show "Troquem de lado" alert.
- Tiebreak serving (at set-all): first server 1 point (Direita), then each next
  server 2 points in rotation; side alternates each point (odd->Direita,
  even->Esquerda); first to 7, win by 2.
- Pure functions: nextServer, serveSide, shouldChangeEnds, applyPoint,
  isGameOver, isSetOver, isTiebreak. Deterministic and unit-tested.

## 5. Live match screen
Always show: teams/players, current game points, set score in games, tiebreak
score when active, **"Saca agora: [jogador] — [Direita/Esquerda]"**, and alerts
("Troquem de lado", "Tiebreak!", "Game!", "Set encerrado").
Controls (large, >=44px): "Ponto — Time 1", "Ponto — Time 2", "Desfazer".
Every tap recomputes score/server/side/ends from the log. Block input after the
set is decided; show result + "Salvar partida". Preserve match across restart.

## 6. Individual ranking
- Each match credits BOTH players on a side with that side's games and points
  (singles credits the one player).
- Columns: Position, Player, Matches Played, Matches Won, Games Won, Games Lost,
  Points Won, Points Lost.
- Order: 1) Games Won, 2) Points Won, 3) Matches Won. Champion = top after all
  rounds. If matches played are uneven, show a note.
- **Two ranking views, both computed from stored matches:** "Ranking do dia"
  (current tournament) and "Ranking geral" (all-time, summing every tournament).
  History is kept per match until a full reset.

## 7. Data model (key points)
- Player: id, name, active.
- Tournament: id, date, availablePlayerIds[], format, options, rounds[], status.
- Round: index, restingPlayerIds[], matchId.
- Match: id, tournamentId, roundIndex, team1[ids], team2[ids], serveOrder[ids],
  pointLog[], games1, games2, points1, points2, winnerTeam, status,
  startedAt, completedAt, durationSeconds.
- Standings derived from completed matches. AppSettings: schemaVersion,
  currentTournamentId, currentMatchId.

## 8. Build phases & acceptance
**Phase 1 — engine + tests FIRST (no UI):**
- Game: 40-40 needs 2 straight points; normal game first-to-4-points by 2.
- Set: first to 4 by 2; set-all triggers tiebreak; tiebreak first to 7 by 2;
  set recorded 5-4.
- Serve order rotates by game, alternating teams; side alternates each point,
  starting Direita.
- Change ends after odd total games; every 6 points in a tiebreak.
- Tiebreak serving: first server 1 point, then 2 points each in rotation.
- 5-player rotation equals the canonical schedule in Section 2.
- Singles: serve alternates between 2 players by game; 2-player match works;
  3-player singles round robin = 3 matches.
- Ranking credits both partners; orders Games Won -> Points Won -> Matches Won.
**Phase 2:** availability + rotation UI; match setup (teams, serve order).
**Phase 3:** live match screen with full serve/side/ends guidance; save results.
**Phase 4:** ranking (do dia + geral); backup export/import (JSON); in-app guide;
PWA (offline, installable); deploy to Cloudflare.
**Done only when** npm run test and npm run build pass with zero errors, all
Phase-1 tests green, app runs offline as a static PWA, no backend.

## 9. Branding & visual identity
- App title: "Os Quase Profissionais".
- Group logo (navy tennis-ball mascot) on splash + Home header; small in top bar
  elsewhere. File at public/logo.png.
- Palette from logo: navy background (#152142), lime accent (#A4CE3A), cream text
  (#F2F0E6), white highlights. Gold for champion, red for destructive actions.
- Tone: playful "weekend beginners", friendly and encouraging, never intimidating.

## 10. Beginner guide ("Como jogar")
- A "Como jogar" screen from Home with short plain cards:
  1. Pontos: 0 -> 15 -> 30 -> 40 -> game. 40-40 = deuce, ganha 2 seguidos.
  2. Set curto: primeiro a 4 games (2 de diferenca); set-all vai a tiebreak.
  3. Saque em duplas: cada um saca um game inteiro; a vez roda entre os jogadores.
  4. Troca de lado: a cada numero impar de games.
  5. Ponto de ouro (no-ad): no 40-40, o proximo ponto ja decide o game.
  6. Tiebreak: quando os games empatam no topo (4-4 ou 6-6), um desempate ate
     7 pontos decide o set.
- **The live match screen is the main teacher** (server, side, change ends).
- Context help: every setup option has a "?" with a one-line explanation; the
  live screen announces when a golden point or tiebreak is being played.

## 11. Match timer & history
- Each match records **duration**: start when it opens, stop when saved
  (durationSeconds). Show timer live; final duration in history.
- History per match: date, round, teams, games score, points, winner, duration.
- Stats (later): total play time, average match length, longest match.

## 12. Configurable options (set at tournament creation)
Engine is **parameterized: ONE tested code path**. Do NOT fork code per option.
**v1 options:**
- Format presets (one tap; then "Avancado" to fine-tune):
  - Rapido: set a 4 games, com vantagem (default).
  - Padrao reduzido: 1 set a 6 games, tiebreak em 6-6, ponto de ouro (no-ad).
  - Por tempo: 15 min por rodada.
- Team format: Duplas (Americano, 4+) OR Individual (singles, 2+). Same engine,
  team size 1 or 2.
- Scoring mode: Por games (default) OR Por tempo.
- If Por games: set size 4 (default) or 6; win by 2; tiebreak at set-all, first
  to 7 by 2.
- If Por tempo: minutes per round (default 15; 10/15/20). When time runs out,
  finish the current game, most games wins; if tied, play one deciding game.
- Deuce: Vantagem OR Ponto de ouro (no-ad).
- Rounds: Auto (one full cycle) OR fixed number.
- Availability checkbox; serve order randomised or chosen at match start.
**Later (out of v1):** best-of-3-sets, knockout bracket, advanced stats.
