/**
 * Relay ao vivo entre o app (tablet/celular) e o relógio — não guarda nada,
 * só repassa mensagens dentro de uma "sala" de 2 participantes (papéis
 * "tablet" e "watch") identificada pelo código de pareamento de 6 dígitos.
 * Sem essa peça, duas abas de navegador não têm como se encontrar numa
 * rede local (uma aba não consegue "ser servidor") — ver RELAY.md.
 */

export interface Env {
  ROOMS: DurableObjectNamespace
}

const PIN_RE = /^\/room\/([0-9]{4,8})$/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('quase-profissionais relay ok', { status: 200 })
    }

    const match = PIN_RE.exec(url.pathname)
    if (!match) return new Response('not found', { status: 404 })

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket upgrade', { status: 426 })
    }

    const role = url.searchParams.get('role')
    if (role !== 'tablet' && role !== 'watch') {
      return new Response('missing ?role=tablet|watch', { status: 400 })
    }

    const pin = match[1]
    const id = env.ROOMS.idFromName(pin)
    const stub = env.ROOMS.get(id)
    return stub.fetch(request)
  },
}

/** Uma sala fica de pé sem tráfego por até 4h (bem mais que qualquer partida) antes de ser encerrada. */
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000

type Role = 'tablet' | 'watch'

export class RelayRoom {
  state: DurableObjectState
  sockets: Map<Role, WebSocket> = new Map()
  lastSeen = Date.now()

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const role = url.searchParams.get('role') as Role | null
    if (role !== 'tablet' && role !== 'watch') {
      return new Response('missing role', { status: 400 })
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    server.accept()

    // Uma nova conexão pro mesmo papel substitui a anterior (reload, troca
    // de rede) em vez de disputar espaço com ela.
    const old = this.sockets.get(role)
    if (old) {
      try {
        old.close(1000, 'replaced')
      } catch {
        /* já pode estar fechado */
      }
    }
    this.sockets.set(role, server)
    this.lastSeen = Date.now()
    await this.state.storage.setAlarm(Date.now() + IDLE_TIMEOUT_MS)

    const otherRole: Role = role === 'tablet' ? 'watch' : 'tablet'
    const other = this.sockets.get(otherRole)
    // Both sides get told when their peer shows up/leaves — lets the UI
    // show "relógio conectado" separately from "esse lado tem socket
    // aberto com o relay" (the two aren't the same thing).
    if (other && other.readyState === WebSocket.READY_STATE_OPEN) {
      other.send(JSON.stringify({ type: 'peer-joined' }))
      server.send(JSON.stringify({ type: 'peer-joined' }))
    }

    server.addEventListener('message', (evt: MessageEvent) => {
      this.lastSeen = Date.now()
      const peer = this.sockets.get(otherRole)
      if (peer && peer.readyState === WebSocket.READY_STATE_OPEN) {
        peer.send(evt.data as string)
      }
    })

    server.addEventListener('close', () => {
      if (this.sockets.get(role) === server) {
        this.sockets.delete(role)
        const peer = this.sockets.get(otherRole)
        if (peer && peer.readyState === WebSocket.READY_STATE_OPEN) {
          peer.send(JSON.stringify({ type: 'peer-left' }))
        }
      }
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async alarm(): Promise<void> {
    if (Date.now() - this.lastSeen >= IDLE_TIMEOUT_MS) {
      for (const ws of this.sockets.values()) {
        try {
          ws.close(1000, 'idle')
        } catch {
          /* ignore */
        }
      }
      this.sockets.clear()
      return
    }
    await this.state.storage.setAlarm(this.lastSeen + IDLE_TIMEOUT_MS)
  }
}
