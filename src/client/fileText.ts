/**
 * Browser-side attachment text extraction. Only the formats the model can
 * actually read are supported: plain-text-ish files are read verbatim
 * (capped), .docx is deflated (DecompressionStream) and its XML runs are
 * unwrapped into paragraphs. Anything else is rejected at pick time by the
 * caller's accept filter; a failed parse yields an unreadable marker.
 */

/** Per-file character cap for the appended prompt text. */
export const MAX_FILE_CHARS = 100_000

/** Extensions treated as plain text (read verbatim). */
const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'log', 'yaml', 'yml', 'xml',
  'html', 'htm', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'java', 'c',
  'cpp', 'h', 'hpp', 'go', 'rs', 'sh', 'bash', 'zsh', 'sql', 'ini', 'toml',
  'conf', 'cfg', 'env', 'css', 'scss', 'less', 'svg', 'properties',
])

/** Lower-case extension without the dot ('' when none). */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

/** MIME types the core draft-image pipeline accepts. */
export function isCoreImageType(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/gif'
}

/** A selectable non-image file? (text-ish or docx). */
export function isSupportedFile(name: string): boolean {
  const ext = extensionOf(name)
  return ext === 'docx' || TEXT_EXTS.has(ext)
}

function truncate(text: string, cap: number): { text: string; truncated: boolean } {
  if (text.length <= cap) return { text, truncated: false }
  return { text: text.slice(0, cap), truncated: true }
}

async function readTextFile(file: File): Promise<{ text: string; truncated: boolean }> {
  return truncate(await file.text(), MAX_FILE_CHARS)
}

/** Minimal docx reader: central-directory scan + deflate-raw inflate + XML text runs. */
async function readDocx(file: File): Promise<{ text: string; truncated: boolean }> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  // End of central directory record: locate from the tail (signature 0x06054b50).
  let eocd = -1
  const tail = Math.max(0, buf.length - 22 - 65536)
  for (let i = buf.length - 22; i >= tail; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) return { text: '', truncated: false }
  const count = view.getUint16(eocd + 10, true)
  const directory = view.getUint32(eocd + 16, true)
  let xml: Uint8Array | null = null
  for (let n = 0; n < count; n++) {
    const entry = directory + n * 46
    if (view.getUint32(entry, true) !== 0x02014b50) break
    const method = view.getUint16(entry + 10, true)
    const nameLength = view.getUint16(entry + 28, true)
    const localOffset = view.getUint32(entry + 42, true)
    const name = new TextDecoder().decode(buf.subarray(entry + 46, entry + 46 + nameLength))
    if (name !== 'word/document.xml') continue
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    // Local file header: 18-21 = compressed size, 22-25 = uncompressed size.
    const compressedSize = view.getUint32(localOffset + 18, true)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const raw = buf.subarray(start, start + compressedSize)
    if (method === 0) {
      xml = raw
    } else if (method === 8) {
      if (typeof DecompressionStream === 'undefined') return { text: '', truncated: false }
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      xml = new Uint8Array(await new Response(stream).arrayBuffer())
    }
    break
  }
  if (xml === null) return { text: '', truncated: false }
  const decoded = new TextDecoder().decode(xml)
  // Unwrap the OOXML runs: tabs/breaks become whitespace, paragraphs and
  // table rows become newlines, then every tag is stripped and entities
  // decoded. Field codes (instrText) survive as ordinary text — acceptable
  // noise for the char cap.
  let out = decoded
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<\/w:tr>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return truncate(out, MAX_FILE_CHARS)
}

/**
 * Read one selected file for sending. Throws when the file is unreadable
 * (the caller surfaces the failure toast).
 */
export async function extractFileText(file: File): Promise<{ text: string; truncated: boolean }> {
  return extensionOf(file.name) === 'docx' ? readDocx(file) : readTextFile(file)
}
