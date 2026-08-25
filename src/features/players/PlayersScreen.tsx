import { useState, type FormEvent } from 'react'
import { useAllPlayers } from '../../db/hooks'
import {
  addPlayer,
  DuplicatePlayerNameError,
  MAX_NICKNAME_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  mergePlayers,
  removePlayer,
  updatePlayerName,
  updatePlayerNickname,
} from '../../db/db'
import type { PlayerRow } from '../../db/db'
import { card, destructiveButton, primaryButton, secondaryButton, textInput } from '../../ui/styles'
import { HelpHint } from '../../ui/HelpHint'
import { useT } from '../../i18n/useT'

export function PlayersScreen() {
  const { t } = useT()
  const allPlayers = useAllPlayers()
  const players = [...allPlayers].sort((a, b) => Number(b.active) - Number(a.active))

  const [newName, setNewName] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editNickname, setEditNickname] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [mergeKeepId, setMergeKeepId] = useState('')
  const [mergeMergeId, setMergeMergeId] = useState('')
  const [confirmingMerge, setConfirmingMerge] = useState(false)
  const [mergeError, setMergeError] = useState<string | null>(null)
  const [mergeBusy, setMergeBusy] = useState(false)

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
      await addPlayer(newName, newNickname)
      setNewName('')
      setNewNickname('')
    } catch (err) {
      setAddError(translateError(err, 'Erro ao adicionar jogador.'))
    }
  }

  const startEdit = (player: PlayerRow) => {
    setEditingId(player.id)
    setEditValue(player.name)
    setEditNickname(player.nickname ?? '')
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const saveEdit = async (id: string) => {
    try {
      await updatePlayerName(id, editValue)
      await updatePlayerNickname(id, editNickname)
      setEditingId(null)
    } catch (err) {
      setEditError(translateError(err, 'Erro ao salvar.'))
    }
  }

  const confirmDelete = async (id: string) => {
    await removePlayer(id)
    setConfirmDeleteId(null)
  }

  const handleMerge = async () => {
    setMergeBusy(true)
    try {
      await mergePlayers(mergeKeepId, mergeMergeId)
      setMergeKeepId('')
      setMergeMergeId('')
      setConfirmingMerge(false)
      setMergeError(null)
    } catch (err) {
      setMergeError(translateError(err, 'Erro ao mesclar jogadores.'))
      setConfirmingMerge(false)
    } finally {
      setMergeBusy(false)
    }
  }

  const mergeKeepName = players.find((p) => p.id === mergeKeepId)?.name ?? ''
  const mergeMergeName = players.find((p) => p.id === mergeMergeId)?.name ?? ''

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
            className={`${textInput} flex-1`}
            placeholder={t('Nome do novo jogador')}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              setAddError(null)
            }}
          />
          <input
            type="text"
            className={`${textInput} w-16 text-center uppercase`}
            placeholder={t('Apelido')}
            maxLength={MAX_NICKNAME_LENGTH}
            value={newNickname}
            onChange={(e) => {
              setNewNickname(e.target.value)
              setAddError(null)
            }}
          />
          <button type="submit" className={primaryButton}>
            {t('Adicionar')}
          </button>
        </div>
        <p className="text-xs text-cream/50">
          {t('Apelido de até 4 letras')}
          <HelpHint
            text={t(
              'Usado nas telas pequenas, como o relógio — se não preencher, o app usa as 4 primeiras letras do nome.',
            )}
          />
        </p>
        {addError && <p className="text-sm text-destructive">{addError}</p>}
      </form>

      <div className="flex flex-col gap-2" data-testid="players-list">
        {players.map((player) => {
          const isEditing = editingId === player.id
          const isConfirmingDelete = confirmDeleteId === player.id

          return (
            <div key={player.id} data-testid={`player-row-${player.id}`} className={card}>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={`${textInput} flex-1`}
                      maxLength={MAX_PLAYER_NAME_LENGTH}
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value)
                        setEditError(null)
                      }}
                      autoFocus
                    />
                    <input
                      type="text"
                      className={`${textInput} w-16 text-center uppercase`}
                      placeholder={t('Apelido')}
                      maxLength={MAX_NICKNAME_LENGTH}
                      value={editNickname}
                      onChange={(e) => {
                        setEditNickname(e.target.value)
                        setEditError(null)
                      }}
                    />
                  </div>
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
                    {player.nickname && (
                      <span className="rounded bg-sky/15 px-1.5 py-0.5 text-xs font-bold tracking-wide text-sky">
                        {player.nickname}
                      </span>
                    )}
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

      {players.length >= 2 && (
        <div className={card}>
          <h2 className="mb-1 font-semibold">{t('Mesclar jogadores duplicados')}</h2>
          <p className="mb-3 text-sm text-cream/70">
            {t(
              'Dois cadastros da mesma pessoa (ex.: nome digitado diferente)? Mescle em um só — o histórico e o ranking passam a contar tudo junto.',
            )}
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-cream/70">{t('Manter')}</span>
              <select
                className={textInput}
                value={mergeKeepId}
                onChange={(e) => {
                  setMergeKeepId(e.target.value)
                  setMergeError(null)
                }}
              >
                <option value="">{t('Selecione...')}</option>
                {players
                  .filter((p) => p.id !== mergeMergeId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {!p.active ? ` (${t('Arquivado')})` : ''}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-cream/70">{t('Mesclar e remover')}</span>
              <select
                className={textInput}
                value={mergeMergeId}
                onChange={(e) => {
                  setMergeMergeId(e.target.value)
                  setMergeError(null)
                }}
              >
                <option value="">{t('Selecione...')}</option>
                {players
                  .filter((p) => p.id !== mergeKeepId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {!p.active ? ` (${t('Arquivado')})` : ''}
                    </option>
                  ))}
              </select>
            </label>

            {mergeError && <p className="text-sm text-destructive">{mergeError}</p>}

            {confirmingMerge ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-destructive">
                  {t(
                    '⚠ Mesclar "{mergeName}" em "{keepName}"? O histórico de "{mergeName}" passa a contar como "{keepName}" e o cadastro de "{mergeName}" é removido. Essa ação não pode ser desfeita.',
                    { mergeName: mergeMergeName, keepName: mergeKeepName },
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => setConfirmingMerge(false)}
                  >
                    {t('Cancelar')}
                  </button>
                  <button
                    type="button"
                    className={`${destructiveButton} flex-1`}
                    disabled={mergeBusy}
                    onClick={handleMerge}
                  >
                    {t('Confirmar mesclagem')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={primaryButton}
                disabled={!mergeKeepId || !mergeMergeId}
                onClick={() => setConfirmingMerge(true)}
              >
                {t('Mesclar')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
