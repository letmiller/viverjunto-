/** Builds a wa.me link. Best-effort normalizes a BR-style local number
 * (10-11 digits, no country code) by prepending 55, since that's what users
 * actually type at signup ("Seu WhatsApp (com DDD)"). Falls back to a
 * numberless link (share sheet where the user picks the contact) when no
 * phone is available. */
export function waLink(message: string, phone?: string | null): string {
  const text = encodeURIComponent(message)
  if (!phone) return `https://wa.me/?text=${text}`

  const digits = phone.replace(/\D/g, '')
  const withCountryCode = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${withCountryCode}?text=${text}`
}
