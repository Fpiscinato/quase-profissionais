export type LayoutMode = 'auto' | 'tablet' | 'smartphone'
export type EffectiveLayout = 'tablet' | 'smartphone'

// Conservative threshold: below common phone widths (incl. large phones in
// landscape) and above typical portrait phone widths, so "auto" doesn't
// misclassify a phone as a tablet — that would break the no-scroll
// requirement on the live match screen.
export const TABLET_MIN_WIDTH_QUERY = '(min-width: 700px)'

export function resolveEffectiveLayout(mode: LayoutMode, isWideViewport: boolean): EffectiveLayout {
  if (mode === 'auto') return isWideViewport ? 'tablet' : 'smartphone'
  return mode
}

export function nextLayoutMode(current: LayoutMode): LayoutMode {
  if (current === 'auto') return 'tablet'
  if (current === 'tablet') return 'smartphone'
  return 'auto'
}

export const LAYOUT_MODE_LABELS: Record<LayoutMode, string> = {
  auto: 'Automático',
  tablet: 'Tablet',
  smartphone: 'Smartphone',
}
