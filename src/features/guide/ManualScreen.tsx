import { card } from '../../ui/styles'
import { useT } from '../../i18n/useT'

const SECTIONS = [
  {
    title: '1. Cadastre os jogadores',
    body: 'Em "Jogadores", adicione o grupo (nome e pronto). Dá pra editar ou excluir depois — quem já tem partida registrada é arquivado, não some do histórico. Cadastrou o mesmo jogador duas vezes por engano (nomes diferentes)? A seção "Mesclar jogadores duplicados", mais abaixo na mesma tela, junta os dois num só sem perder o histórico de nenhum dos dois.',
  },
  {
    title: '2. Comece um torneio',
    body: 'No botão "Torneio": primeiro marque quem está jogando hoje, depois escolha o formato (Duplas ou Individual), a formação das duplas (Balanceado sorteia justo, Manual você escolhe), quantos games decidem o set e quantos sets decidem a partida (1 set, melhor de 3 ou melhor de 5 — no set decisivo de uma melhor-de-3/5, empate vira super-tiebreak até 10 pontos em vez de mais um set cheio). Toque em "Confirmar e criar torneio".',
  },
  {
    title: '3. Ou pratique (sem torneio)',
    body: 'Em "Praticar" você escolhe o formato, os jogadores dos dois times, quantos games decidem o set e quantos sets decidem a partida, sem passar pela disponibilidade ou rotação — direto pra configurar e jogar. Conta pro ranking e histórico normalmente, mas dá pra excluir essas partidas com o checkbox "Somente partidas de torneio" no Ranking e no Histórico, se quiser separar treino de valendo.',
  },
  {
    title: '4. Jogue as rodadas',
    body: 'A tela "Rodadas" lista os confrontos do dia. Toque em "Configurar partida" pra definir quem saca primeiro, o lado inicial da quadra e, se alguém for marcar os pontos pelo controle remoto físico, quem é essa pessoa e se o time dela fica sempre como Time 1 ou Time 2 (o app troca os times automaticamente pra isso — fica lembrado no aparelho pras próximas partidas). Depois é só "Iniciar partida" pra abrir a tela ao vivo. Se já sabe que vai começar na hora, use direto o botão "Confirmar e iniciar partida" — ele pula a volta pra lista de rodadas e já abre o jogo ao vivo.',
  },
  {
    title: '5. Tela ao vivo',
    body: 'Os botões grandes somam ponto pra cada time. A tela mostra quem saca, de que lado, e avisa na hora de trocar de lado ou de fechar o set. No topo, ao lado do cronômetro, o placar "Games: X de Y" e duas fileiras de caixinhas (uma por time, na cor de cada um) mostram quantos games cada time já ganhou e quantos faltam pra fechar o set. O histórico de lado da quadra (as letras D/E embaixo do nome do time) mostra só as últimas 5 trocas, pra não estourar a tela em sets que vão pro tiebreak longo. Numa partida melhor-de-3/5, uma segunda fileira azul mostra os sets ganhos por cada time, e um aviso "Set encerrado" aparece entre um set e outro; o set decisivo (empate 1-1 ou 2-2) vira um super-tiebreak até 10 pontos. Errou o toque? "Desfazer" volta um ponto. No final, "Salvar partida" grava o resultado.',
  },
  {
    title: '6. Ranking',
    body: '"Ranking" mostra a classificação do dia (com seletor pra escolher outra data) e o ranking geral (todos os torneios já jogados), tanto individual quanto por dupla — as colunas SV/SP mostram sets vencidos/perdidos ao lado de games e pontos. Marque "Somente partidas de torneio" pra deixar de fora as partidas feitas em "Praticar". O botão "Compartilhar" gera uma imagem com os dois rankings, a legenda explicando cada coluna e o tempo jogado — sempre do mesmo recorte (dia ou geral) que está selecionado na tela.',
  },
  {
    title: '7. Histórico',
    body: '"Histórico" guarda todos os torneios e partidas anteriores, agrupados por dia — cada dia mostra quantas partidas teve e o tempo total jogado naquele dia, além do placar, duração e tempo total jogado por jogador e por dupla no card do topo. Numa partida melhor-de-3/5, o placar de cada partida mostra os sets (com o resultado de cada um) além do total de games. O mesmo checkbox "Somente partidas de torneio" também funciona aqui.',
  },
  {
    title: '8. Backup',
    body: 'Em "Backup" você exporta todos os dados (jogadores, torneios, partidas) num arquivo, pra guardar ou levar pra outro aparelho. No celular, "Exportar dados" abre o menu de compartilhar — escolha "Salvar no Drive" (ou outra pasta compartilhada) pra que os outros aparelhos consigam importar de lá depois. Importar mescla esse arquivo com o que já está salvo, sem apagar nada sem confirmar.',
  },
  {
    title: '9. Modo viva-voz',
    body: 'No topo da tela, "🎙 Voz" liga os anúncios falados (placar, quem saca, troca de lado), com um botão de velocidade ao lado (padrão 1.5x). "🎤 Comandos" é um toggle separado, desligado por padrão, que liga o reconhecimento de voz pra marcar ponto falando "Ponto Time 1" / "Ponto Time 2" ou repetir o último anúncio dizendo "Repita" — em testes reais isso errou bastante (microfone longe, tela apagando), então fica por sua conta ativar. Só funciona em Android/Chrome.',
  },
  {
    title: '10. Controle remoto',
    body: 'Em "Controle remoto" você mapeia os botões de um controle físico (ex. um "clicker" de apresentação USB) pra Ponto Time 1, Ponto Time 2, Repetir anúncio, Desfazer e Salvar partida. Toque em "Definir", aperte o botão do controle, pronto — funciona com qualquer controle que emule teclado, não só um modelo específico. A tela ao vivo escuta esses botões o tempo todo, mesmo com o Modo viva-voz desligado. Se quem aperta o controle se confunde com a troca de times a cada rodada, use "Jogador com o controle remoto" em "Configurar partida" pra fixar o time dele sempre no mesmo botão.',
  },
  {
    title: '11. Layout tablet',
    body: 'A tela ao vivo tem um botão "📐" (perto do cronômetro) que alterna entre Automático, Tablet e Smartphone. Automático detecta o tamanho da tela sozinho; Tablet espalha os times e o placar lado a lado, útil numa tela maior; Smartphone mantém o layout empilhado de sempre.',
  },
  {
    title: '12. Termos do tênis',
    body: 'Ace: ponto de saque que o adversário nem consegue tocar. Dupla falta: dois saques errados seguidos — ponto pro time adversário. Let: o saque toca a rede e cai no lugar certo — repete o saque, sem contar como falta. 40 a 40 é Deuce; quem ganha o ponto seguinte fica com a Vantagem (AD) e precisa vencer mais um ponto pra fechar o game (senão volta pro Deuce). Quebra de saque (break): vencer um game em que era o adversário quem estava sacando. Match point / set point: o ponto que, se vencido, decide a partida ou o set ali mesmo.',
  },
  {
    title: '13. Relógio (Wear OS)',
    body: 'Quem estiver com o Galaxy Watch pode marcar os pontos direto do pulso, sem carregar o controle remoto pendurado no pescoço. Em "Configurar relógio" gere um código de 6 dígitos e escolha se a tela do relógio escurece sozinha (economiza bateria) ou fica sempre ativa. No navegador do relógio, abra o endereço indicado ali e digite o código — o placar (0/15/30/40), quem saca e o lado aparecem sozinhos, atualizados pelo aparelho principal. Sem conexão confirmada, os botões do relógio ficam travados (não marcam ponto à toa) até reconectar. Sem Wi-Fi na quadra? Ative o ponto de acesso do tablet/celular e conecte o Wi-Fi do relógio nele (não é o Bluetooth de sempre) — funciona igual. Só relógios Samsung/Wear OS por enquanto; Apple Watch não tem navegador de internet e ainda não é suportado.',
  },
]

export function ManualScreen() {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Como usar o app')}</h1>
        <p className="text-sm text-cream/70">
          {t(
            'Um passo a passo rápido, do cadastro dos jogadores até o fim do torneio. Tudo funciona offline, direto no seu aparelho.',
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <div key={s.title} className={card}>
            <h2 className="mb-1 font-bold text-lime">{t(s.title)}</h2>
            <p className="text-sm text-cream/85">{t(s.body)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
