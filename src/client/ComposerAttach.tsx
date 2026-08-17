import { useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

import {
  addAttachment,
  pendingAttachmentsOf,
  removeAttachment,
  subscribeAttachments,
} from './attachmentStore.ts'
import { extractFileText, extensionOf, isCoreImageType, isSupportedFile } from './fileText.ts'
import { NS } from './locales.ts'
import type { MobileNavKey } from './locales.ts'

/**
 * Composer file attachment chrome (mobile):
 * - The "+" attach button rides the `conversation.input.left` slot (a
 *   React-native seat inside the tool row, next to the "/" command button
 *   via flex order) and opens a hidden multi-select file picker.
 * - Images flow into the CORE draft-image pipeline (conversation
 *   createDraftImages + shell.addImages) so the send path serializes them
 *   natively, but their bubbles render HERE in the dock rail (the official
 *   AttachmentRail inside the card is hidden on mobile) — one unified
 *   horizontally scrolling row above the composer card: image preview
 *   thumbnails and file chips, each with a top-right remove X.
 * - Files-only submissions (empty draft, no images) are activated by the
 *   SendOverlay: an invisible tap target over the official primary button
 *   (which stays disabled while the draft is empty), so there is no second
 *   send button — the input bar's own send arrow just works.
 * - Upload errors surface as a transient toast (a few seconds), never as
 *   the composer's persistent red notice strip.
 */

/** Caps mirrored from the host defaults (per-message). */
const MAX_IMAGES = 9
const MAX_FILES = 10

const ACCEPT = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  '.txt', '.md', '.markdown', '.json', '.csv', '.tsv', '.log', '.yaml',
  '.yml', '.xml', '.html', '.htm', '.js', '.mjs', '.cjs', '.jsx', '.ts',
  '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.go', '.rs', '.sh',
  '.bash', '.zsh', '.sql', '.ini', '.toml', '.conf', '.cfg', '.env', '.css',
  '.scss', '.less', '.svg', '.properties', '.docx',
].join(',')

/** Structural face of the services this chrome needs (tracker-safe casts). */
export interface ComposerAttachServices {
  createDraftImages(files: readonly File[]): readonly { id: string }[]
  releaseDraftImages(attachments: readonly { id: string }[]): void
  draftImages(ids: readonly string[]): readonly { id: string; previewUrl: string; file: File }[]
  /** Files-only submission: bypasses the empty-draft machine refusal and
   * routes straight into the (wrapped) sink, which appends the file text. */
  submitFiles(sessionId: string): void
  input: {
    shell(sessionId: string): {
      addImages(ids: readonly string[]): boolean
      removeImage(id: string): void
      submit(mode?: unknown): void
      setDraft(text: string): void
      snapshot: { imageIds: readonly string[] }
    }
  }
}

/** Translator signature narrowed to the mobileNav namespace (matches the slot-bound t). */
type Tfn = (key: MobileNavKey, params?: Record<string, string | number>) => string

let services: ComposerAttachServices | null = null
let translate: Tfn | null = null

/** Bind the services and the bound NS translator (called once from apply). */
export function initComposerAttach(conversation: ComposerAttachServices, t: Tfn): void {
  services = conversation
  translate = t
}

/** Structural face of the client sessions service (binding lookup). */
export interface SessionBindingLookup {
  binding(sessionId: string): { session: { sessionId: string } } | undefined
}

/* ------------------------------------------------------------------ */
/* Transient toast: upload errors land here for a few seconds, never in */
/* the composer's red notice strip.                                     */
/* ------------------------------------------------------------------ */

let toastHost: HTMLDivElement | null = null

function showToast(text: string): void {
  if (toastHost === null) {
    toastHost = document.createElement('div')
    toastHost.setAttribute('data-mobile-nav', 'toast-host')
    document.body.appendChild(toastHost)
  }
  const el = document.createElement('div')
  el.setAttribute('data-mobile-nav', 'toast')
  el.textContent = text
  toastHost.appendChild(el)
  window.setTimeout(() => {
    el.classList.add('data-mobile-nav-toast-out')
    window.setTimeout(() => el.remove(), 260)
  }, 2600)
}

export function toast(key: MobileNavKey, params?: Record<string, string | number>): void {
  if (translate === null) return
  showToast(translate(key, params))
}

/**
 * Bubble label for one pending file: the plain filename only. Bubbles are
 * uniform width, so over-long names are cut to the first ~13 glyph units
 * (CJK counts double) followed by a full stop — "cur_powermode.txt"
 * becomes "cur_powermod.".
 */
function bubbleName(name: string): string {
  const CAP = 13
  let units = 0
  let end = 0
  for (let i = 0; i < name.length; i++) {
    units += name.charCodeAt(i) > 0xff ? 2 : 1
    if (units > CAP) break
    end = i + 1
  }
  return end === name.length ? name : `${name.slice(0, end)}.`
}

/* ------------------------------------------------------------------ */
/* Hidden multi-select input; one per page, reused across sessions.     */
/* ------------------------------------------------------------------ */

let pickerElement: HTMLInputElement | null = null
function pickerInput(): HTMLInputElement {
  if (pickerElement !== null) return pickerElement
  const el = document.createElement('input')
  el.type = 'file'
  el.multiple = true
  el.accept = ACCEPT
  el.style.display = 'none'
  document.body.appendChild(el)
  pickerElement = el
  return el
}

/** Split the picked files and route each kind to its pipeline. */
async function intake(sessionId: string, fileList: readonly File[]): Promise<void> {
  if (services === null) return
  const images: File[] = []
  const textFiles: File[] = []
  const rejected: string[] = []
  for (const file of fileList) {
    if (isCoreImageType(file.type)) images.push(file)
    else if (isSupportedFile(file.name)) textFiles.push(file)
    else rejected.push(file.name)
  }
  if (rejected.length > 0) toast('attach.unsupported', { name: rejected.join('、') })
  // Images → core draft pipeline: serialization rides the official path,
  // bubbles render in the dock rail (imageIds from the input state).
  if (images.length > 0) {
    const shell = services.input.shell(sessionId)
    const existing = shell.snapshot.imageIds.length
    const added = images.slice(0, Math.max(0, MAX_IMAGES - existing))
    if (added.length < images.length) toast('attach.tooManyImages', { count: String(MAX_IMAGES) })
    if (added.length > 0) {
      let created: readonly { id: string }[] = []
      try {
        created = services.createDraftImages(added)
        if (!shell.addImages(created.map((attachment) => attachment.id))) services.releaseDraftImages(created)
      } catch {
        services.releaseDraftImages(created)
        toast('attach.imageFailed', { name: added[0]?.name ?? '' })
      }
    }
  }
  // Text-ish files → pending store (bubble rail + send-time text append).
  for (const file of textFiles) {
    if (pendingAttachmentsOf(sessionId).length >= MAX_FILES) {
      toast('attach.tooManyFiles', { count: String(MAX_FILES) })
      break
    }
    try {
      const { text, truncated } = await extractFileText(file)
      addAttachment(sessionId, {
        id: crypto.randomUUID(),
        name: file.name,
        ext: extensionOf(file.name),
        text,
        truncated,
      })
    } catch {
      toast('attach.readFailed', { name: file.name })
    }
  }
}

/** Open the picker for one session (attaches to that session's drafts). */
export function openFilePicker(sessionId: string): void {
  const el = pickerInput()
  el.value = ''
  el.onchange = () => {
    // Snapshot FIRST: clearing el.value empties the (possibly shared)
    // FileList in place, which would also empty the captured reference.
    const files = Array.from(el.files ?? [])
    el.value = ''
    if (files.length > 0) void intake(sessionId, files)
  }
  el.click()
}

/* ------------------------------------------------------------------ */
/* Slot components.                                                     */
/* ------------------------------------------------------------------ */

/** The "+" button next to the "/" command button (tool row). */
export type ComposerAttachButtonProps = PropsRuntime<'conversation.input.left'> & PropsLocale<typeof NS>

export function ComposerAttachButton({ session, t }: ComposerAttachButtonProps): React.JSX.Element {
  const sessionId = session?.sessionId
  return (
    <button
      type="button"
      data-mobile-nav="attach"
      aria-label={t('attach.label')}
      title={t('attach.label')}
      disabled={sessionId === undefined}
      onClick={() => {
        if (sessionId !== undefined) openFilePicker(sessionId)
      }}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M8.64453 1.5V7.34961H14.5V8.65039H8.64453V14.5H7.34473V8.65039H1.5V7.34961H7.34473V1.5H8.64453Z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}

/** One draft image resolved from the core attachment registry. */
interface DraftImage {
  id: string
  previewUrl: string
  name: string
}

/**
 * The unified pending-attachment rail above the composer card (dock slot):
 * image preview thumbnails first (core draft pipeline), then file chips
 * (pending store). Removes go through the respective pipeline so drafts
 * stay consistent with the core input state.
 */
export type FileRailDockProps = PropsRuntime<'conversation.input.dock'> & PropsLocale<typeof NS>

export function FileRailDock({ session, input, t }: FileRailDockProps): React.JSX.Element | null {
  const sessionId = session?.sessionId
  const files = useSyncExternalStore(
    subscribeAttachments,
    () => (sessionId === undefined ? [] : pendingAttachmentsOf(sessionId)),
  )
  const images: readonly DraftImage[] =
    sessionId === undefined || services === null
      ? EMPTY_IMAGES
      : services.draftImages(input?.imageIds ?? []).map((attachment) => ({
          id: attachment.id,
          previewUrl: attachment.previewUrl,
          name: attachment.file.name,
        }))
  if (sessionId === undefined || (files.length === 0 && images.length === 0)) return null
  return (
    <div data-mobile-nav="file-rail" role="group" aria-label={t('attach.label')}>
      {images.map((image) => (
        <div key={image.id} data-mobile-nav="img-bubble">
          <button
            type="button"
            data-mobile-nav="file-x"
            aria-label={t('attach.remove', { name: image.name })}
            onClick={() => services?.input.shell(sessionId).removeImage(image.id)}
          >
            ×
          </button>
          <img src={image.previewUrl} alt={image.name} draggable={false} />
        </div>
      ))}
      {files.map((file) => (
        <div key={file.id} data-mobile-nav="file-bubble" title={file.name}>
          <span data-mobile-nav="file-name">{bubbleName(file.name)}</span>
          <button
            type="button"
            data-mobile-nav="file-x"
            aria-label={t('attach.remove', { name: file.name })}
            onClick={() => removeAttachment(sessionId, file.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

const EMPTY_IMAGES: readonly DraftImage[] = []

/**
 * Files-only send activator (conversation.input.right slot): an invisible
 * tap target covering the official primary send button, rendered ONLY while
 * the draft is empty, no image drafts exist, and files are pending — the
 * exact state where the official button is disabled. Tapping it submits
 * through the input hub; the sink wrapper appends the file text, so the
 * input bar's own send arrow "just works" with attachments.
 */
export type SendOverlayProps = PropsRuntime<'conversation.input.right'> & PropsLocale<typeof NS>

export function SendOverlay({ session, input, t }: SendOverlayProps): React.JSX.Element | null {
  const sessionId = session?.sessionId
  const files = useSyncExternalStore(
    subscribeAttachments,
    () => (sessionId === undefined ? [] : pendingAttachmentsOf(sessionId)),
  )
  if (
    sessionId === undefined ||
    files.length === 0 ||
    (input?.draft ?? '').trim() !== '' ||
    (input?.imageIds.length ?? 0) > 0
  ) {
    return null
  }
  return (
    <button
      type="button"
      data-mobile-nav="send-overlay"
      aria-label={t('attach.sendFiles')}
      onClick={() => services?.submitFiles(sessionId)}
    />
  )
}
