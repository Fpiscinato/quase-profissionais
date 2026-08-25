import { card } from '../../ui/styles'
import { useT } from '../../i18n/useT'

const CARDS = [
  {
    title: 'Pontos',
    body: '0 → 15 → 30 → 40 → game. Em 40-40 ("deuce"/iguais), precisa ganhar 2 pontos seguidos pra fechar o game.',
  },
  {
    title: 'Set curto',
    body: 'Vence o set quem fizer primeiro um número de games definido pelo organizador na criação do torneio (de 2 a 6, padrão 4), com 2 de diferença. Se os dois times chegarem juntos nesse número (ex.: 4-4), vai pro tiebreak. No tênis oficial o padrão é set até 6 games — aqui usamos um set mais curto de propósito, pra jogos mais rápidos e mais rodadas no dia. Todas as outras regras (pontuação, saque, troca de lado, tiebreak) seguem exatamente o padrão oficial.',
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
    body: 'Quando os games empatam no topo do set (ex.: 4-4), joga-se um desempate até 7 pontos, precisando de 2 de vantagem, pra decidir o set. Quem sacaria o próximo game saca sozinho o 1º ponto do tiebreak; dali em diante o saque troca de time a cada 2 pontos. A troca de lado acontece a cada 6 pontos somados (6, 12, 18...) e de novo ao final do tiebreak, antes do próximo set começar.',
  },
  {
    title: 'Termos do tênis',
    body: 'Ace: ponto de saque que o adversário nem consegue tocar. Dupla falta: dois saques errados seguidos — ponto pro time adversário. Let: o saque toca a rede e cai no lugar certo — repete o saque, sem contar como falta. 40 a 40 é Deuce; quem ganha o ponto seguinte fica com a Vantagem (AD) e precisa vencer mais um ponto pra fechar o game (senão volta pro Deuce). Quebra de saque (break): vencer um game em que era o adversário quem estava sacando. Match point / set point: o ponto que, se vencido, decide a partida ou o set ali mesmo.',
  },
]

export function GuideScreen() {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Como jogar')}</h1>
        <p className="text-sm text-cream/70">
          {t(
            'As regras do Tennis Americano, resumidas. A tela ao vivo te guia durante a partida — quem saca, de que lado, e quando trocar de lado.',
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CARDS.map((c) => (
          <div key={c.title} className={card}>
            <h2 className="mb-1 font-bold text-lime">{t(c.title)}</h2>
            <p className="text-sm text-cream/85">{t(c.body)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
