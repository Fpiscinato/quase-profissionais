# CLAUDE.md — Quase Profissionais

Ordem de leitura antes de alterar código:

1. `README.md` — comportamento e comandos atuais (fonte da verdade).
2. `SPEC.md` — plano original da v1 (**histórico**; o código/README vencem).
3. `relay-worker/RELAY.md` — só ao mexer no relay do relógio.

## Segurança (não negociável)

- Nunca commitar `.env`, `.env.*`, `opencode.json`, `.dev.vars`, `*.key`, `*.pem`
  ou qualquer token. O `.gitignore` já bloqueia; nunca usar `git add -f` nesses ficheiros.
- Credenciais da Cloudflare só no painel/CI secrets — nunca no código, no
  `wrangler.jsonc`/`wrangler.toml` ou na documentação. O deploy é pela integração
  Git da Cloudflare.
- O `relay-worker/` não guarda dados nem usa tokens; mantenha-o assim.
- Antes de cada push: `git status --short` + `git diff --cached`. Se um segredo
  vazar, revogue primeiro (Cloudflare/GitHub) e só depois limpe o histórico.
