import { useEffect, useRef } from 'react'

/**
 * Plugin marketplace settings section. Catalog comes from the community
 * registry (awesome-dsh-plugin.com) proxied by the plugin's host half.
 * Layout: search + category chip list + one sort toggle, then a single-column
 * card list (no avatars). Clicking a card opens a GitHub-style README window
 * with the author avatar and a close control that sits outside the frame.
 */

interface MarketPlugin {
  name: string
  owner: string
  url: string
  category: string
  description: Record<string, string>
  stars: number
  added: string
  updatedAt?: string
  install: string
}
interface MarketCatalog {
  updated?: string | null
  count?: number
  categories: Record<string, { en?: string; zh?: string }>
  plugins: MarketPlugin[]
  installed?: string[]
}

const CATALOG_URL = '/api/mobile-nav/marketplace'
const README_URL = '/api/mobile-nav/marketplace/readme'
const README_FILE_URL = '/api/mobile-nav/marketplace/readme-file'
const INSTALL_URL = '/api/mobile-nav/marketplace/install'
const TRANSLATE_URL = '/api/mobile-nav/marketplace/translate'
const UPDATED_URL = '/api/mobile-nav/marketplace/updated'
const TRANSLATE_MT_URL = '/api/mobile-nav/marketplace/translate-mt'
const BATCH = 24

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (cls !== undefined && cls !== '') node.className = cls
  if (text !== undefined) node.textContent = text
  return node
}

function iconHtml(name: string): string {
  const paths: Record<string, string> = {
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'arrow-down': '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    'arrow-up': '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
  }
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ''}</svg>`
}

function iconEl(name: string, cls = ''): HTMLElement {
  const span = document.createElement('span')
  if (cls !== '') span.className = cls
  span.innerHTML = iconHtml(name)
  return span
}

function initialAvatar(name: string, cls = 'mkt-avatar-fallback'): HTMLElement {
  const d = el('span', cls)
  d.textContent = (name[0] ?? '?').toUpperCase()
  const palette = ['#5b8def', '#8f6ee8', '#e86e9f', '#e89a5b', '#5bc6c6', '#7fc76a', '#e0a83e', '#c68ee8']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  d.style.background = palette[h % palette.length] ?? '#5b8def'
  return d
}

function formatStars(n: number): string {
  if (n >= 1e6) return `${Math.round((n / 1e6) * 10) / 10}M`
  if (n >= 1e3) return `${Math.round((n / 1e3) * 10) / 10}K`
  return String(n)
}

/** Format an ISO / date string. Every card badge always carries the time
 * portion (`YYYY-MM-DD HH:mm`): a bare catalog date renders as `00:00` until
 * the real GitHub pushed_at arrives and replaces it. */
function formatUpdated(raw: string | undefined): string {
  const value = (raw ?? '').trim()
  if (value === '') return ''
  const ms = Date.parse(value.includes('T') || value.includes(' ') ? value : `${value}T00:00:00`)
  if (Number.isNaN(ms)) return value
  const d = new Date(ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const hasTime = /[T ]\d{2}:\d{2}/.test(value)
  if (!hasTime) return `${datePart} 00:00`
  return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const zhUI = (): boolean => (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('zh')

/** Full and compact time labels: `YYYY-MM-DD HH:mm` and `MM-DD HH:mm`. The
 * compact one is shown on narrow cards via a media query. */
function timeSpans(value: string): [HTMLElement, HTMLElement] {
  const short = formatUpdated(value)
  const fullMatch = /^(\d{4}-)(.*)$/.exec(short)
  const full = fullMatch !== null ? `${fullMatch[1]}${fullMatch[2] ?? ''}` : short
  const compact = fullMatch !== null ? (fullMatch[2] ?? short) : short
  const fullSpan = el('span', 'mkt-time-full', full)
  const shortSpan = el('span', 'mkt-time-short', compact)
  return [fullSpan, shortSpan]
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function parseRepo(url: string): { owner: string; repo: string } {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    return { owner: parts[0] ?? '', repo: parts[1] ?? '' }
  } catch {
    return { owner: '', repo: '' }
  }
}

/** The real GitHub repo key (`owner/repo`) for a catalog entry. Monorepo
 * entries whose `name` embeds a `#subpath` still key on the repository. */
function repoKeyOf(plugin: MarketPlugin): string {
  const p = parseRepo(plugin.url)
  const owner = p.owner || plugin.owner || ''
  const fallback = plugin.name.includes('#') ? (plugin.name.split('#')[0] ?? plugin.name) : plugin.name
  const repo = p.repo || fallback
  return `${owner}/${repo}`
}

/** A short display name: the last path segment of the repo/subpath. */
function shortName(plugin: MarketPlugin): string {
  const raw = plugin.name || ''
  const base = raw.includes('#') ? (raw.split('#').pop() ?? raw) : raw
  const segs = base.split('/').filter(Boolean)
  return segs.length > 0 ? (segs[segs.length - 1] ?? base) : base
}

/** Resolve an in-README link that points at a markdown file of the same repo
 * (language switchers like `[中文](README_CN.md)`) to a repo-relative path.
 * Returns null for external links / non-markdown — those keep opening in a new
 * tab. */
function resolveReadmePath(href: string): string | null {
  const h = href.trim()
  if (h === '' || h.startsWith('#') || h.startsWith('//')) return null
  if (!/\.(md|markdown|mdx)([?#]|$)/i.test(h)) return null
  // same-repo raw / blob URLs
  const rawMatch = /^https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+\.(?:md|markdown|mdx))(?:[?#]|$)/i.exec(h)
  if (rawMatch !== null) return rawMatch[1] ?? null
  const blobMatch = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/(.+\.(?:md|markdown|mdx))(?:[?#]|$)/i.exec(h)
  if (blobMatch !== null) return blobMatch[1] ?? null
  // other absolute URLs (http/https/mailto/…) — external, keep default behavior
  if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return null
  const path = h.split('#')[0] ?? ''
  const withoutQuery = path.split('?')[0] ?? ''
  const segs = withoutQuery
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .split('/')
    .filter((seg) => seg !== '' && seg !== '.' && seg !== '..')
  return segs.length > 0 ? segs.join('/') : null
}

/* ---------- README rendering ----------
 * The registry serves raw markdown (some entries are HTML documents, and most
 * markdown files embed HTML badge blocks and GFM tables). Everything is
 * converted to safe HTML here — raw text is always escaped first, so no tag
 * from a README can ever reach the DOM as markup.
 */

function cleanInline(s: string): string {
  return String(s).replace(/<[^>]+>/g, '').trim()
}

/** Convert HTML fragments inside a README into plain markdown so the markdown
 * pass below never paints raw tags. Runs on every README. */
function preprocessHtml(src: string): string {
  let s = src
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '')
  // bare autolinks in angle brackets survive the final tag-strip
  s = s.replace(/<((?:https?|ftp):\/\/[^>\s]+)>/g, (_m, url) => `[${url}](${url})`)
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<hr\s*\/?>/gi, '\n---\n')
  s = s.replace(/<\/(p|div|h[1-6]|tr|section|article|blockquote|li|ul|ol|table|thead|tbody|details|summary|pre)>/gi, '\n')
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, n, body) => `\n${'#'.repeat(Number(n))} ${cleanInline(body)}\n`)
  s = s.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\balt=["']([^"']*)["'][^>]*>/gi, (_m, src, alt) => `![${alt}](${src})`)
  s = s.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, (_m, src) => `![](${src})`)
  s = s.replace(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, body) => `[${cleanInline(body)}](${href})`)
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, body) => `\`${cleanInline(body)}\``)
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, body) => `**${cleanInline(body)}**`)
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, body) => `*${cleanInline(body)}*`)
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, body) => `\n\`\`\`\n${decodeEntities(cleanInline(body))}\n\`\`\`\n`)
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, body) => `- ${cleanInline(body)}\n`)
  s = s.replace(/<[^>]+>/g, '')
  return decodeEntities(s)
}

const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s: string): string => escHtml(s).replace(/"/g, '&quot;')

/** Inline markdown → HTML. Text is escaped first; code spans are parked in
 * placeholders so `*`/`_` inside them are never mangled by emphasis rules. */
function inlineMd(s: string): string {
  const esc = (x: string): string =>
    x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const codes: string[] = []
  let t = esc(s)
  t = t.replace(/`([^`]+)`/g, (_m, body) => {
    codes.push(`<code>${body}</code>`)
    return `\u0000${codes.length - 1}\u0000`
  })
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_m, alt, src, title) =>
    `<img alt="${escAttr(alt ?? '')}" src="${escAttr(src)}" loading="lazy"${title !== undefined ? ` title="${escAttr(title)}"` : ''}>`)
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_m, label, href, title) =>
    `<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer"${title !== undefined ? ` title="${escAttr(title)}"` : ''}>${label}</a>`)
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  t = t.replace(/(^|[\s(])_([^_]+)_([\s).,;!?]|$)/g, '$1<em>$2</em>$3')
  t = t.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[Number(i)] ?? '')
  return t
}

/** Minimal GFM markdown → HTML: headings, fenced code, blockquotes, tables,
 * nested lists, task lists, hr, paragraphs and inline formatting. */
function renderMarkdown(raw: string): string {
  const text = preprocessHtml(raw)
  const split = text.replace(/\r\n/g, '\n').split('\n')
  // Merge soft continuations of a list item ("- item\n  continued text") into
  // the item line so they do not break the list.
  const lines: string[] = []
  for (const rawLine of split) {
    const prev = lines[lines.length - 1]
    if (
      prev !== undefined &&
      /^\s*([-*+]|\d+[.)])\s+/.test(prev) &&
      /^\s+\S/.test(rawLine) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(rawLine)
    ) {
      lines[lines.length - 1] = `${prev} ${rawLine.trim()}`
    } else {
      lines.push(rawLine)
    }
  }

  const out: string[] = []
  const inline = (s: string): string => inlineMd(s)

  interface Frame {
    type: 'ul' | 'ol'
    indent: number
  }
  const stack: Frame[] = []
  const closeAllLists = (): void => {
    while (stack.length > 0) out.push(`</${stack.pop()?.type ?? 'ul'}>`)
  }
  const closeListsDeeperThan = (indent: number): void => {
    while (stack.length > 0 && (stack[stack.length - 1]?.indent ?? 0) > indent) {
      out.push(`</${stack.pop()?.type ?? 'ul'}>`)
    }
  }

  let para: string[] = []
  const flushPara = (): void => {
    if (para.length > 0) {
      out.push(`<p>${inline(para.join(' '))}</p>`)
      para = []
    }
  }

  const indentOf = (line: string): number => {
    let n = 0
    for (const ch of line) {
      if (ch === ' ') n += 1
      else if (ch === '\t') n += 2
      else break
    }
    return n
  }

  let i = 0
  while (i < lines.length) {
    const rawLine = lines[i] ?? ''
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    // fenced code block
    if (/^(```|~~~)/.test(trimmed)) {
      flushPara()
      closeAllLists()
      const lang = trimmed.slice(3).trim()
      out.push(`<pre><code${lang !== '' ? ` class="language-${escAttr(lang)}"` : ''}>`)
      i++
      while (i < lines.length && !/^(```|~~~)/.test((lines[i] ?? '').trim())) {
        out.push(`${escHtml(lines[i] ?? '')}\n`)
        i++
      }
      out.push('</code></pre>')
      i++
      continue
    }

    if (trimmed === '') {
      flushPara()
      closeAllLists()
      i++
      continue
    }

    // horizontal rule
    if (/^([-*_])\s*\1\s*\1+$/.test(trimmed)) {
      flushPara()
      closeAllLists()
      out.push('<hr>')
      i++
      continue
    }

    // heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading !== null) {
      flushPara()
      closeAllLists()
      const level = (heading[1] ?? '#').length
      out.push(`<h${level}>${inline(heading[2] ?? '')}</h${level}>`)
      i++
      continue
    }

    // blockquote (multi-line)
    if (/^>/.test(trimmed)) {
      flushPara()
      closeAllLists()
      const qlines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) {
        qlines.push((lines[i] ?? '').replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${inline(qlines.join(' '))}</blockquote>`)
      continue
    }

    // GFM table: a row followed by a `| --- | --- |` separator line
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+-?\s*\|?\s*$/.test(lines[i + 1] ?? '')) {
      flushPara()
      closeAllLists()
      const header = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i] ?? '')) {
        rows.push((lines[i] ?? '').replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()))
        i++
      }
      let html = '<div class="mkt-table-wrap"><table><thead><tr>'
      for (const cell of header) html += `<th>${inline(cell)}</th>`
      html += '</tr></thead><tbody>'
      for (const row of rows) {
        html += '<tr>'
        for (let ci = 0; ci < header.length; ci++) html += `<td>${inline(row[ci] ?? '')}</td>`
        html += '</tr>'
      }
      html += '</tbody></table></div>'
      out.push(html)
      continue
    }

    // lists (ul/ol, nested by indentation, task lists)
    const listMatch = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (listMatch !== null) {
      const indent = indentOf(line)
      const marker = listMatch[2] ?? ''
      const content = listMatch[3] ?? ''
      const task = /^\[([ xX])\]\s+/.exec(content)
      flushPara()
      closeListsDeeperThan(indent)
      const top = stack[stack.length - 1]
      const type: 'ul' | 'ol' = /^\d+[.)]/.test(marker) ? 'ol' : 'ul'
      if (top === undefined || top.indent < indent) {
        stack.push({ type, indent })
        out.push(`<${type}>`)
      } else if (top.type !== type) {
        out.push(`</${top.type}>`)
        stack.pop()
        stack.push({ type, indent })
        out.push(`<${type}>`)
      }
      if (task !== null) {
        const done = task[1] === 'x' || task[1] === 'X'
        const body = content.slice(task[0].length)
        out.push(`<li class="mkt-task${done ? ' mkt-task-done' : ''}"><input type="checkbox" disabled${done ? ' checked' : ''}> ${inline(body)}</li>`)
      } else {
        out.push(`<li>${inline(content)}</li>`)
      }
      i++
      continue
    }

    // paragraph
    closeAllLists()
    para.push(line)
    i++
  }
  flushPara()
  closeAllLists()
  return out.join('\n')
}

function enter(card: HTMLElement, index: number): void {
  card.style.animationDelay = `${Math.min(index, 10) * 24}ms`
  card.classList.add('mkt-enter')
}

function haystackOf(plugin: MarketPlugin): string {
  const desc = plugin.description
  return `${plugin.name} ${plugin.owner} ${plugin.url} ${desc.zh ?? ''} ${desc.en ?? ''}`.toLowerCase()
}

export function MarketplaceView() {
  const hostRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = hostRef.current
    if (host === null) return

    let catalog: MarketCatalog | null = null
    let activeCategory = 'all'
    type SortMode = 'updated' | 'stars'
    let sortMode: SortMode = 'updated'
    let sortDir: 1 | -1 = -1 // -1: descending (倒序), the default for every mode
    let query = ''
    let rendered = 0
    let filtered: MarketPlugin[] = []
    let toastTimer = 0
    let searchTimer = 0
    const haystacks = new WeakMap<MarketPlugin, string>()
    const fetchedUpdated = new Set<string>()
    const pendingUpdated = new Set<string>()

    const page = el('div', 'mkt-page')
    const toolbar = el('div', 'mkt-toolbar')
    const searchWrap = el('div', 'mkt-search')
    searchWrap.append(iconEl('search', 'mkt-search-ic'))
    const search = el('input', 'mkt-search-input') as HTMLInputElement
    search.type = 'search'
    search.placeholder = '搜索作者、插件名或简介'
    search.autocomplete = 'off'
    search.spellcheck = false
    searchWrap.append(search)

    const zh = zhUI()
    const row = el('div', 'mkt-row')
    const catWrap = el('div', 'mkt-cat-wrap')
    const catBtn = el('button', 'mkt-cat') as HTMLButtonElement
    catBtn.type = 'button'
    catBtn.setAttribute('aria-haspopup', 'listbox')
    catBtn.setAttribute('aria-expanded', 'false')
    catWrap.append(catBtn, iconEl('chevron', 'mkt-cat-chevron'))
    const catMenu = el('div', 'mkt-cat-menu')
    catMenu.setAttribute('role', 'listbox')
    catWrap.append(catMenu)
    const closeCatMenu = (): void => {
      catMenu.classList.remove('mkt-cat-open')
      catBtn.setAttribute('aria-expanded', 'false')
    }
    catBtn.addEventListener('click', (event) => {
      event.stopPropagation()
      const open = catMenu.classList.toggle('mkt-cat-open')
      catBtn.setAttribute('aria-expanded', String(open))
    })
    const onCatDocClick = (event: Event): void => {
      if (!catWrap.contains(event.target as Node)) closeCatMenu()
    }
    const onCatKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeCatMenu()
    }
    document.addEventListener('click', onCatDocClick)
    document.addEventListener('keydown', onCatKey)

    const SORT_OPTS: Array<{ mode: SortMode; label: string; icon: string }> = [
      { mode: 'updated', label: zh ? '更新时间' : 'Updated', icon: 'clock' },
      { mode: 'stars', label: 'Star', icon: 'star' },
    ]
    const sortGroup = el('div', 'mkt-sort-group')
    const sortBtns = new Map<SortMode, HTMLButtonElement>()
    const paintSort = (): void => {
      for (const opt of SORT_OPTS) {
        const btn = sortBtns.get(opt.mode)
        if (btn === undefined) continue
        const active = sortMode === opt.mode
        btn.classList.toggle('mkt-sort-active', active)
        btn.replaceChildren(
          iconEl(opt.icon, `mkt-ic${opt.icon === 'star' ? ' mkt-ic-star' : ''}`),
          document.createTextNode(` ${opt.label}`),
          iconEl(sortDir === -1 ? 'arrow-down' : 'arrow-up', 'mkt-ic mkt-ic-dir'),
        )
        btn.title = active
          ? sortDir === -1
            ? `当前：按${opt.label}倒序，点击改为升序`
            : `当前：按${opt.label}升序，点击改为倒序`
          : `按${opt.label}倒序排列`
      }
    }
    for (const opt of SORT_OPTS) {
      const btn = el('button', 'mkt-sort-btn')
      btn.type = 'button'
      btn.dataset.sort = opt.mode
      btn.addEventListener('click', () => {
        if (sortMode === opt.mode) {
          sortDir = sortDir === -1 ? 1 : -1
        } else {
          sortMode = opt.mode
          sortDir = -1
        }
        paintSort()
        recompute()
        renderGrid()
      })
      sortBtns.set(opt.mode, btn)
      sortGroup.append(btn)
    }
    paintSort()
    row.append(catWrap, sortGroup)

    const meta = el('div', 'mkt-meta', '')
    const grid = el('div', 'mkt-list')
    const sentinel = el('div', 'mkt-sentinel', '加载中…')
    const empty = el('div', 'mkt-empty', '没有匹配的插件')
    const toast = el('div', 'mkt-toast')
    toolbar.append(searchWrap, row, meta)
    page.append(toolbar, grid, sentinel, toast)
    host.append(page)

    const showToast = (text: string, isErr = false): void => {
      toast.textContent = text
      toast.classList.toggle('mkt-toast-err', isErr)
      toast.classList.add('mkt-toast-on')
      window.clearTimeout(toastTimer)
      toastTimer = window.setTimeout(() => toast.classList.remove('mkt-toast-on'), 3200)
    }

    const categoryLabel = (id: string): string => {
      const cat = catalog?.categories[id]
      if (cat === undefined) return id
      return zhUI() ? (cat.zh ?? cat.en ?? id) : (cat.en ?? cat.zh ?? id)
    }

    const recompute = (): void => {
      const plugins = catalog?.plugins ?? []
      const q = query.trim().toLowerCase()
      filtered = plugins.filter((p) => {
        if (activeCategory !== 'all' && p.category !== activeCategory) return false
        if (q === '') return true
        return (haystacks.get(p) ?? haystackOf(p)).includes(q)
      })
      const dirMul = sortDir === -1 ? 1 : -1
      if (sortMode === 'stars') {
        filtered = [...filtered].sort((a, b) => (b.stars - a.stars) * dirMul)
      } else {
        filtered = [...filtered].sort((a, b) => {
          const ta = Date.parse(a.updatedAt || a.added || '') || 0
          const tb = Date.parse(b.updatedAt || b.added || '') || 0
          return (tb - ta) * dirMul
        })
      }
    }

    const timeOf = (plugin: MarketPlugin): string => formatUpdated(plugin.updatedAt || plugin.added)

    const buildCategories = (): void => {
      catMenu.replaceChildren()
      const add = (id: string, label: string): void => {
        const item = el('button', 'mkt-cat-opt')
        item.type = 'button'
        item.setAttribute('role', 'option')
        item.dataset.cat = id
        item.textContent = label
        item.addEventListener('click', () => {
          activeCategory = id
          catBtn.textContent = label
          closeCatMenu()
          recompute()
          renderGrid()
        })
        catMenu.append(item)
      }
      add('all', zh ? '全部分类' : 'All categories')
      const catIds = Object.keys(catalog?.categories ?? {})
      for (const id of catIds) add(id, categoryLabel(id))
      const activeLabel = activeCategory === 'all' ? (zh ? '全部分类' : 'All categories') : categoryLabel(activeCategory)
      catBtn.textContent = activeLabel
      for (const item of catMenu.querySelectorAll<HTMLElement>('.mkt-cat-opt')) {
        item.classList.toggle('mkt-cat-opt-active', item.dataset.cat === activeCategory)
      }
    }

    const buildCard = (plugin: MarketPlugin, index: number): HTMLElement => {
      const card = el('article', 'mkt-card')
      card.dataset.repo = repoKeyOf(plugin)
      const descZh = plugin.description.zh
      const descEn = plugin.description.en
      const showEn = !zhUI() || descZh === undefined || descZh === ''
      const descText = showEn ? (descEn ?? descZh ?? '') : (descZh ?? descEn ?? '')

      const top = el('div', 'mkt-card-top')
      const name = el('h4', 'mkt-name', shortName(plugin))
      const time = el('time', 'mkt-time')
      time.dateTime = plugin.updatedAt || plugin.added || ''
      time.append(iconEl('clock', 'mkt-ic mkt-ic-time'), ...timeSpans(timeOf(plugin)))
      top.append(name, time)

      const byline = el('div', 'mkt-byline', `${plugin.owner}  ·  ${categoryLabel(plugin.category)}`)
      const desc = el('p', 'mkt-desc', descText)

      const foot = el('div', 'mkt-foot')
      const stars = el('span', 'mkt-stars')
      stars.append(iconEl('star', 'mkt-ic mkt-ic-star'), document.createTextNode(` ${formatStars(plugin.stars)}`))
      stars.title = `${plugin.stars} stars`
      const actions = el('div', 'mkt-actions')

      if (showEn && descText !== '') {
        const translateBtn = el('button', 'mkt-btn mkt-translate', '翻译')
        translateBtn.type = 'button'
        translateBtn.addEventListener('click', (event) => {
          event.stopPropagation()
          void translateDescription(desc, translateBtn)
        })
        actions.append(translateBtn)
      }

      const installBtn = el('button', 'mkt-btn mkt-install', '安装')
      installBtn.type = 'button'
      // Check if already installed (npm name or bundle name in profile)
      const npmName = (plugin.install ?? '').replace(/^dsh\s+plugin(?:\s+--profile\s+\S+)?\s+add\s+/, '').trim()
      const isInstalled = (catalog?.installed ?? []).some((name) => name === npmName || name === plugin.name || name === shortName(plugin))
      if (isInstalled) {
        installBtn.textContent = ''
        installBtn.append(iconEl('check', 'mkt-ic'), document.createTextNode(' 已安装'))
        installBtn.classList.add('mkt-installed')
        installBtn.disabled = true
      }
      installBtn.addEventListener('click', (event) => {
        event.stopPropagation()
        void installPlugin(plugin, installBtn)
      })
      actions.append(installBtn)

      foot.append(stars, actions)
      card.append(top, byline, desc, foot)
      card.addEventListener('click', () => openRepo(plugin))
      enter(card, index)
      return card
    }

    const translateDescription = async (descEl: HTMLElement, btn: HTMLButtonElement): Promise<void> => {
      const text = (descEl.textContent ?? '').trim()
      if (text === '') return
      btn.disabled = true
      btn.textContent = '翻译中…'
      try {
        const res = await fetch(TRANSLATE_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        const payload = (await res.json()) as { ok?: boolean; translation?: string; error?: string }
        if (payload.ok === true && payload.translation !== undefined && payload.translation !== '') {
          descEl.textContent = payload.translation
          descEl.classList.add('mkt-desc-translated')
          btn.textContent = '已翻译'
          btn.disabled = true
        } else {
          showToast(payload.error ?? '翻译失败', true)
          btn.textContent = '翻译'
          btn.disabled = false
        }
      } catch {
        showToast('翻译请求失败', true)
        btn.textContent = '翻译'
        btn.disabled = false
      }
    }

    const installPlugin = async (plugin: MarketPlugin, btn: HTMLButtonElement): Promise<void> => {
      if (btn.dataset.state === 'busy') return
      btn.dataset.state = 'busy'
      btn.disabled = true
      const original = btn.textContent ?? '安装'
      btn.textContent = '安装中…'
      btn.classList.add('mkt-busy')
      try {
        const spec = (plugin.install ?? '').trim()
        const target =
          spec !== ''
            ? spec.replace(/^dsh\s+plugin(?:\s+--profile\s+\S+)?\s+add\s+/, '').trim()
            : `github:${plugin.owner}/${shortName(plugin)}`
        const res = await fetch(INSTALL_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ target }),
        })
        const payload = (await res.json()) as {
          ok?: boolean
          output?: string
          error?: string
          hotLoaded?: boolean
          hotName?: string
          hotLoadError?: string
          persisted?: string[]
          persistFailed?: boolean
        }
        if (payload.ok === true) {
          btn.textContent = ''
          btn.append(iconEl('check', 'mkt-ic'), document.createTextNode(' 已安装'))
          btn.classList.add('mkt-installed')
          btn.classList.remove('mkt-busy')
          if (payload.hotLoaded === true && payload.hotName !== undefined && payload.hotName !== '') {
            showToast(payload.persistFailed === true
              ? `安装完成，${payload.hotName} 已热加载生效（缺少 dsh.bundle 元数据，重启后需重新安装）`
              : `安装完成，${payload.hotName} 已热加载生效`)
          } else if (payload.hotLoaded === true) {
            showToast('安装完成，插件已热加载生效')
          } else if (payload.hotLoadError !== undefined && payload.hotLoadError !== '') {
            const brief = payload.hotLoadError.length > 54 ? `${payload.hotLoadError.slice(0, 54)}…` : payload.hotLoadError
            showToast(`已安装，但热加载失败（${brief}），重启 DSH 后生效`)
          } else {
            showToast('安装完成，重启 DSH 后生效（Ctrl+C 停止后重新运行 dsh web）')
          }
        } else {
          btn.textContent = '安装'
          btn.classList.remove('mkt-busy')
          showToast(payload.error ?? '安装失败', true)
        }
      } catch {
        btn.textContent = original
        btn.classList.remove('mkt-busy')
        showToast('安装请求失败', true)
      } finally {
        btn.dataset.state = ''
      }
    }

    let modal: HTMLElement | null = null
    const closeModal = (): void => {
      if (modal === null) return
      const wrap = modal.querySelector<HTMLElement>('.mkt-win-wrap')
      const backdrop = modal.querySelector<HTMLElement>('.mkt-backdrop')
      backdrop?.classList.add('mkt-backdrop-out')
      wrap?.classList.add('mkt-window-out')
      document.removeEventListener('keydown', onModalKey)
      window.setTimeout(() => {
        modal?.remove()
        modal = null
      }, 200)
    }

    const openRepo = (plugin: MarketPlugin): void => {
      if (modal !== null) return
      const repo = parseRepo(plugin.url)
      const owner = repo.owner || plugin.owner
      const modalRoot = el('div', 'mkt-modal')
      modal = modalRoot
      const backdrop = el('div', 'mkt-backdrop')
      const wrap = el('div', 'mkt-win-wrap')
      const closeBtn = el('button', 'mkt-close')
      closeBtn.type = 'button'
      closeBtn.setAttribute('aria-label', '关闭')
      closeBtn.append(iconEl('x', 'mkt-ic'))
      closeBtn.addEventListener('click', closeModal)

      const win = el('section', 'mkt-window')
      const head = el('div', 'mkt-win-head')
      const ident = el('div', 'mkt-win-ident')
      const avatar = el('img', 'mkt-win-avatar') as HTMLImageElement
      avatar.src = `https://github.com/${owner}.png?size=80`
      avatar.alt = ''
      avatar.referrerPolicy = 'no-referrer'
      avatar.addEventListener('error', () => {
        if (avatar.isConnected) avatar.replaceWith(initialAvatar(owner, 'mkt-win-avatar-fallback'))
      })
      const crumb = el('div', 'mkt-win-crumb')
      const ownerLink = el('a', 'mkt-win-owner', owner) as HTMLAnchorElement
      ownerLink.href = `https://github.com/${owner}`
      ownerLink.target = '_blank'
      ownerLink.rel = 'noopener noreferrer'
      ownerLink.addEventListener('click', (event) => event.stopPropagation())
      const slash = el('span', 'mkt-win-slash', ' / ')
      const repoLink = el('a', 'mkt-win-repo', shortName(plugin)) as HTMLAnchorElement
      repoLink.href = plugin.url
      repoLink.target = '_blank'
      repoLink.rel = 'noopener noreferrer'
      repoLink.addEventListener('click', (event) => event.stopPropagation())
      crumb.append(ownerLink, slash, repoLink)
      const info = el('div', 'mkt-win-info', `★ ${formatStars(plugin.stars)}  ·  更新于 ${timeOf(plugin)}  ·  ${categoryLabel(plugin.category)}`)
      ident.append(avatar, (() => {
        const col = el('div', 'mkt-win-meta')
        col.append(crumb, info)
        return col
      })())
      const gh = el('a', 'mkt-win-link') as HTMLAnchorElement
      gh.href = plugin.url
      gh.target = '_blank'
      gh.rel = 'noopener noreferrer'
      gh.append(iconEl('external', 'mkt-ic mkt-ic-link'), document.createTextNode(' GitHub'))
      head.append(ident, gh)

      const filebar = el('div', 'mkt-win-filebar')
      const filebarLabel = el('span', 'mkt-win-file', 'README.md')
      const translateMd = el('button', 'mkt-btn mkt-translate-md', '翻译')
      translateMd.type = 'button'
      translateMd.disabled = true
      translateMd.title = '机翻为简体中文'
      filebar.append(filebarLabel, translateMd)

      const body = el('div', 'mkt-win-body')
      body.innerHTML = '<div class="mkt-win-loading">加载 README…</div>'
      win.append(head, filebar, body)
      wrap.append(closeBtn, win)
      modalRoot.append(backdrop, wrap)
      document.body.appendChild(modalRoot)
      backdrop.addEventListener('click', closeModal)
      document.addEventListener('keydown', onModalKey)

      let readmeText = ''
      const repoName = repo.repo || shortName(plugin)
      const renderReadme = (text: string, label: string, translated = false): void => {
        readmeText = text
        body.innerHTML = `<article class="mkt-readme markdown-body${translated ? ' mkt-readme-translated' : ''}">${renderMarkdown(text)}</article>`
        filebarLabel.textContent = label
        translateMd.disabled = false
        translateMd.hidden = /[\u3400-\u9fff]/.test(text)
        if (translated) {
          translateMd.textContent = '已翻译'
          translateMd.disabled = true
        } else {
          translateMd.textContent = '翻译'
        }
      }
      const loadReadmeFile = async (path: string): Promise<void> => {
        body.innerHTML = '<div class="mkt-win-loading">加载文档…</div>'
        try {
          const res = await fetch(`${README_FILE_URL}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repoName)}&path=${encodeURIComponent(path)}`)
          const payload = (await res.json()) as { ok?: boolean; readme?: string; path?: string; error?: string }
          if (payload.ok === true && payload.readme !== undefined) {
            renderReadme(payload.readme, payload.path ?? path)
          } else {
            body.innerHTML = `<div class="mkt-win-error">${payload.error ?? '无法加载文档'}</div>`
          }
        } catch {
          body.innerHTML = '<div class="mkt-win-error">无法加载文档</div>'
        }
      }
      // In-place navigation: an in-README link to a markdown file of the same
      // repo (language switcher e.g. `[中文](README_CN.md)`) loads it right
      // here instead of opening a new browser tab.
      body.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null
        if (target === null) return
        const anchor = target.closest('a')
        if (anchor === null) return
        const path = resolveReadmePath(anchor.getAttribute('href') ?? '')
        if (path === null) return
        event.preventDefault()
        void loadReadmeFile(path)
      })

      translateMd.addEventListener('click', () => {
        if (translateMd.dataset.state === 'busy') return
        const text = readmeText.trim()
        if (text === '') return
        translateMd.dataset.state = 'busy'
        translateMd.disabled = true
        const original = translateMd.textContent ?? '翻译'
        translateMd.textContent = '翻译中…'
        void (async () => {
          try {
            const res = await fetch(TRANSLATE_MT_URL, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ text }),
            })
            const payload = (await res.json()) as { ok?: boolean; translation?: string; error?: string }
            if (payload.ok === true && payload.translation !== undefined && payload.translation !== '') {
              renderReadme(payload.translation, filebarLabel.textContent ?? 'README.md', true)
            } else {
              showToast(payload.error ?? '翻译失败', true)
              translateMd.textContent = original
              translateMd.disabled = false
            }
          } catch {
            showToast('翻译请求失败', true)
            translateMd.textContent = original
            translateMd.disabled = false
          } finally {
            translateMd.dataset.state = ''
          }
        })()
      })

      void (async () => {
        try {
          const res = await fetch(`${README_URL}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repoName)}`)
          const payload = (await res.json()) as { ok?: boolean; readme?: string; url?: string; error?: string }
          if (payload.ok === true && payload.readme !== undefined) {
            const label = (payload.url ?? '').split('/').filter(Boolean).pop() || 'README.md'
            renderReadme(payload.readme, label)
          } else {
            body.innerHTML = `<div class="mkt-win-error">${payload.error ?? '无法加载 README'}</div>`
          }
        } catch {
          body.innerHTML = '<div class="mkt-win-error">无法加载 README</div>'
        }
      })()

      requestAnimationFrame(() => {
        backdrop.classList.add('mkt-backdrop-in')
        wrap.classList.add('mkt-window-in')
      })
    }
    const onModalKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeModal()
    }

    const renderGrid = (): void => {
      grid.replaceChildren()
      rendered = 0
      if (filtered.length === 0) {
        grid.append(empty)
        sentinel.hidden = true
        meta.textContent = '共 0 个插件'
        return
      }
      appendMore()
      meta.textContent = `共 ${filtered.length} 个插件`
    }
    const appendMore = (): void => {
      const next = filtered.slice(rendered, rendered + BATCH)
      const frag = document.createDocumentFragment()
      next.forEach((plugin, index) => {
        frag.append(buildCard(plugin, rendered + index))
      })
      grid.append(frag)
      rendered += next.length
      sentinel.hidden = filtered.length <= rendered
      sentinel.textContent = rendered >= filtered.length ? '' : '加载更多…'
      requestUpdated(reposVisible())
    }

    const reposVisible = (): string[] => {
      const out: string[] = []
      for (const card of grid.querySelectorAll<HTMLElement>('.mkt-card')) {
        const key = card.dataset.repo
        if (key !== undefined && key !== '') out.push(key)
      }
      return out
    }

    const applyUpdatedMap = (map: Record<string, string>): void => {
      if (catalog === null) return
      let changed = false
      for (const plugin of catalog.plugins) {
        const key = repoKeyOf(plugin)
        const iso = map[key]
        if (iso !== undefined && iso !== '' && plugin.updatedAt !== iso) {
          plugin.updatedAt = iso
          changed = true
        }
      }
      if (!changed) return
      for (const card of grid.querySelectorAll<HTMLElement>('.mkt-card')) {
        const key = card.dataset.repo
        if (key === undefined) continue
        const iso = map[key]
        if (iso === undefined) continue
        const time = card.querySelector<HTMLTimeElement>('.mkt-time')
        if (time !== null) {
          time.replaceChildren(iconEl('clock', 'mkt-ic mkt-ic-time'), ...timeSpans(iso))
          time.dateTime = iso
        }
      }
      if (sortMode === 'updated') {
        recompute()
        renderGrid()
      }
    }

    const requestUpdated = (keys: string[]): void => {
      const need = keys.filter((key) => !fetchedUpdated.has(key) && !pendingUpdated.has(key))
      if (need.length === 0) return
      for (const key of need) pendingUpdated.add(key)
      void (async () => {
        try {
          const res = await fetch(`${UPDATED_URL}?repos=${encodeURIComponent(need.join(','))}`)
          const payload = (await res.json()) as { ok?: boolean; updated?: Record<string, string> }
          if (payload.ok === true && payload.updated !== undefined) applyUpdatedMap(payload.updated)
        } catch {
          // keep the catalog dates
        } finally {
          for (const key of need) {
            pendingUpdated.delete(key)
            fetchedUpdated.add(key)
          }
        }
      })()
    }

    search.addEventListener('input', () => {
      window.clearTimeout(searchTimer)
      searchTimer = window.setTimeout(() => {
        query = search.value
        recompute()
        renderGrid()
      }, 120)
    })

    void (async () => {
      meta.textContent = '正在加载插件市场…'
      try {
        const res = await fetch(CATALOG_URL)
        const payload = (await res.json()) as { ok?: boolean; error?: string } & MarketCatalog
        if (payload.ok !== true) {
          meta.textContent = payload.error ?? '市场暂时不可用'
          empty.textContent = '市场暂时不可用'
          grid.append(empty)
          return
        }
        catalog = payload
        for (const plugin of payload.plugins) haystacks.set(plugin, haystackOf(plugin))
        buildCategories()
        recompute()
        renderGrid()
      } catch {
        meta.textContent = '市场加载失败，请检查网络'
        empty.textContent = '市场加载失败'
        grid.append(empty)
      }
    })()

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          if (rendered < filtered.length) appendMore()
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      document.removeEventListener('keydown', onModalKey)
      document.removeEventListener('click', onCatDocClick)
      document.removeEventListener('keydown', onCatKey)
      closeModal()
      window.clearTimeout(toastTimer)
      window.clearTimeout(searchTimer)
      host.textContent = ''
    }
  }, [])
  return <div ref={hostRef} />
}
