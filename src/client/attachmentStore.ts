/**
 * Per-session pending file attachments (non-image). Images ride the core
 * draft-image pipeline (conversation.createDraftImages + shell.addImages) and
 * render in the core AttachmentRail; only text-ish files (txt/md/code/docx)
 * live here, keyed by session id, surfaced through the composer dock slot.
 *
 * Module-level singleton: the plugin client loads once per page, and the
 * store must survive session/tab switches (the composer unmounts on tab
 * switches via the conversation.view slot).
 */

export interface PendingAttachment {
  /** Stable React key / removal identity. */
  id: string
  /** Original filename (bubble label). */
  name: string
  /** Lower-case extension without the dot (format badge). */
  ext: string
  /** Extracted text, sent with the next message; '' when unreadable. */
  text: string
  /** Text was truncated at the size cap. */
  truncated: boolean
}

const EMPTY: readonly PendingAttachment[] = []
const bySession = new Map<string, PendingAttachment[]>()
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

/** Current pending attachments for one session (stable reference while unchanged). */
export function pendingAttachmentsOf(sessionId: string): readonly PendingAttachment[] {
  return bySession.get(sessionId) ?? EMPTY
}

export function addAttachment(sessionId: string, attachment: PendingAttachment): void {
  const next = [...(bySession.get(sessionId) ?? []), attachment]
  bySession.set(sessionId, next)
  emit()
}

export function removeAttachment(sessionId: string, id: string): void {
  const current = bySession.get(sessionId)
  if (current === undefined) return
  const next = current.filter((entry) => entry.id !== id)
  if (next.length === 0) bySession.delete(sessionId)
  else bySession.set(sessionId, next)
  emit()
}

/** Drop all pending attachments after a successful send. */
export function clearAttachments(sessionId: string): void {
  if (!bySession.delete(sessionId)) return
  emit()
}

export function subscribeAttachments(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
