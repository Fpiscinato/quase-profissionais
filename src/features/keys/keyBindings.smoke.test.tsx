// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { KeyBindingsScreen } from './KeyBindingsScreen'
import { getSettings } from '../../db/db'

afterEach(cleanup)

function pressKey(code: string) {
  fireEvent.keyDown(window, { code })
}

describe('KeyBindingsScreen', () => {
  it('captures a key press for the action being defined and persists it', async () => {
    render(<KeyBindingsScreen />)

    const row = screen.getByText('Ponto Time 1').closest('div')!.parentElement!
    fireEvent.click(within(row).getByRole('button', { name: 'Definir' }))
    await screen.findByText('Aguardando tecla... (Esc para cancelar)')

    pressKey('PageDown')

    await waitFor(() => expect(screen.getByText('PageDown')).toBeInTheDocument())
    const settings = await getSettings()
    expect(settings.keyBindings?.team1).toBe('PageDown')
  })

  it('Escape cancels the capture without saving anything', async () => {
    render(<KeyBindingsScreen />)

    const row = screen.getByText('Ponto Time 2').closest('div')!.parentElement!
    fireEvent.click(within(row).getByRole('button', { name: 'Definir' }))
    await screen.findByText('Aguardando tecla... (Esc para cancelar)')

    pressKey('Escape')

    await waitFor(() =>
      expect(screen.queryByText('Aguardando tecla... (Esc para cancelar)')).toBeNull(),
    )
    const settings = await getSettings()
    expect(settings.keyBindings?.team2).toBeUndefined()
  })

  it('rebinding a key already used elsewhere clears it from the previous action', async () => {
    render(<KeyBindingsScreen />)

    const team1Row = screen.getByText('Ponto Time 1').closest('div')!.parentElement!
    fireEvent.click(within(team1Row).getByRole('button', { name: 'Definir' }))
    await screen.findByText('Aguardando tecla... (Esc para cancelar)')
    pressKey('KeyX')
    await waitFor(async () => expect((await getSettings()).keyBindings?.team1).toBe('KeyX'))

    const team2Row = screen.getByText('Ponto Time 2').closest('div')!.parentElement!
    fireEvent.click(within(team2Row).getByRole('button', { name: 'Definir' }))
    await screen.findByText('Aguardando tecla... (Esc para cancelar)')
    pressKey('KeyX')

    await waitFor(async () => {
      const settings = await getSettings()
      expect(settings.keyBindings?.team2).toBe('KeyX')
      expect(settings.keyBindings?.team1).toBeUndefined()
    })
  })

  it('Limpar clears an existing binding', async () => {
    render(<KeyBindingsScreen />)

    const row = screen.getByText('Desfazer').closest('div')!.parentElement!
    fireEvent.click(within(row).getByRole('button', { name: 'Definir' }))
    await screen.findByText('Aguardando tecla... (Esc para cancelar)')
    pressKey('KeyZ')
    await waitFor(async () => expect((await getSettings()).keyBindings?.undo).toBe('KeyZ'))

    fireEvent.click(within(row).getByRole('button', { name: 'Limpar' }))
    await waitFor(async () => expect((await getSettings()).keyBindings?.undo).toBeUndefined())
  })
})
