/**
 * Picks the matchesPlayed value to compare when "mesmo número de jogos" is
 * checked: the most common count (ties broken toward the higher count, which
 * represents whoever completed the most rounds) rather than an arbitrary
 * min/max — someone who left early shouldn't set the bar for everyone else.
 */
export function modeMatchesPlayed(counts: number[]): number | null {
  if (counts.length === 0) return null
  const freq = new Map<number, number>()
  for (const c of counts) freq.set(c, (freq.get(c) ?? 0) + 1)
  let best: number | null = null
  let bestFreq = 0
  for (const [value, f] of freq) {
    if (f > bestFreq || (f === bestFreq && best !== null && value > best)) {
      best = value
      bestFreq = f
    }
  }
  return best
}
