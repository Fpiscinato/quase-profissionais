export function shareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/**
 * Prefers the native share sheet (Salvar no Drive, WhatsApp etc.) so a file
 * can land straight in a folder other devices can reach — falls back to a
 * plain download (only reaches this device's Downloads folder) wherever
 * file sharing isn't supported (desktop, iOS Safari) or the user cancels.
 */
export async function shareOrDownloadFile(file: File, shareTitle?: string): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: shareTitle })
      return
    } catch {
      // Cancelled or failed — fall through to the download below.
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
