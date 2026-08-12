/**
 * Registry of actions a physical remote/clicker (or any keyboard-emulating
 * device) can be mapped to. Adding a new action later is just a new entry
 * here plus a handler where LiveMatchScreen builds the `actions` map for
 * useKeyCommands — KeyBindingsScreen and useKeyCommands don't change.
 */
export type KeyActionId = 'team1' | 'team2' | 'repeat' | 'undo' | 'save'

export interface KeyActionDef {
  id: KeyActionId
  label: string
}

export const KEY_ACTIONS: KeyActionDef[] = [
  { id: 'team1', label: 'Ponto Time 1' },
  { id: 'team2', label: 'Ponto Time 2' },
  { id: 'repeat', label: 'Repetir anúncio' },
  { id: 'undo', label: 'Desfazer' },
  { id: 'save', label: 'Salvar partida' },
]
