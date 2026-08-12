/**
 * Small visual cue for "Troquem de lado" (Section 4/5): a mini court split
 * into the two sides, flipping over once to suggest the sides inverting —
 * a plain text banner alone wasn't noticeable enough.
 */
export function ChangeEndsCourt() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <div
        className="animate-court-flip flex h-6 w-40 overflow-hidden rounded-full border-2 border-gold"
        style={{ perspective: '400px' }}
      >
        <div className="flex flex-1 items-center justify-center bg-lime text-xs font-bold text-navy">
          T1
        </div>
        <div className="flex flex-1 items-center justify-center bg-cream text-xs font-bold text-navy">
          T2
        </div>
      </div>
    </div>
  )
}
