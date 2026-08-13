// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareOrDownloadFile, shareSupported } from './shareFile'

afterEach(() => {
  delete (navigator as { share?: unknown }).share
  delete (navigator as { canShare?: unknown }).canShare
})

describe('shareSupported', () => {
  it('is false when navigator.share is not available (default jsdom)', () => {
    expect(shareSupported()).toBe(false)
  })

  it('is true once navigator.share exists', () => {
    navigator.share = vi.fn()
    expect(shareSupported()).toBe(true)
  })
})

describe('shareOrDownloadFile', () => {
  it('falls back to a download link when sharing is unavailable', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const file = new File(['x'], 'test.png', { type: 'image/png' })

    await shareOrDownloadFile(file)

    expect(createObjectURL).toHaveBeenCalledWith(file)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })

  it('shares the file via navigator.share when supported, without downloading', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.share = share
    navigator.canShare = () => true
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')
    const file = new File(['x'], 'test.png', { type: 'image/png' })

    await shareOrDownloadFile(file, 'My title')

    expect(share).toHaveBeenCalledWith({ files: [file], title: 'My title' })
    expect(createObjectURL).not.toHaveBeenCalled()
    createObjectURL.mockRestore()
  })

  it('falls back to download when navigator.share rejects (e.g. user cancelled)', async () => {
    navigator.share = vi.fn().mockRejectedValue(new Error('cancelled'))
    navigator.canShare = () => true
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const file = new File(['x'], 'test.png', { type: 'image/png' })

    await shareOrDownloadFile(file)

    expect(createObjectURL).toHaveBeenCalledWith(file)
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })
})
