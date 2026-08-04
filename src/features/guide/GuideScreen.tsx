import { card } from '../../ui/styles'

const CARDS = [
  {
    title: 'Pontos',
    body: '0 → 15 → 30 → 40 → game. 40-40 é "deuce" (iguais): a partir daí, precisa ganhar 2 pontos seguidos.',
  },
  {
    title: 'Set curto',
    body: 'Primeiro a 4 games, com 2 de diferença. Se empatar (set-all), vai para o tiebreak.',
  },
  {
    title: 'Saque em duplas',
    body: 'Cada jogador saca um game inteiro. A vez de sacar roda entre os quatro jogadores em quadra.',
  },
  {
    title: 'Troca de lado',
    body: 'Os times trocam de lado da quadra a cada número ímpar de games (1, 3, 5...).',
  },
  {
    title: 'Ponto de ouro (no-ad)',
    body: 'Quando ativado: no 40-40, o próximo ponto já decide o game — sem precisar de 2 de vantagem.',
  },
  {
    title: 'Tiebreak',
    body: 'Quando os games empatam no topo do set (ex: 4-4), um desempate até 7 pontos (com 2 de vantagem) decide o set.',
  },
]

export function GuideScreen() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Como jogar</h1>
        <p className="text-sm text-cream/70">
          O básico pra jogar sem stress. A tela ao vivo te guia durante a partida.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CARDS.map((c) => (
          <div key={c.title} className={card}>
            <h2 className="mb-1 font-bold text-lime">{c.title}</h2>
            <p className="text-sm text-cream/85">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
