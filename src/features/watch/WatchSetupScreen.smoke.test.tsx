// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { WatchSetupScreen } from './WatchSetupScreen'
import { db, getSettings } from '../../db/db'

afterEach(cleanup)

describe('WatchSetupScreen', () => {
  it('warns and disables pairing while the relay is still the placeholder URL', async () => {
    render(<WatchSetupScreen />)
    await screen.findByText(/relay-worker\/RELAY.md/)
    expect(screen.getByRole('button', { name: 'Gerar código' })).toBeDisabled()
  })

  it('shows the paired code and offers unpairing once a watchRoomPin is set', async () => {
    await db.appSettings.put({ id: 'settings', schemaVersion: 1, watchRoomPin: '482913' })
    render(<WatchSetupScreen />)
    expect(await screen.findByTestId('watch-pin')).toHaveTextContent('482913')
    expect(screen.getByRole('button', { name: 'Desparear relógio' })).toBeInTheDocument()
  })

  it('persists the auto-dim preference', async () => {
    render(<WatchSetupScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Sempre ativa' }))
    await waitFor(async () => expect((await getSettings()).watchAutoDim).toBe(false))

    fireEvent.click(screen.getByRole('button', { name: 'Escurecer sozinha' }))
    await waitFor(async () => expect((await getSettings()).watchAutoDim).toBe(true))
  })

  it('unpairing clears the stored pin', async () => {
    await db.appSettings.put({ id: 'settings', schemaVersion: 1, watchRoomPin: '111111' })
    render(<WatchSetupScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desparear relógio' }))
    await waitFor(async () => expect((await getSettings()).watchRoomPin).toBeUndefined())
  })
})
