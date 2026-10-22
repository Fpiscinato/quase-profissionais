# Os Quase Profissionais

Tennis Americano Manager — PWA estática com **relógio (match watch) opcional via
relay**: o app é 100% local, mas o modo relógio usa um Worker separado só para
repassar mensagens ao vivo entre os aparelhos (tablet/celular) e o relógio.

**Site no ar:** <https://quase-profissionais.f-piscinato.workers.dev> ·
**versão atual:** `2.6` (`src/version.ts`)

> A especificação original está em [`SPEC.md`](SPEC.md) — mas é a **v1** e ficou
> atrás do código em alguns pontos (idioma, relay, hospedagem). O que vale hoje
> é o código e este README.

## Dev

```sh
npm install
npm run dev
npm run test    # 184 testes (engine, etc.)
npm run build   # typecheck + production build
npm run lint    # oxlint
npm run preview # serve o build de produção
```

## O que o app faz

- **Motor de jogo** como funções puras e testadas em `src/engine/` (pontuação,
  saque, rotação, ranking, calendário, estatísticas).
- **Wizard de torneio** com sorteio, resultado rápido e tela de match ao vivo.
- **Ranking e head-to-head** entre jogadores, com relatório (o ranking vai
  impresso/copiado em formato texto).
- **Atalhos de teclado e comandos de voz** para marcar ponto durante o match.
- **Modo relógio (watch)**: o relógio e o tablet conversam ao vivo através do
  relay worker (`relay-worker/`) — sala por código de pareamento, sem gravar
  nada.
- **Backup em JSON**, **histórico** de torneios e **guia** dentro do app.
- **Dois idiomas**: português e inglês (`src/i18n/`).

## Estrutura

```
src/
  engine/      regras puras (score, serve, ranking, schedule, stats) + testes
  features/    home, tournament, match, ranking, players, watch, voice, keys,
               quickmatch, history, backup, guide
  db/          Dexie (IndexedDB)
  i18n/        pt/en
  lib/         utilitários
  ui/          componentes compartilhados
relay-worker/  Worker separado (Durable Object) só pro modo relógio
```

## Deploy

O **site** é estático e vai para Cloudflare Workers
(`https://quase-profissionais.f-piscinato.workers.dev`), com deploy automático
pela integração Git da Cloudflare (cada push em `main` publica sozinho).

O **relay worker** é um projeto Cloudflare separado (`relay-worker/`, worker
`quase-profissionais-relay`) e **precisa de deploy manual** — é um Worker com
Durable Object, não cabe no projeto estático:

```sh
cd relay-worker
npx wrangler login     # uma vez
npx wrangler deploy
```

O endpoint usado pelo app está em `src/features/watch/relayConfig.ts`
(`wss://quase-profissionais-relay.f-piscinato.workers.dev`); o passo a passo
está em [`relay-worker/RELAY.md`](relay-worker/RELAY.md).

> Sem o relay publicado, tudo funciona **menos** o modo relógio (o resto do app
> não depende dele).
