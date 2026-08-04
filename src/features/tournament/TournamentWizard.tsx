import { useEffect, useState } from 'react'
import { db, ensurePlayersSeeded, getSettings } from '../../db/db'
import type { PlayerId } from '../../engine/types'
import { AvailabilityStep } from './AvailabilityStep'
import { FormatRotationStep } from './FormatRotationStep'
import { RoundsListStep } from './RoundsListStep'

type Step =
  | { name: 'loading' }
  | { name: 'disponibilidade' }
  | { name: 'formato-rotacao'; availablePlayerIds: PlayerId[] }
  | { name: 'rodadas'; tournamentId: string }

export function TournamentWizard() {
  const [step, setStep] = useState<Step>({ name: 'loading' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensurePlayersSeeded()
      const settings = await getSettings()
      if (settings.currentTournamentId) {
        const tournament = await db.tournaments.get(settings.currentTournamentId)
        if (tournament && tournament.status !== 'completed') {
          if (!cancelled) setStep({ name: 'rodadas', tournamentId: tournament.id })
          return
        }
      }
      if (!cancelled) setStep({ name: 'disponibilidade' })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (step.name === 'loading') {
    return <div className="p-4 text-cream/70">Carregando...</div>
  }

  if (step.name === 'disponibilidade') {
    return (
      <AvailabilityStep
        onContinue={(availablePlayerIds) =>
          setStep({ name: 'formato-rotacao', availablePlayerIds })
        }
      />
    )
  }

  if (step.name === 'formato-rotacao') {
    return (
      <FormatRotationStep
        availablePlayerIds={step.availablePlayerIds}
        onCreated={(tournamentId) => setStep({ name: 'rodadas', tournamentId })}
        onBack={() => setStep({ name: 'disponibilidade' })}
      />
    )
  }

  return <RoundsListStep tournamentId={step.tournamentId} />
}
