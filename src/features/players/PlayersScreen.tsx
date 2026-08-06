import { useState, type FormEvent } from 'react'
import { useAllPlayers } from '../../db/hooks'
import { addPlayer, DuplicatePlayerNameError, removePlayer, updatePlayerName } from '../../db/db'
import type { PlayerRow } from '../../db/db'
import { card, destructiveButton, primaryButton, secondaryButton, textInput } from '../../ui/styles'
import { useT } from '../../i18n/useT'

export function PlayersScreen() {
  const { t } = useT()
  const allPlayers = useAllPlayers()
  const players = [...allPlayers].sort((a, b) => Number(b.active) - Number(a.active))

  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const translateError = (err: unknown, fallback: string): string => {
    if (err instanceof DuplicatePlayerNameError) {
      return t('Já existe um jogador chamado "{name}".', { name: err.playerName })
    }
    return err instanceof Error ? t(err.message) : t(fallback)
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setAddError(null)
    try {
      await addPlayer(newName)
      setNewName('')
    } catch (err) {
      setAddError(translateError(err, 'Erro ao adicionar jogador.'))
    }
  }

  const startEdit = (player: PlayerRow) => {
    setEditingId(player.id)
    setEditValue(player.name)
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const saveEdit = async (id: string) => {
    try {
      await updatePlayerName(id, editValue)
      setEditingId(null)
    } catch (err) {
      setEditError(translateError(err, 'Erro ao salvar.'))
    }
  }

  const confirmDelete = async (id: string) => {
    await removePlayer(id)
    setConfirmDeleteId(null)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">{t('Jogadores')}</h1>
        <p className="text-sm text-cream/70">{t('Adicione, edite ou remova jogadores do grupo.')}</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            className={textInput}
            placeholder={t('Nome do novo jogador')}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              setAddError(null)
            }}
          />
          <button type="submit" className={primaryButton}>
            {t('Adicionar')}
          </button>
        </div>
        {addError && <p className="text-sm text-destructive">{addError}</p>}
      </form>

      <div className="flex flex-col gap-2">
        {players.map((player) => {
          const isEditing = editingId === player.id
          const isConfirmingDelete = confirmDeleteId === player.id

          return (
            <div key={player.id} data-testid={`player-row-${player.id}`} className={card}>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className={textInput}
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value)
                      setEditError(null)
                    }}
                    autoFocus
                  />
                  {editError && <p className="text-sm text-destructive">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={cancelEdit}
                    >
                      {t('Cancelar')}
                    </button>
                    <button
                      type="button"
                      className={`${primaryButton} flex-1`}
                      onClick={() => saveEdit(player.id)}
                    >
                      {t('Salvar')}
                    </button>
                  </div>
                </div>
              ) : isConfirmingDelete ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    {t('Remover')} <span className="font-semibold">{player.name}</span>?{' '}
                    {t(
                      'Se já tiver partidas registradas, o jogador é arquivado (não some do histórico).',
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      {t('Cancelar')}
                    </button>
                    <button
                      type="button"
                      className={`${destructiveButton} flex-1`}
                      onClick={() => confirmDelete(player.id)}
                    >
                      {t('Sim, remover')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={player.active ? '' : 'text-cream/40 line-through'}>
                      {player.name}
                    </span>
                    {!player.active && (
                      <span className="rounded bg-cream/10 px-2 py-0.5 text-xs text-cream/60">
                        {t('Arquivado')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => startEdit(player)}
                    >
                      {t('Editar')}
                    </button>
                    {player.active && (
                      <button
                        type="button"
                        className={destructiveButton}
                        onClick={() => setConfirmDeleteId(player.id)}
                      >
                        {t('Excluir')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
