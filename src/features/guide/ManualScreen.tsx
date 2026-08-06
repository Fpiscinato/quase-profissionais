import { card } from '../../ui/styles'
import { useT } from '../../i18n/useT'

const SECTIONS = [
  {
    title: '1. Cadastre os jogadores',
    body: 'Em "Jogadores", adicione o grupo (nome e pronto). Dá pra editar ou excluir depois — quem já tem partida registrada é arquivado, não some do histórico.',
  },
  {
    title: '2. Comece um torneio',
    body: 'No botão "Torneio": primeiro marque quem está jogando hoje, depois escolha o formato (Duplas ou Individual), a formação das duplas (Balanceado sorteia justo, Manual você escolhe) e quantos games decidem o set. Toque em "Confirmar e criar torneio".',
  },
  {
    title: '3. Ou jogue uma partida avulsa',
    body: 'Em "Partida avulsa" você escolhe o formato, os jogadores dos dois times e quantos games decidem o set, sem passar pela disponibilidade ou rotação — direto pra configurar e jogar. Conta pro ranking e histórico normalmente.',
  },
  {
    title: '4. Jogue as rodadas',
    body: 'A tela "Rodadas" lista os confrontos do dia. Toque em "Configurar partida" pra definir quem saca primeiro e o lado inicial da quadra, depois "Iniciar partida" pra abrir a tela ao vivo.',
  },
  {
    title: '5. Tela ao vivo',
    body: 'Os botões grandes somam ponto pra cada time. A tela mostra quem saca, de que lado, e avisa na hora de trocar de lado ou de fechar o set. Errou o toque? "Desfazer" volta um ponto. No final, "Salvar partida" grava o resultado.',
  },
  {
    title: '6. Ranking',
    body: '"Ranking" mostra a classificação do torneio do dia e o ranking geral (todos os torneios já jogados), tanto individual quanto por dupla.',
  },
  {
    title: '7. Histórico',
    body: '"Histórico" guarda todos os torneios e partidas anteriores, com placar, duração e tempo total jogado por jogador e por dupla.',
  },
  {
    title: '8. Backup',
    body: 'Em "Backup" você exporta todos os dados (jogadores, torneios, partidas) num arquivo, pra guardar ou levar pra outro aparelho. Importar mescla esse arquivo com o que já está salvo, sem apagar nada sem confirmar.',
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
