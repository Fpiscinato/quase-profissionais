export type LayoutMode = 'auto' | 'tablet' | 'smartphone'
export type EffectiveLayout = 'tablet' | 'smartphone'

// Conservative width threshold, ALSO gated on a minimum height: width alone
// would misclassify a wide-but-short landscape phone (e.g. 926x428) as a
// tablet, which the compact 3-column layout doesn't reliably fit without
// scrolling at that little height — a real landscape tablet is never that
// short, so requiring both keeps "auto" from firing on a rotated phone.
export const TABLET_MIN_WIDTH_QUERY = '(min-width: 700px) and (min-height: 500px)'

// A second, independent (and much taller) threshold for scaling the tablet
// layout up further ("roomy"): requires real width AND real height to be
// generous, not just the layout mode being 'tablet' — a forced tablet mode
// on a small/short phone must keep the compact sizes (already verified to
// fit there) instead of scaling up into a scroll. Verified empirically
// (playwright, worst-case states: change-ends+game alert stacked, deuce/
// advantage, a double-digit tiebreak): true content needs ~640-650px at
// this height — 700px keeps a real safety margin above that.
export const TABLET_MIN_HEIGHT_QUERY = '(min-height: 700px)'

// Roomy also needs its own, wider width floor than the base tablet
// threshold: the bigger score text (e.g. "AD – 40") wraps to 2 lines in the
// tablet grid's center column right around 700-740px viewport width —
// verified empirically the wrap is gone by 750px, so 800px keeps a margin.
export const TABLET_ROOMY_MIN_WIDTH_QUERY = '(min-width: 800px)'

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
