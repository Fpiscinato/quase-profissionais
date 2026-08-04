export type View = 'home' | 'torneio' | 'jogadores' | 'ranking' | 'historico' | 'guia' | 'backup'

interface NavItem {
  view: View
  label: string
  hint: string
}

const NAV_ITEMS: NavItem[] = [
  { view: 'jogadores', label: 'Jogadores', hint: 'Adicionar, editar, remover' },
  { view: 'ranking', label: 'Ranking', hint: 'Do dia e geral' },
  { view: 'historico', label: 'Histórico', hint: 'Torneios e partidas anteriores' },
  { view: 'guia', label: 'Como jogar', hint: 'Regras básicas em 6 cards' },
  { view: 'backup', label: 'Backup', hint: 'Exportar / importar dados' },
]

interface Props {
  onNavigate: (view: View) => void
}

export function HomeScreen({ onNavigate }: Props) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <img
          src="/logo.png"
          alt="Os Quase Profissionais"
          className="h-40 w-40 rounded-full object-cover shadow-lg"
        />
        <div>
          <h1 className="text-2xl font-bold">Os Quase Profissionais</h1>
          <p className="text-sm text-cream/70">Atletas de fim de semana. Vai quem aguentar.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('torneio')}
        className="min-h-16 rounded-2xl bg-lime px-4 text-xl font-bold text-navy active:opacity-80"
      >
        Torneio
      </button>

      <div className="grid grid-cols-2 gap-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            type="button"
            aria-label={item.label}
            onClick={() => onNavigate(item.view)}
            className="flex min-h-24 flex-col items-start justify-center gap-1 rounded-xl bg-navy-light p-3 text-left active:opacity-80"
          >
            <span className="font-semibold">{item.label}</span>
            <span className="text-xs text-cream/60">{item.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
