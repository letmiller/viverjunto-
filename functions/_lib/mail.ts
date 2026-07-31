export async function sendEmail(opts: {
  apiKey: string
  from?: string
  to: string
  subject: string
  html: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from ?? 'Viver Junto <onboarding@resend.dev>',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Falha ao enviar email (${res.status}): ${body}`)
  }
}
