import { useRef, useState, type ChangeEvent } from 'react'
import { exportBackup, isBackupPayload, mergeImport, type MergeResult } from '../../db/backup'
import { card, primaryButton, secondaryButton } from '../../ui/styles'

export function BackupScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MergeResult | null>(null)

  const handleExport = async () => {
    setBusy(true)
    setError(null)
    try {
      const payload = await exportBackup()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `quase-profissionais-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow importing the same file again later
    if (!file) return

    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const text = await file.text()
      const payload: unknown = JSON.parse(text)
      if (!isBackupPayload(payload)) {
        throw new Error('Arquivo não parece um backup válido.')
      }
      const mergeResult = await mergeImport(payload)
      setResult(mergeResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar o backup.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Backup</h1>
        <p className="text-sm text-cream/70">
          Exporte os dados pra guardar ou levar pra outro aparelho. Importar um backup só
          adiciona o que ainda não existe aqui — nada é sobrescrito ou duplicado.
        </p>
      </div>

      <div className={card}>
        <h2 className="mb-2 font-semibold">Exportar</h2>
        <p className="mb-3 text-sm text-cream/70">
          Baixa um arquivo .json com jogadores, torneios e partidas.
        </p>
        <button type="button" className={primaryButton} disabled={busy} onClick={handleExport}>
          Exportar dados
        </button>
      </div>

      <div className={card}>
        <h2 className="mb-2 font-semibold">Importar</h2>
        <p className="mb-3 text-sm text-cream/70">
          Escolha um arquivo .json exportado (deste ou de outro aparelho).
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          data-testid="import-file-input"
          className="hidden"
          onChange={handleFileChange}
        />
        <button type="button" className={secondaryButton} disabled={busy} onClick={handleImportClick}>
          Escolher arquivo...
        </button>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {result && (
          <div className="mt-3 text-sm text-cream/80">
            <p className="mb-1 font-semibold text-lime">Importação concluída:</p>
            <ul className="list-inside list-disc">
              <li>
                Jogadores: {result.players.added} adicionados, {result.players.skipped} já
                existiam
              </li>
              <li>
                Torneios: {result.tournaments.added} adicionados, {result.tournaments.skipped} já
                existiam
              </li>
              <li>
                Partidas: {result.matches.added} adicionadas, {result.matches.skipped} já
                existiam
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
