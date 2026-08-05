import { card } from '../../ui/styles'

const CARDS = [
  {
    title: 'Pontos',
    body: '0 → 15 → 30 → 40 → game. Em 40-40 ("deuce"/iguais), precisa ganhar 2 pontos seguidos pra fechar o game.',
  },
  {
    title: 'Set curto',
    body: 'Vence o set quem fizer primeiro um número de games definido pelo organizador na criação do torneio (de 2 a 6, padrão 4), com 2 de diferença. Se os dois times chegarem juntos nesse número (ex.: 4-4), vai pro tiebreak.',
  },
  {
    title: 'Saque em duplas',
    body: 'Cada jogador saca um game inteiro (todos os pontos daquele game). A vez de sacar roda entre os quatro jogadores em quadra, alternando os times a cada game. Dentro do game, o lado da quadra troca a cada ponto: Direita no placar 0 e nos pares, Esquerda nos ímpares.',
  },
  {
    title: 'Troca de lado',
    body: 'Os times trocam de lado da quadra a cada número ímpar de games completados (após o 1º, 3º, 5º...). A tela ao vivo avisa "Troquem de lado" com uma animação de quadra na hora certa.',
  },
  {
    title: 'Ponto de ouro (no-ad)',
    body: 'Quando essa opção está ativada: no 40-40, o próximo ponto já decide o game — sem precisar de 2 de vantagem. É tudo ou nada.',
  },
  {
    title: 'Tiebreak',
    body: 'Quando os games empatam no topo do set (ex.: 4-4), joga-se um desempate até 7 pontos, precisando de 2 de vantagem, pra decidir o set.',
  },
]

export function GuideScreen() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Como jogar</h1>
        <p className="text-sm text-cream/70">
          As regras do Tennis Americano, resumidas. A tela ao vivo te guia durante a partida —
          quem saca, de que lado, e quando trocar de lado.
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
