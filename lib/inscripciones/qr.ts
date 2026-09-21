/**
 * QR de inscripción — el mismo código que muestra `/inscripciones` y que lee el
 * check-in de asistencia (`/eventos/[id]/asistencia`): el contenido es, tal cual,
 * el `evento_participantes.id`.
 *
 * Solo para código de servidor (Route Handlers, scripts): usa `qrcode` en Node.
 */
import QRCode from 'qrcode'

import type { EmailAttachment } from '@/lib/email'

/** Content-ID con el que el QR se embebe en el HTML de los correos (`cid:...`). */
export const QR_INSCRIPCION_CID = 'qr-inscripcion'

/** PNG del QR de una inscripción, listo para adjuntar o subir. */
export function generarQrInscripcionPng(participanteId: string): Promise<Buffer> {
  return QRCode.toBuffer(participanteId, {
    type: 'png',
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
}

/**
 * Adjunto inline del QR para `sendEmail`. Va como adjunto con `contentId`, así
 * los clientes que muestran imágenes lo dibujan en el cuerpo y el resto lo
 * reciben igual como archivo descargable.
 */
export async function adjuntoQrInscripcion(participanteId: string): Promise<EmailAttachment> {
  return {
    filename: 'qr-inscripcion.png',
    content: await generarQrInscripcionPng(participanteId),
    contentType: 'image/png',
    contentId: QR_INSCRIPCION_CID,
  }
}
