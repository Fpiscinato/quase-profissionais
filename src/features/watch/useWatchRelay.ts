import { useEffect, useRef, useState } from 'react'
import { buildRoomUrl, isRelayConfigured } from './relayConfig'

/**
 * Live protocol between the tablet (this hook) and the watch page
 * (public/relogio.html) — see relay-worker/src/index.ts for the relay
 * that just forwards these JSON messages between the two. The watch never
 * computes match state; it only ever sends taps and displays whatever the
 * tablet last pushed down.
 */
export interface WatchStatePayload {
  type: 'state'
  score1: string
  score2: string
  games1: string
  games2: string
  gamesTarget: string
  sets1: string
  sets2: string
  setsTarget: string
  serverTag: string
  serverSide: 'D' | 'E' | null
  canUndo: boolean
  autoDim: boolean
  matchOver: boolean
  alertText: string
}

interface WatchRelayParams {
  /** Undefined/empty = no watch paired for this device yet — the hook stays idle. */
  pin: string | undefined
  autoDim: boolean
  score1: string
  score2: string
  /** Current-set games per team, for the little dots under each button. */
  games1: string
  games2: string
  /** Games needed to win the set (dots to render per team). */
  gamesTarget: string
  /** Sets won per team, for the little rackets under each button. */
  sets1: string
  sets2: string
  /** Sets needed to win the match ('1' means single-set — no rackets shown). */
  setsTarget: string
  serverTag: string
  serverSide: 'D' | 'E' | null
  canUndo: boolean
  matchOver: boolean
  /** e.g. "Troquem de lado" / "Tiebreak!" — empty when there's nothing to flag. */
  alertText: string
  onPoint: (team: 1 | 2) => void
  onUndo: () => void
  onRepeat: () => void
}

function statePayload(p: WatchRelayParams): WatchStatePayload {
  return {
    type: 'state',
    score1: p.score1,
    score2: p.score2,
    games1: p.games1,
    games2: p.games2,
    gamesTarget: p.gamesTarget,
    sets1: p.sets1,
    sets2: p.sets2,
    setsTarget: p.setsTarget,
    serverTag: p.serverTag,
    serverSide: p.serverSide,
    canUndo: p.canUndo,
    autoDim: p.autoDim,
    matchOver: p.matchOver,
    alertText: p.alertText,
  }
}

/** Tablet side of the watch link: opens/keeps the relay connection, replays taps into the callbacks, mirrors state down. */
export function useWatchRelay(params: WatchRelayParams): { linkOpen: boolean; watchConnected: boolean } {
  const [linkOpen, setLinkOpen] = useState(false)
  const [watchConnected, setWatchConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const paramsRef = useRef(params)
  paramsRef.current = params

  useEffect(() => {
    if (!params.pin || !isRelayConfigured()) {
      setLinkOpen(false)
      setWatchConnected(false)
      return
    }
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function connect() {
      if (cancelled) return
      const ws = new WebSocket(buildRoomUrl(params.pin as string, 'tablet'))
      wsRef.current = ws

      ws.onopen = () => {
        setLinkOpen(true)
        ws.send(JSON.stringify(statePayload(paramsRef.current)))
      }
      ws.onmessage = (evt) => {
        let msg: { type?: string; team?: number } = {}
        try {
          msg = JSON.parse(evt.data)
        } catch {
          return
        }
        if (msg.type === 'point' && (msg.team === 1 || msg.team === 2)) {
          paramsRef.current.onPoint(msg.team)
        } else if (msg.type === 'undo') {
          paramsRef.current.onUndo()
        } else if (msg.type === 'repeat') {
          paramsRef.current.onRepeat()
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }))
        } else if (msg.type === 'peer-joined') {
          setWatchConnected(true)
        } else if (msg.type === 'peer-left') {
          setWatchConnected(false)
        }
      }
      ws.onclose = () => {
        setLinkOpen(false)
        setWatchConnected(false)
        wsRef.current = null
        if (!cancelled) retryTimer = setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()
    }
    connect()

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
    // Reconnects only when the paired PIN itself changes — everything else
    // (score, server, etc.) is pushed via the effect below on the same,
    // already-open socket instead of tearing the connection down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pin])

  useEffect(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(statePayload(params)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.score1,
    params.score2,
    params.games1,
    params.games2,
    params.gamesTarget,
    params.sets1,
    params.sets2,
    params.setsTarget,
    params.serverTag,
    params.serverSide,
    params.canUndo,
    params.autoDim,
    params.matchOver,
    params.alertText,
  ])

  return { linkOpen, watchConnected }
}
