import { getResendClient } from './client'
import { getEmailConfig, isSendableAddress } from './config'
import { renderEmail, type EmailBlock } from './render'

export type EmailAttachment = {
  filename: string
  /** Contenido del archivo. Buffer/base64 para adjuntos generados (ej. PDFs de jspdf). */
  content: Buffer | string
  contentType?: string
  /**
   * Si se setea, el adjunto se manda inline y el HTML puede referenciarlo con
   * `cid:<contentId>` (ej. el QR de inscripción dentro del cuerpo del correo).
   */
  contentId?: string
}

export type SendEmailOptions = {
  to: string | string[]
  subject: string
  /** Contenido estructurado (recomendado): se renderiza con el layout de la comunidad. */
  blocks?: EmailBlock[]
  /** HTML propio. Si se pasa, ignora `blocks`. */
  html?: string
  /** Texto plano. Si no se pasa y hay `blocks`, se genera automáticamente. */
  text?: string
  preheader?: string
  from?: string
  replyTo?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
  /** Etiquetas para métricas en el dashboard de Resend (solo [a-zA-Z0-9_-]). */
  tags?: Record<string, string>
  headers?: Record<string, string>
  /** ISO 8601 o lenguaje natural ("in 1 hour") — envío programado por Resend. */
  scheduledAt?: string
  /** Evita envíos duplicados si el caller reintenta (ej. webhooks). */
  idempotencyKey?: string
}

export type EmailResult =
  | { ok: true; id: string | null; skipped?: 'disabled' | 'no_recipients' }
  | { ok: false; error: string }

const TAG_SAFE = /[^a-zA-Z0-9_-]/g

function normalizeRecipients(value: string | string[] | undefined): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return [...new Set(list.map(v => v.trim()).filter(isSendableAddress))]
}

function buildTags(tags: Record<string, string> | undefined) {
  if (!tags) return undefined
  return Object.entries(tags).map(([name, value]) => ({
    name: name.replace(TAG_SAFE, '_'),
    value: String(value).replace(TAG_SAFE, '_'),
  }))
}

/**
 * Envía un email a través de Resend.
 *
 * Nunca lanza: devuelve un resultado discriminado para que un fallo de correo
 * no tumbe el flujo de negocio que lo disparó (inscripción, pago, etc.).
 * El caller decide si loguear, reintentar o ignorar.
 *
 * Comportamiento por entorno:
 * - Sin `RESEND_API_KEY` (o `EMAIL_DISABLED=true`) → no envía, loguea y devuelve `{ ok: true, skipped: 'disabled' }`.
 * - Con `EMAIL_DEV_REDIRECT_TO` → reescribe destinatarios a esa casilla (cc/bcc se descartan).
 * - Descarta direcciones internas `@ccd.internal` (logins sin correo real).
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const config = getEmailConfig()

  let to = normalizeRecipients(options.to)
  let cc = normalizeRecipients(options.cc)
  let bcc = normalizeRecipients(options.bcc)

  if (to.length === 0) {
    return { ok: true, id: null, skipped: 'no_recipients' }
  }

  if (config.devRedirectTo) {
    to = [config.devRedirectTo]
    cc = []
    bcc = []
  }

  const rendered =
    options.html !== undefined
      ? { html: options.html, text: options.text }
      : options.blocks
        ? renderEmail({ title: options.subject, blocks: options.blocks, preheader: options.preheader })
        : { html: undefined, text: options.text }

  if (!rendered.html && !rendered.text) {
    return { ok: false, error: 'El email no tiene contenido (blocks, html o text)' }
  }

  const payload = {
    from: options.from ?? config.from,
    to,
    subject: options.subject,
    ...(rendered.html ? { html: rendered.html } : {}),
    ...(rendered.text ? { text: rendered.text } : {}),
    ...(cc.length ? { cc } : {}),
    ...(bcc.length ? { bcc } : {}),
    ...(options.replyTo ?? config.replyTo ? { replyTo: options.replyTo ?? config.replyTo! } : {}),
    ...(options.attachments ? { attachments: options.attachments } : {}),
    ...(buildTags(options.tags) ? { tags: buildTags(options.tags) } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.scheduledAt ? { scheduledAt: options.scheduledAt } : {}),
  } as Parameters<NonNullable<ReturnType<typeof getResendClient>>['emails']['send']>[0]

  const resend = getResendClient()

  if (!resend || !config.enabled) {
    console.warn('[email] envío desactivado — no se envió:', { to, subject: options.subject })
    return { ok: true, id: null, skipped: 'disabled' }
  }

  try {
    const { data, error } = await resend.emails.send(
      payload,
      options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    )

    if (error) {
      console.error('[email] error de Resend:', error.message)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al enviar el email'
    console.error('[email] excepción al enviar:', message)
    return { ok: false, error: message }
  }
}

/** Igual que `sendEmail` pero lanza si falla — para scripts o cuando el correo es crítico. */
export async function sendEmailOrThrow(options: SendEmailOptions): Promise<string | null> {
  const result = await sendEmail(options)
  if (!result.ok) throw new Error(result.error)
  return result.id
}

/**
 * Envía varios emails en una sola llamada (hasta 100 por lote; se trocea solo).
 * Útil para notificar a todos los inscriptos de un evento.
 *
 * Ojo: la API batch de Resend no acepta adjuntos ni `scheduledAt`.
 */
export async function sendEmailBatch(
  messages: SendEmailOptions[]
): Promise<{ ok: boolean; sent: number; ids: string[]; errors: string[] }> {
  const config = getEmailConfig()
  const resend = getResendClient()
  const ids: string[] = []
  const errors: string[] = []

  const prepared = messages
    .map(m => {
      const to = config.devRedirectTo ? [config.devRedirectTo] : normalizeRecipients(m.to)
      if (to.length === 0) return null

      const rendered =
        m.html !== undefined
          ? { html: m.html, text: m.text }
          : m.blocks
            ? renderEmail({ title: m.subject, blocks: m.blocks, preheader: m.preheader })
            : { html: undefined, text: m.text }

      return {
        from: m.from ?? config.from,
        to,
        subject: m.subject,
        ...(rendered.html ? { html: rendered.html } : {}),
        ...(rendered.text ? { text: rendered.text } : {}),
        ...(m.replyTo ?? config.replyTo ? { replyTo: m.replyTo ?? config.replyTo! } : {}),
        ...(buildTags(m.tags) ? { tags: buildTags(m.tags) } : {}),
      }
    })
    .filter(Boolean) as any[]

  if (prepared.length === 0) return { ok: true, sent: 0, ids, errors }

  if (!resend || !config.enabled) {
    console.warn(`[email] envío desactivado — no se enviaron ${prepared.length} emails en lote`)
    return { ok: true, sent: 0, ids, errors }
  }

  for (let i = 0; i < prepared.length; i += 100) {
    const chunk = prepared.slice(i, i + 100)
    try {
      const { data, error } = await resend.batch.send(chunk)
      if (error) {
        errors.push(error.message)
        continue
      }
      for (const item of data?.data ?? []) {
        if (item?.id) ids.push(item.id)
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Error desconocido en el envío por lote')
    }
  }

  return { ok: errors.length === 0, sent: ids.length, ids, errors }
}
