# Relay do relógio — passo a passo pra colocar no ar

Esse Worker é separado do site principal porque Durable Objects (a peça
que faz a "sala" de pareamento) não pode viver dentro de um projeto
Cloudflare Pages — precisa ser um Worker próprio. Só precisa fazer isso
**uma vez**.

1. Tenha o Node instalado (o mesmo que já usa pra rodar `npm run dev` no
   app principal serve).
2. Nesta pasta (`relay-worker/`):
   ```
   npm install
   npx wrangler login
   ```
   Isso abre o navegador pra você logar na sua conta Cloudflare (a mesma
   que já hospeda `quase-profissionais.f-piscinato.workers.dev`).
3. Publicar:
   ```
   npx wrangler deploy
   ```
4. O comando termina imprimindo uma URL parecida com:
   ```
   https://quase-profissionais-relay.<sua-subdomínio>.workers.dev
   ```
   **Copie essa URL.**
5. Cole essa URL em `src/features/watch/relayConfig.ts` (no app
   principal), na constante `RELAY_URL`, trocando `wss://` no lugar de
   `https://` (ex.: `wss://quase-profissionais-relay.<sua-subdomínio>.workers.dev`).
   Depois é só commitar/dar push do app principal de novo — o Cloudflare
   Pages já redeploya sozinho, como sempre.

Não precisa mexer em mais nada no painel do Cloudflare além do login do
`wrangler` — esse Worker já vem com o Durable Object configurado
(`wrangler.toml`). Se um dia quiser trocar de conta/projeto, é só repetir
esses passos.

## O que esse Worker faz (e o que ele NÃO faz)

- Só existe enquanto uma partida está rolando: cada "sala" (identificada
  pelo código de 6 dígitos gerado em "Configurar relógio") só repassa
  mensagens entre exatamente 2 conexões (o app e o relógio) e nunca grava
  nada em disco — sem banco de dados, sem histórico, sem conta de
  usuário.
- Salas sem uso são encerradas sozinhas depois de 4h.
- Se dois códigos diferentes forem usados ao mesmo tempo por grupos
  diferentes, cada um vira sua própria sala isolada — não tem como um
  grupo ver os pontos do outro.
