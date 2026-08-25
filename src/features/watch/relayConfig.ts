/**
 * Endereço do relay (ver /relay-worker/RELAY.md) — precisa ser publicado
 * uma vez separadamente (Durable Objects não cabem num projeto Cloudflare
 * Pages) e colado aqui. Enquanto for o placeholder, o pareamento fica
 * bloqueado com uma mensagem clara em vez de tentar conectar e falhar
 * silenciosamente.
 */
export const RELAY_URL = 'wss://SEU-RELAY-AQUI.workers.dev'

export function isRelayConfigured(): boolean {
  return !RELAY_URL.includes('SEU-RELAY-AQUI')
}

export type RelayRole = 'tablet' | 'watch'

export function buildRoomUrl(pin: string, role: RelayRole): string {
  return `${RELAY_URL}/room/${pin}?role=${role}`
}

/** 6 dígitos, fácil de ler no tablet e digitar num teclado numérico grande no relógio. */
export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function isValidPin(pin: string): boolean {
  return /^[0-9]{6}$/.test(pin)
}
