function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let str = ''
  for (const b of arr) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=')
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

const PBKDF2_ITERATIONS = 100_000

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return `${toBase64Url(salt)}.${toBase64Url(bits)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split('.')
  if (!saltB64 || !hashB64) return false
  const salt = fromBase64Url(saltB64)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return toBase64Url(bits) === hashB64
}

interface JwtPayload {
  sub: string
  exp: number
  [key: string]: unknown
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

export async function signJwt(
  payload: { sub: string; [key: string]: unknown },
  secret: string,
  expiresInSeconds = 60 * 60 * 24 * 30,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const fullPayload: JwtPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }
  const headerB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(fullPayload)))
  const data = `${headerB64}.${payloadB64}`
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${toBase64Url(sig)}`
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, sigB64] = parts
  const key = await hmacKey(secret)
  const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(sigB64), new TextEncoder().encode(`${headerB64}.${payloadB64}`))
  if (!valid) return null
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as JwtPayload
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

export function randomId(): string {
  return crypto.randomUUID()
}

export function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  for (const b of bytes) code += chars[b % chars.length]
  return code
}
