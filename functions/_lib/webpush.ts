// Minimal Web Push (RFC 8291 message encryption + RFC 8292 VAPID) built on
// the Web Crypto API only — no external service, no npm 'web-push' package
// (which needs Node's crypto/http and doesn't run cleanly in the Workers
// runtime). This talks directly to the browser vendor's push service using
// the subscription endpoint the client registered.

export interface PushSubscriptionRecord {
  endpoint: string
  p256dh: string
  auth: string
}

export interface VapidKeys {
  publicKey: string // base64url, uncompressed P-256 point
  privateKey: string // base64url, PKCS8-free raw scalar (jwk 'd')
  subject: string // "mailto:you@example.com"
}

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

async function signVapidJwt(audience: string, vapid: VapidKeys): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: vapid.subject }
  const encHeader = bytesToBase64url(new TextEncoder().encode(JSON.stringify(header)))
  const encPayload = bytesToBase64url(new TextEncoder().encode(JSON.stringify(payload)))
  const unsigned = `${encHeader}.${encPayload}`

  const key = await importVapidPrivateKeyFull(vapid)
  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned))
  const sig = bytesToBase64url(new Uint8Array(sigBuf))
  return `${unsigned}.${sig}`
}

// ECDSA sign requires the private key as a full JWK (d + x + y) — we store
// the public key separately, so reconstruct x/y from it for the JWK import.
async function importVapidPrivateKeyFull(vapid: VapidKeys): Promise<CryptoKey> {
  const pub = base64urlToBytes(vapid.publicKey) // 65 bytes: 0x04 || x(32) || y(32)
  const x = pub.slice(1, 33)
  const y = pub.slice(33, 65)
  const d = base64urlToBytes(vapid.privateKey)
  return crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: bytesToBase64url(d), x: bytesToBase64url(x), y: bytesToBase64url(y), ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  )
  return new Uint8Array(bits)
}

// Encrypts `payload` per RFC 8291 (aes128gcm) for a single subscriber.
async function encryptPayload(
  payload: Uint8Array,
  subscription: PushSubscriptionRecord,
): Promise<{ body: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const uaPublicKeyBytes = base64urlToBytes(subscription.p256dh)
  const authSecret = base64urlToBytes(subscription.auth)

  const uaPublicKey = await crypto.subtle.importKey(
    'raw',
    uaPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  const localKeyPair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair
  const localPublicKeyRaw = new Uint8Array(
    (await crypto.subtle.exportKey('raw', localKeyPair.publicKey)) as ArrayBuffer,
  )

  // workers-types mistakenly names this field `$public`; the runtime (like
  // every other Web Crypto implementation) actually expects `public`.
  const ecdhSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: uaPublicKey } as unknown as SubtleCryptoDeriveKeyAlgorithm,
    localKeyPair.privateKey,
    256,
  )
  const ecdhSecret = new Uint8Array(ecdhSecretBits)

  const keyInfo = concatBytes(
    new TextEncoder().encode('WebPush: info\0'),
    uaPublicKeyBytes,
    localPublicKeyRaw,
  )
  const prkKey = await hkdf(authSecret, ecdhSecret, keyInfo, 32)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0')
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0')
  const cek = await hkdf(salt, prkKey, cekInfo, 16)
  const nonce = await hkdf(salt, prkKey, nonceInfo, 12)

  const paddedPayload = concatBytes(payload, new Uint8Array([2])) // delimiter for the (only) final record
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const ciphertextBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, paddedPayload)
  const ciphertext = new Uint8Array(ciphertextBuf)

  const recordSize = new Uint8Array(4)
  new DataView(recordSize.buffer).setUint32(0, 4096)
  const header = concatBytes(salt, recordSize, new Uint8Array([localPublicKeyRaw.length]), localPublicKeyRaw)

  return { body: concatBytes(header, ciphertext), salt, localPublicKey: localPublicKeyRaw }
}

export async function sendWebPush(
  subscription: PushSubscriptionRecord,
  payload: Record<string, unknown>,
  vapid: VapidKeys,
): Promise<Response> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload))
  const { body } = await encryptPayload(payloadBytes, subscription)

  const endpointUrl = new URL(subscription.endpoint)
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`
  const jwt = await signVapidJwt(audience, vapid)

  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      TTL: '86400',
    },
    body,
  })
}
