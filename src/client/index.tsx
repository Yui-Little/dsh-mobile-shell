import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { MobileNavToggle } from './MobileNavToggle.tsx'
import { MobileNavOverlay } from './MobileNavOverlay.tsx'
import { MobileStatusView } from './MobileStatusView.tsx'
import { MarketplaceView } from './MarketplaceView.tsx'
import { GithubKeyView } from './GithubKeyView.tsx'
import { ComposerAttachButton, FileRailDock, SendOverlay, initComposerAttach, toast } from './ComposerAttach.tsx'
import { clearAttachments, pendingAttachmentsOf } from './attachmentStore.ts'
import type { PendingAttachment } from './attachmentStore.ts'
import { MOBILE_CSS } from './mobile.css.ts'
import { NS, commandDescriptionsZh, en, zh } from './locales.ts'
import type { MobileNavKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Directory-drawer controls copy. */
    'mobileNav': MobileNavKey
  }
  interface SlotMap {
    /** One settings page per Settings nav entry (the marketplace section). */
    'settings.section': {
      kind: 'list'
      scope: 'root'
    }
  }
}

/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
export const inject = ['slots', 'layout', 'locale', 'sessionLogDownload', 'conversation', 'sessions']

/**
 * Serialize pending file attachments into the prompt text appended at send
 * time. The model receives one labelled block per file; unreadable parses
 * degrade to a filename-only marker instead of dropping the attachment.
 */
function buildAttachmentText(files: readonly PendingAttachment[], t: (key: MobileNavKey, params?: Record<string, string | number>) => string): string {
  return files
    .map((file) => {
      let body = file.text
      if (body === '') body = t('attach.unreadable')
      else if (file.truncated) body = `${body}${t('attach.truncated')}`
      // Hard paragraph break (\n\n) so the "[附件] name" line renders as its
      // own block; the fold pass below then has clean blocks to collapse.
      return `${t('attach.filePrefix', { name: file.name })}\n\n${body}`
    })
    .join('\n\n')
}

/**
 * Mobile-adaptive shell, browser half: injects the mobile stylesheet, then
 * contributes the directory toggle to the session header and the backdrop +
 * floating button to the shell overlay.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mobile-shell: dictionaries')

  const t = ctx.locale.bind(NS)

  // Structural composer detection, independent of our data-mobile-nav-composer
  // stamp. The official composer textarea lives inside the grow wrapper
  // ([class$="_grow"], the only _grow class in the whole client graph) as a
  // sibling of the hidden mirror ([data-input-mirror]) — a stable, hashed-name
  // and attribute based fingerprint that works even in the microtask window
  // before the MutationObserver stamps our marker after a React commit.
  // The card is the closest [class$="_card"] ancestor of the textarea.
  const composerCardOf = (node: EventTarget | null): HTMLElement | null => {
    if (!(node instanceof Element)) return null
    const textarea = node instanceof HTMLTextAreaElement ? node : node.closest('textarea')
    if (textarea === null) return null
    const card = textarea.closest<HTMLElement>('[class$="_card"]')
    if (card === null) return null
    if (!card.hasAttribute('data-mobile-nav-composer')) {
      const parent = textarea.parentElement
      if (parent === null || parent.querySelector('[data-input-mirror]') === null) return null
    }
    return card
  }
  /** (Re-)stamp a composer card's markers; idempotent, safe on any pass. */
  const stampComposerCard = (card: HTMLElement, textarea: HTMLTextAreaElement): void => {
    card.setAttribute('data-mobile-nav-composer', '')
    const heroEmpty = card.closest('[data-phase="hero"]') !== null && textarea.value === ''
    if (heroEmpty) card.setAttribute('data-mobile-nav-hero-empty', '')
    else card.removeAttribute('data-mobile-nav-hero-empty')
  }

  // One-shot update notice: after a plugin update the page must be reloaded
  // to pick up the new client bundle, and stale tabs are hard to tell apart
  // from updated ones. Show a brief toast exactly once per version (tracked
  // in localStorage) so the user can confirm which bundle is running.
  ctx.effect(() => {
    const VERSION = '0.1.7'
    const KEY = 'dsh-mobile-shell:last-seen-version'
    try {
      if (localStorage.getItem(KEY) === VERSION) return () => {}
      localStorage.setItem(KEY, VERSION)
    } catch {
      return () => {}
    }
    const el = document.createElement('div')
    el.setAttribute('data-mobile-nav', 'update-toast')
    el.textContent = `手机UI插件已更新 v${VERSION}，本页已是新界面`
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 3200)
    return () => {
      el.remove()
    }
  }, 'dsh-mobile-shell: update notice')

  // Host slash-command descriptions are English-only (no host-side i18n);
  // translate them for the composer command menu when the UI locale is
  // Chinese. Patch the session-keyed directory's fetch (read at pull time),
  // so every catalog refresh — including `commands/change` repulls — flows
  // through the translation; contributions (e.g. /model) are already
  // localized by their own namespaces.
  ctx.effect(() => {
    const commandUi = ctx.get('commandUi') as
      | { directory: { fetchCommands: (sessionId: string) => Promise<readonly { name: string; description: string; input?: { hint: string } }[]>; invalidateAll: () => void } }
      | undefined
    if (commandUi?.directory === undefined) return () => {}
    const originalFetch = commandUi.directory.fetchCommands
    commandUi.directory.fetchCommands = async (sessionId) => {
      const rows = await originalFetch(sessionId)
      if (ctx.locale.getLocale().active !== 'zh') return rows
      return rows.map((row) => {
        const translated = commandDescriptionsZh[row.name]
        return translated !== undefined && translated !== row.description ? { ...row, description: translated } : row
      })
    }
    // The directory caches one snapshot per session; drop the stale
    // snapshots whenever the locale (or any dictionary) changes so the next
    // pull re-translates with the active locale.
    const unsubscribe = ctx.locale.subscribe(() => commandUi.directory.invalidateAll())
    return () => {
      unsubscribe()
      commandUi.directory.fetchCommands = originalFetch
    }
  }, 'dsh-mobile-shell: command descriptions')

  // File attachments: images ride the core draft pipeline; text-ish files
  // (txt/md/code/docx) sit in the pending store and their extracted text is
  // appended to the message at send time. The official primary button stays
  // disabled while the draft is empty, so the dock rail carries its own
  // Send action; both wraps land on instance methods the callers read at
  // call time, which is tracker-safe (the cordis Service proxy forwards
  // property reads/writes to the raw instance).
  ctx.effect(() => {
    const conversation = ctx.conversation as unknown as {
      createDraftImages(files: readonly File[]): readonly { id: string }[]
      releaseDraftImages(attachments: readonly { id: string }[]): void
      draftImages(ids: readonly string[]): readonly { id: string; previewUrl: string; file: File }[]
      input: {
        shell(sessionId: string): {
          addImages(ids: readonly string[]): boolean
          removeImage(id: string): void
          notify(level: 'info' | 'error', text: string): void
          submit(mode?: unknown): void
          setDraft(text: string): void
          snapshot: { imageIds: readonly string[] }
        }
        sink(session: { sessionId: string }, text: string, imageIds: readonly string[], mode: unknown): void
      }
      sendSession(session: { sessionId: string }, text: string, imageIds: readonly string[], mode: unknown): Promise<unknown>
      submitFiles(sessionId: string): void
    }
    if (conversation?.input?.shell === undefined) return () => {}
    // The cordis Service tracker rebinds ctx per property access, and an
    // assignment THROUGH the proxy lands on a shadow, invisible to other
    // callers' proxies. Reach the raw instance via the tracker's escape
    // hatch (Symbol.for('cordis.original')) so the wrapped methods are
    // visible to every proxy that reads them.
    const raw = (conversation as unknown as Record<symbol, unknown>)[Symbol.for('cordis.original')]
    const target = (raw ?? conversation) as typeof conversation
    // The machine refuses an empty-draft submit (onEnter returns []), so
    // files-only sends route directly into the sink — the same path the
    // wrapped sink takes for typed sends. The sessions service is tracker-
    // wrapped too, so bind through the raw instance (same escape hatch).
    const rawSessions = (ctx.sessions as unknown as Record<symbol, unknown>)[Symbol.for('cordis.original')] ?? ctx.sessions
    const binding = (rawSessions as unknown as { binding(id: string): { session: { sessionId: string } } | undefined }).binding.bind(
      rawSessions as unknown as { binding(id: string): { session: { sessionId: string } } | undefined },
    )
    ;(target as unknown as { submitFiles(sessionId: string): void }).submitFiles = (sessionId: string): void => {
      const entry = binding(sessionId)
      if (entry === undefined) return
      input.sink(entry.session, '', [], 'queue')
    }
    initComposerAttach(target, t)
    const input = conversation.input
    const originalSink = input.sink.bind(input)
    // Same tracker caveat as input.sink: method reads through the Service
    // proxy need an explicit receiver, or `this` is undefined in the
    // original implementation (strict mode) and the vision fallback below
    // would throw inside its try/catch and silently re-surface the host
    // error instead of degrading the image to a file reference.
    const originalDraftImages = conversation.draftImages.bind(conversation)
    input.sink = (session, text, imageIds, mode) => {
      try {
        const sessionId = session?.sessionId
        if (typeof sessionId === 'string' && sessionId !== '') {
          const files = pendingAttachmentsOf(sessionId)
          if (files.length > 0) {
            appendedOriginal = text
            const appended = buildAttachmentText(files, t)
            text = text === '' ? appended : `${text}\n\n${appended}`
          }
        }
      } catch {
        // Attachment wrapping must never block a send.
      }
      // CRITICAL: the original sink returns the admission Promise that the
      // input machine's settleSubmit() awaits to emit "submit-settled" (which
      // flips the phase back from "submitting" → "plain"). Without `return`,
      // the machine receives undefined, crashes on `undefined.then(...)`
      // BEFORE publishing the phase change, and the composer is left
      // readOnly/"submitting" forever — a dead input box after every send.
      return originalSink(session, text, imageIds, mode)
    }
    // Original draft text while files are being appended (see sink wrap):
    // the core restores the SUBMITTED text on failure, which would leave the
    // raw [附件] block in the input — put the user's own draft back.
    let appendedOriginal: string | null = null
    const originalSendSession = target.sendSession
    target.sendSession = async (session, text, imageIds, mode) => {
      const original = appendedOriginal
      appendedOriginal = null
      try {
        // The original prototype method needs `this` = the service instance
        // (it reads this.draftImages / this.serializeImages / this.releaseDraftImages);
        // invoke it with the raw instance as receiver.
        const result = await originalSendSession.call(target, session, text, imageIds, mode)
        clearAttachments(session.sessionId)
        return result
      } catch (error) {
        if (original !== null) {
          // Run after the core sink's own restore (which writes the appended
          // text back into the empty draft) and put the user's text back.
          const shell = conversation.input.shell(session.sessionId)
          queueMicrotask(() => {
            shell.setDraft(original)
          })
        }
        // Vision fallback: the active model may reject image input outright
        // (attachment-error), yet the harness ships vision tools the model
        // CAN call — they just need a file path inside the session workspace.
        // Store each draft image there and resend the message as a text
        // reference ([附件] card); the model then reads the file via tools.
        if (imageIds.length > 0) {
          try {
            const shell = conversation.input.shell(session.sessionId)
            const drafts = originalDraftImages(imageIds)
            const parts: string[] = []
            for (const draft of drafts) {
              // The browser RPC interceptor only accepts JSON bodies, so the
              // image rides as base64 (chunked to avoid stack overflow on
              // large files).
              const buf = await draft.file.arrayBuffer()
              const bytes = new Uint8Array(buf)
              let binary = ''
              for (let i = 0; i < bytes.length; i += 0x8000) {
                binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
              }
              const res = await fetch('/api/mobile-nav/store-image', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  name: draft.file.name,
                  sessionId: session.sessionId,
                  data: btoa(binary),
                }),
              })
              const payload = (await res.json().catch(() => null)) as { ok?: boolean; path?: string } | null
              if (payload?.ok !== true || typeof payload.path !== 'string') throw new Error('store-image failed')
              parts.push(
                `${t('attach.filePrefix', { name: draft.file.name })}\n\n${t('attach.imagePath', { path: payload.path })}\n${t('attach.imageHint')}`,
              )
            }
            if (parts.length > 0) {
              for (const id of imageIds) shell.removeImage(id)
              const fallback = text === '' ? parts.join('\n\n') : `${text}\n\n${parts.join('\n\n')}`
              const result = await originalSendSession.call(target, session, fallback, [], mode)
              clearAttachments(session.sessionId)
              return result
            }
          } catch (fallbackError) {
            // fallback failed too — surface WHY so the failure is not silent
            toast('attach.fallbackFailed', {
              error: fallbackError instanceof Error ? fallbackError.message.slice(0, 120) : String(fallbackError),
            })
          }
        }
        throw error
      }
    }
    return () => {
      input.sink = originalSink
      target.sendSession = originalSendSession
    }
  }, 'dsh-mobile-shell: file attachment send')

  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-mobile-shell'
    tag.dataset.pluginCss = 'dsh-mobile-shell/mobile.css'
    tag.textContent = MOBILE_CSS
    document.head.appendChild(tag)
    return () => {
      tag.remove()
    }
  }, 'dsh-mobile-shell: styles')

  // Phone chrome: KEEP the system status bar (no fullscreen) and make it
  // blend into the page. On narrow screens:
  // - The viewport meta gains viewport-fit=cover, so env(safe-area-inset-top)
  //   is the real status-bar / notch height and the stylesheet can push every
  //   surface below it (off notched phones, or in a browser tab where the
  //   layout viewport already sits below the status bar, the inset is 0 and
  //   nothing shifts).
  // - A theme-color meta tracks the shell background (the official theme is
  //   toggled by body[data-ds-dark-theme], which flips --dsw-alias-bg-base):
  //   Android then paints the status bar / URL bar with the page's own base
  //   color, so the status bar reads as part of the UI instead of a foreign
  //   strip. The drawer paints the same strip on iOS / notch displays.
  // - gesturestart is suppressed as the legacy-iOS fallback for double-tap
  //   zoom; modern browsers are covered by the stylesheet's
  //   touch-action: manipulation (which keeps pan and pinch zoom).
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    const originalViewport = viewport?.content ?? ''
    const themeMeta = document.createElement('meta')
    themeMeta.name = 'theme-color'
    const bodyBg = (): string => getComputedStyle(document.body).backgroundColor

    const sync = (): void => {
      if (viewport !== null) {
        // interactive-widget=resizes-content (Chrome 108+): when the soft
        // keyboard opens, the layout viewport shrinks so the bottom-pinned
        // composer sits flush against the keyboard. Without it Chrome
        // defaults to resizes-visual — the layout viewport stays tall and
        // the composer floats above a dead blank strip between it and the
        // keyboard. Older browsers ignore the unknown token.
        viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content'
      }
      themeMeta.content = bodyBg()
      if (themeMeta.parentElement === null) document.head.appendChild(themeMeta)
    }
    const restore = (): void => {
      if (viewport !== null) viewport.content = originalViewport
      themeMeta.remove()
    }
    const onGestureStart = (event: Event) => event.preventDefault()
    if (narrow.matches) sync()
    const onChange = (event: MediaQueryListEvent) => (event.matches ? sync() : restore())
    narrow.addEventListener('change', onChange)
    const observer = new MutationObserver(() => {
      if (narrow.matches) themeMeta.content = bodyBg()
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    document.addEventListener('gesturestart', onGestureStart)
    return () => {
      narrow.removeEventListener('change', onChange)
      observer.disconnect()
      document.removeEventListener('gesturestart', onGestureStart)
      restore()
    }
  }, 'dsh-mobile-shell: status bar theme + viewport + zoom guard')

  // Unified structural markup on narrow screens. The stylesheet used to
  // express these with :has() selectors (32 of them, several nested) — on a
  // phone every DOM change (tab switches re-mount the whole chat tree) made
  // the browser re-evaluate all of them, which is exactly the jank felt when
  // switching Chat / Trajectory / Status. Replace them with one merged
  // MutationObserver that stamps stable data attributes; the style rules now
  // key off those attributes only.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    let scheduled = false
    // Drawer switch gate. Opening/closing the drawer mounts/unmounts the whole
    // session list: the React commit (a ~60ms main-thread task on desktop,
    // more on a phone) runs BEFORE the CSS transition even starts, so a
    // getAnimations()-based gate misses exactly the busiest window — and
    // getAnimations() itself forces a style flush per call. Instead the gate
    // is a defer flag armed by the frame's collapsed-attribute mutation and
    // the transition events, and a 420ms timer flushes one consolidated sync
    // after the switch settles. Zero style queries.
    let deferred = false
    let switchTimer = 0
    const armSwitch = (): void => {
      deferred = true
      if (switchTimer !== 0) window.clearTimeout(switchTimer)
      switchTimer = window.setTimeout(() => {
        switchTimer = 0
        if (deferred) {
          deferred = false
          sync()
        }
      }, 420)
    }
    const sync = (): void => {
      scheduled = false
      // Composer markers first, BEFORE the drawer-switch gate: after a send /
      // session switch the whole chat tree re-mounts, and if this stamp lags
      // behind the React commit the official textarea can be focused with the
      // IME closed while our CSS (and the tap recovery handlers) key off the
      // stamp. The stamp is cheap and idempotent — never let the gate delay it.
      for (const card of document.querySelectorAll<HTMLElement>('[data-phase] [class*="_card"]')) {
        const textarea = card.querySelector('textarea')
        if (textarea !== null) stampComposerCard(card, textarea)
        else {
          card.removeAttribute('data-mobile-nav-composer')
          card.removeAttribute('data-mobile-nav-hero-empty')
        }
      }
      if (deferred) return
      // 1) Modal structure. The official settings panel is uniquely
      //    `dialog > nav + content` (the <nav> is implicit role=navigation
      //    and holds the section buttons). Every other modal — export,
      //    delete confirm, model picker — is a primitives Modal whose first
      //    child is a content/header block, never a <nav>. An earlier check
      //    required `[role=navigation] === null`, which inverted the match:
      //    real settings never got the full-page sheet, and delete/export
      //    were stretched to cover the viewport.
      let anyModal = false
      for (const modal of document.querySelectorAll<HTMLElement>('[aria-modal="true"]')) {
        anyModal = true
        const first = modal.firstElementChild
        const isSettings =
          first instanceof HTMLElement &&
          first.tagName === 'NAV' &&
          first.querySelectorAll('button').length >= 2
        if (isSettings) modal.setAttribute('data-mobile-nav', 'settings-sheet')
        else if (modal.getAttribute('data-mobile-nav') === 'settings-sheet') modal.removeAttribute('data-mobile-nav')
        const overlay = modal.parentElement
        if (overlay !== null && isSettings) overlay.setAttribute('data-mobile-nav', 'sheet-overlay')
        else if (overlay?.getAttribute('data-mobile-nav') === 'sheet-overlay') overlay.removeAttribute('data-mobile-nav')
        // The "Open configuration file" action opens the settings document in
        // a native desktop editor (xdg-open / macOS open). A phone has no
        // such opener — the call can only ever fail — so hide the button.
        if (isSettings) {
          for (const btn of modal.querySelectorAll<HTMLElement>('button')) {
            if (/Open configuration file|打开配置文件/.test(btn.textContent ?? '')) {
              btn.setAttribute('hidden', '')
            }
          }
        }
      }
      // 2) Body-level modal marker: hides the floating pet while any modal
      //    owns the screen (was body:has([aria-modal])).
      if (anyModal) document.body.setAttribute('data-mobile-nav', 'modal-open')
      else document.body.removeAttribute('data-mobile-nav')
      // 3) Message scroll area: user-message markdown typography (was
      //    [class$="_scroll"]:has(p)).
      for (const scroll of document.querySelectorAll<HTMLElement>('[data-phase] [class$="_scroll"]')) {
        if (scroll.querySelector('p, li, [class*="_text_"]') !== null) scroll.setAttribute('data-mobile-nav', 'markdown')
        else scroll.removeAttribute('data-mobile-nav')
      }
      // (Composer card markers — step 4 — now run at the top of sync(),
      //  before the drawer-switch gate, so the stamp never lags a React
      //  re-mount after send.)
      // 5) The Files header button is an entry for the dsh-web-ui explorer
      //    sheet; without the suite installed it is a dead control — hide it.
      const hasExplorer = document.querySelector('[data-aionui-explorer-col], .aionui-explorer-handle') !== null
      for (const btn of document.querySelectorAll<HTMLElement>('[data-mobile-nav="files"]')) {
        if (hasExplorer) btn.removeAttribute('hidden')
        else btn.setAttribute('hidden', '')
      }
      // 6) Floating pet marker (was body > [class$="_float"]:has(...)).
      for (const el of Array.from(document.body.children)) {
        if (!(el instanceof HTMLElement)) continue
        const sprite = el.querySelector('[class$="_sprite"][role="button"]')
        const isPet = /_float$/.test(el.className) && sprite !== null
        if (isPet) el.setAttribute('data-mobile-nav', 'pet')
        else if (el.getAttribute('data-mobile-nav') === 'pet') el.removeAttribute('data-mobile-nav')
      }
      // 7) Native title tooltips ("black box, white text") are a desktop
      //    hover affordance; on touch they only surface on long-press and
      //    cover the UI. Drop every title attribute on narrow screens —
      //    aria-label (where present) keeps the accessibility name, and
      //    desktop is untouched (this effect only runs below 1024px).
      //    The attribute observer below also catches live updates (e.g. the
      //    header's token-usage label re-renders its title every turn).
      for (const el of document.querySelectorAll<HTMLElement>('[title]')) {
        el.removeAttribute('title')
      }
      // 6) Official session-status row (hidden on mobile; the Status tab
      //    shows the figures instead). The row has a hashed class, so mark
      //    it by text: a [class$=_root] carrying metrics text with no
      //    textarea (the composer card also ends in _root).
      for (const root of document.querySelectorAll<HTMLElement>('[data-phase] [class$="_root"]')) {
        if (root.closest('[class$="_composerStack"]') === null) continue
        const text = root.textContent ?? ''
        if (!/(turns|steps|\bLLM\b|轮|步)/.test(text)) continue
        if (root.querySelector('textarea') !== null) continue
        root.setAttribute('data-mobile-nav', 'stats')
      }
    }
    const schedule = (): void => {
      if (scheduled) return
      scheduled = true
      // Microtask: coalesce every mutation of the current task into one
      // pass, still before the browser paints (no one-frame style flash).
      queueMicrotask(sync)
    }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    const onInput = (event: Event): void => {
      const target = event.target as HTMLTextAreaElement | null
      if (target === null || target.tagName !== 'TEXTAREA') return
      const card = target.closest<HTMLElement>('[data-phase="hero"] [class$="_card"]')
      if (card === null) {
        target.closest<HTMLElement>('[class$="_card"]')?.removeAttribute('data-mobile-nav-hero-empty')
        return
      }
      if (target.value === '') card.setAttribute('data-mobile-nav-hero-empty', '')
      else card.removeAttribute('data-mobile-nav-hero-empty')
    }
    document.addEventListener('input', onInput, true)
    // Arm the gate on the drawer's transform transition and on the frame's
    // collapsed-attribute flip (the latter covers the pre-transition React
    // commit, which mutates the tree before the transition starts). The end
    // event flushes early; the 420ms timer in armSwitch() is the backstop.
    const isDrawerSlide = (event: TransitionEvent): boolean => {
      const target = event.target as HTMLElement | null
      if (target === null) return false
      return (
        document.querySelector('[data-mobile-nav="frame"] > :first-child') === target &&
        event.propertyName === 'transform'
      )
    }
    const onTransitionStart = (event: TransitionEvent): void => {
      if (isDrawerSlide(event)) armSwitch()
    }
    const onTransitionEnd = (event: TransitionEvent): void => {
      if (!isDrawerSlide(event)) return
      if (switchTimer !== 0) {
        window.clearTimeout(switchTimer)
        switchTimer = 0
      }
      if (deferred) {
        deferred = false
        sync()
      }
    }
    document.addEventListener('transitionstart', onTransitionStart, true)
    document.addEventListener('transitionend', onTransitionEnd, true)
    const onCollapsedChange = (): void => {
      if (narrow.matches) armSwitch()
    }
    const collapsedObserver = new MutationObserver(onCollapsedChange)
    collapsedObserver.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-sidebar-collapsed'],
    })
    // Live title updates (React re-renders set the attribute directly, which
    // the childList observer never sees). Strip on any title mutation; the
    // removal itself cannot re-trigger (the element no longer matches).
    const titleObserver = new MutationObserver(() => {
      if (!narrow.matches) return
      for (const el of document.querySelectorAll<HTMLElement>('[title]')) {
        el.removeAttribute('title')
      }
    })
    titleObserver.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['title'],
    })
    sync()
    return () => {
      observer.disconnect()
      collapsedObserver.disconnect()
      titleObserver.disconnect()
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('transitionstart', onTransitionStart, true)
      document.removeEventListener('transitionend', onTransitionEnd, true)
      if (switchTimer !== 0) window.clearTimeout(switchTimer)
    }
  }, 'dsh-mobile-shell: markup markers')

  // File attachments must reach the model verbatim, but the official
  // renderer has no attachment channel for text files — the extracted body
  // rides the user-message text and would flood the transcript (a whole
  // novel, say, pushing earlier messages off-screen). After render, fold
  // everything below the "[附件] name" line into a native <details>
  // (inserted directly into the DOM we own — the renderer's no-HTML policy
  // does not apply). The message data is untouched, so the model still sees
  // the full content. Runs on narrow screens only.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    // Per-extension file icon for the attachment card.
    const FILE_ICONS: Record<string, string> = {
      md: '📝', txt: '📄', docx: '📘', pdf: '📕', json: '🧾', yml: '🧾', yaml: '🧾',
      js: '💻', ts: '💻', py: '💻', sh: '💻', bash: '💻', sql: '🗄️', csv: '📊',
    }
    const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
    const fold = (): void => {
      for (const row of document.querySelectorAll<HTMLElement>('[data-phase] [class$="_userRow"]')) {
        const bubble = row.querySelector<HTMLElement>('[class$="_bubble"]')
        if (bubble === null || bubble.hasAttribute('data-mobile-nav-attach-folded')) continue
        const container = bubble.children.length === 1 ? bubble.firstElementChild : bubble
        if (container === null) continue
        const text = (container.textContent ?? '').trim()
        const segments = text.split(/\n(?=(?:\[附件\]|\[Attachment\]) )/)
        let prefix = ''
        const blocks = segments.filter((segment, index) => {
          const isBlock = /^(?:\[附件\]|\[Attachment\]) /.test(segment)
          if (index === 0 && !isBlock) {
            prefix = segment
            return false
          }
          return isBlock
        })
        if (blocks.length === 0) continue
        container.textContent = ''
        // Modern messenger layout: text stays in the bubble, attachments
        // render OUTSIDE it as media blocks (image thumbnails / file chips).
        // The full body (paths, hints) is for the model only — never shown.
        const host = bubble.parentElement
        const media = document.createElement('div')
        media.setAttribute('data-mobile-nav', 'attach-media')
        // GalleyGrid rules (LobeChat): 1 image -> single column; 2-4 ->
        // two columns (4 = 2+2); more -> first row 3 columns + the rest.
        // Images first in one square-cropped grid, then text files as a
        // vertical chip list (WeChat/Telegram style).
        const images: { name: string; src: string }[] = []
        const files: { name: string; ext: string }[] = []
        for (const block of blocks) {
          const nl = block.indexOf('\n')
          const nameLine = (nl === -1 ? block : block.slice(0, nl)).trim()
          const body = (nl === -1 ? '' : block.slice(nl + 1)).trim()
          if (body === '') continue
          const name = nameLine.replace(/^(?:\[附件\]|\[Attachment\]) /, '')
          const dot = name.lastIndexOf('.')
          const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
          if (IMAGE_EXTS.has(ext)) {
            const pathMatch = body.match(/(?:图片文件|Image file)[:：]\s*(\S+)/)
            const path = pathMatch?.[1]
            if (path !== undefined) {
              images.push({ name, src: `/api/mobile-nav/image?path=${encodeURIComponent(path)}` })
            }
          } else {
            files.push({ name, ext })
          }
        }
        if (images.length > 0) {
          // Horizontal thumbnail strip — the same mental model as the
          // picker rail: small squares, swipe left/right, tap to zoom.
          const strip = document.createElement('div')
          strip.className = 'media-strip'
          strip.setAttribute('data-mobile-nav', 'attach-strip')
          for (const image of images) {
            const img = document.createElement('img')
            img.src = image.src
            img.alt = image.name
            img.loading = 'lazy'
            img.setAttribute('data-mobile-nav', 'attach-thumb')
            strip.append(img)
          }
          media.append(strip)
        }
        for (const file of files) {
          const chip = document.createElement('div')
          chip.className = 'attach-file-chip'
          const icon = document.createElement('span')
          icon.textContent = FILE_ICONS[file.ext] ?? '📄'
          const nm = document.createElement('span')
          nm.className = 'attach-chip-name'
          nm.textContent = file.name
          chip.append(icon, nm)
          media.append(chip)
        }
        if (media.childNodes.length > 0) {
          if (host !== null) host.append(media)
          else container.append(media)
        }
        if (prefix.trim() !== '') {
          const lead = document.createElement('div')
          lead.textContent = prefix.trim()
          lead.style.whiteSpace = 'pre-wrap'
          container.append(lead)
        } else {
          // Pure-attachment message: hide the empty text bubble entirely.
          bubble.setAttribute('data-mobile-nav', 'attach-only')
        }
        bubble.setAttribute('data-mobile-nav-attach-folded', '')
      }
    }
    // Lightbox: tap a thumbnail to view it full-screen; tap anywhere to
    // close, arrow buttons (or swipe) to move through the strip.
    let lightbox: HTMLElement | null = null
    const openLightbox = (thumbs: HTMLImageElement[], index: number): void => {
      lightbox?.remove()
      const overlay = document.createElement('div')
      overlay.setAttribute('data-mobile-nav', 'lightbox')
      const image = document.createElement('img')
      let current = index
      const show = (i: number): void => {
        current = (i + thumbs.length) % thumbs.length
        const thumb = thumbs[current]
        if (thumb === undefined) return
        image.src = thumb.src
        image.alt = thumb.alt ?? ''
        prevBtn.style.display = thumbs.length > 1 ? '' : 'none'
        nextBtn.style.display = thumbs.length > 1 ? '' : 'none'
      }
      const prevBtn = document.createElement('button')
      prevBtn.className = 'lb-btn lb-prev'
      prevBtn.setAttribute('aria-label', 'previous')
      prevBtn.textContent = '‹'
      const nextBtn = document.createElement('button')
      nextBtn.className = 'lb-btn lb-next'
      nextBtn.setAttribute('aria-label', 'next')
      nextBtn.textContent = '›'
      prevBtn.addEventListener('click', (event) => {
        event.stopPropagation()
        show(current - 1)
      })
      nextBtn.addEventListener('click', (event) => {
        event.stopPropagation()
        show(current + 1)
      })
      // Swipe to switch (touch).
      let startX = 0
      overlay.addEventListener('touchstart', (event) => {
        startX = event.touches[0]?.clientX ?? 0
      }, { passive: true })
      overlay.addEventListener('touchend', (event) => {
        const dx = (event.changedTouches[0]?.clientX ?? startX) - startX
        if (Math.abs(dx) > 40) {
          event.preventDefault()
          show(current + (dx < 0 ? 1 : -1))
        }
      }, { passive: false })
      overlay.addEventListener('click', () => {
        overlay.remove()
        lightbox = null
      })
      overlay.append(image, prevBtn, nextBtn)
      document.body.append(overlay)
      lightbox = overlay
      show(index)
    }
    const onMediaTap = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null
      if (target === null || !(target instanceof HTMLImageElement)) return
      const strip = target.closest<HTMLElement>('[data-mobile-nav="attach-strip"]')
      if (strip === null) return
      const thumbs = [...strip.querySelectorAll<HTMLImageElement>('img')]
      openLightbox(thumbs, thumbs.indexOf(target))
    }
    document.addEventListener('click', onMediaTap, true)
    fold()
    let raf = 0
    const observer = new MutationObserver(() => {
      if (raf !== 0) return
      raf = requestAnimationFrame(() => {
        raf = 0
        fold()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.removeEventListener('click', onMediaTap, true)
      lightbox?.remove()
      if (raf !== 0) cancelAnimationFrame(raf)
    }
  }, 'dsh-mobile-shell: attachment fold')

  // On phones the soft-keyboard return key should insert a line break, not
  // send (sending goes through the send button). Desktop keeps Enter-to-send.
  // IME composition (Chinese pinyin confirm) and Shift+Enter are untouched.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
      const target = event.target as HTMLElement | null
      if (target === null || !(target instanceof HTMLTextAreaElement)) return
      if (composerCardOf(target) === null) return
      event.preventDefault()
      event.stopPropagation()
      const start = target.selectionStart ?? target.value.length
      const end = target.selectionEnd ?? start
      target.setRangeText('\n', start, end, 'end')
      target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak' }))
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, 'dsh-mobile-shell: enter-to-newline')

  // Tapping "/" or "+" must NOT open the IME: official keepFocus on those
  // buttons refocuses the textarea. preventDefault only on those two —
  // NEVER on Send/Stop. Pointerdown preventDefault on the send button
  // suppresses the compatibility click on Android WebView, so new chats
  // cannot send at all.
  ctx.effect(() => {
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Element)) return
      if (composerCardOf(event.target) === null) return
      const el = event.target.closest('button[aria-haspopup="listbox"], [data-mobile-nav="attach"]')
      if (el === null) return
      event.preventDefault()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, 'dsh-mobile-shell: no-keyboard command/attach taps')

  // After send, the official InputBar focuses the textarea from a React
  // effect (`el.focus({ preventScroll: true })` when `locked` flips back),
  // and keepFocus on the send button also focuses on mousedown. On Android
  // WebView/Chrome that programmatic focus is not a user gesture: the IME
  // stays closed, and once the element is activeElement a later tap is a
  // no-op (or the caret never paints) until a full reload. Worse, the submit
  // cycle itself toggles `readOnly` (machineBusy): the IME closes while
  // readOnly, and when it flips back the textarea is STILL focused with the
  // IME closed — and no focus event fires, so nothing can catch it. This
  // block makes the composer textarea impossible to leave stuck in that
  // state:
  //   1) any focus that did NOT come from a real user tap on the textarea is
  //      dropped — and re-dropped across a few frames while React's focus
  //      effects re-run after the commit;
  //   2) the readOnly/disabled flip after submit is watched: when the field
  //      becomes editable again while still focused, it is blurred, so the
  //      next tap is a fresh gesture that opens the IME;
  //   3) a tap on an already-focused empty composer with the keyboard closed
  //      blurs first, so the SAME tap re-focuses as a real gesture;
  //   4) pointerup on the textarea forces focus() inside the tap gesture,
  //      guaranteeing the IME comes up even when native focus-on-tap was
  //      suppressed by the blur;
  //   5) every check is structural (official [data-input-mirror] sibling),
  //      independent of our marker stamp, and the stamp is self-healed on
  //      focus/pointer events so CSS keyed on it never goes stale.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    // Conservative keyboard probe. With `interactive-widget=resizes-content`
    // the layout viewport itself shrinks when the IME opens, so the naive
    // innerHeight - visualViewport.height gap is ~0 while typing; a big gap
    // (>20% of the screen AND >120px) is the only case we trust as
    // "keyboard definitely open". False here only ever costs a redundant
    // blur+refocus on an EMPTY draft (see the value check in onPointerDown).
    const keyboardOpen = (): boolean => {
      const viewport = window.visualViewport
      if (viewport === null) return false
      const gap = window.innerHeight - viewport.height
      return gap > 120 && gap > window.innerHeight * 0.2
    }
    // A real user gesture on the textarea itself (IME intent). Taps on the
    // surrounding buttons do NOT count — keepFocus there must stay droppable.
    let userTappedTextarea = false
    let tapTimer = 0
    const markUserTap = (): void => {
      userTappedTextarea = true
      if (tapTimer !== 0) window.clearTimeout(tapTimer)
      tapTimer = window.setTimeout(() => {
        tapTimer = 0
        userTappedTextarea = false
      }, 1500)
    }
    // Watch the submit cycle's readOnly/disabled flip on every composer
    // textarea we meet. readOnly makes the browser drop the IME; when it
    // flips back the field is still activeElement, and blurring there is the
    // only way the next tap counts as a fresh gesture.
    const observedTextareas = new WeakSet<HTMLTextAreaElement>()
    const flipObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const el = mutation.target
        if (!(el instanceof HTMLTextAreaElement)) continue
        if (el.readOnly || el.disabled) continue
        if (document.activeElement !== el) continue
        if (composerCardOf(el) === null) continue
        el.blur()
      }
    })
    const watchReadOnlyFlips = (textarea: HTMLTextAreaElement | null): void => {
      if (textarea === null || observedTextareas.has(textarea)) return
      observedTextareas.add(textarea)
      flipObserver.observe(textarea, { attributes: true, attributeFilter: ['readonly', 'disabled'] })
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Element)) return
      const card = composerCardOf(event.target)
      if (card === null) return
      const textarea = card.querySelector<HTMLTextAreaElement>('textarea')
      if (textarea === null) return
      stampComposerCard(card, textarea)
      watchReadOnlyFlips(textarea)
      if (event.target !== textarea) return
      markUserTap()
      // Already focused from a programmatic send-focus / readOnly flip-back,
      // keyboard closed, draft empty (i.e. nothing to place a caret into):
      // blur so THIS tap re-focuses as a real gesture and the IME opens.
      if (document.activeElement === textarea && !keyboardOpen() && textarea.value === '') textarea.blur()
    }
    // Legacy-touch fallback (older WebViews without PointerEvent coverage):
    // the flag is what lets onFocusIn tell a user tap from programmatic focus.
    const onTouchStart = (event: TouchEvent): void => {
      if (!(event.target instanceof Element)) return
      if (event.target === composerCardOf(event.target)?.querySelector('textarea')) markUserTap()
    }
    const onFocusIn = (event: FocusEvent): void => {
      const focused = event.target
      if (!(focused instanceof HTMLTextAreaElement)) return
      const card = composerCardOf(focused)
      if (card === null) return
      stampComposerCard(card, focused)
      watchReadOnlyFlips(focused)
      if (userTappedTextarea) return
      // Programmatic focus (send / session re-mount / keepFocus): drop it,
      // and keep dropping while React's focus effects re-run, so no
      // programmatic focus survives with the IME closed. Cap the rAF loop —
      // an unbounded blur/focus fight with React freezes the composer.
      let frames = 0
      const drop = (): void => {
        if (userTappedTextarea) return
        if (document.activeElement !== focused) return
        if (frames++ > 12) return
        focused.blur()
        requestAnimationFrame(drop)
      }
      drop()
    }
    // Rescue: a tap on the textarea that did NOT end up focused (native
    // focus-on-tap suppressed after our pointerdown blur) is re-focused here,
    // inside the tap gesture, so the IME opens. readOnly (busy) / disabled
    // (workspace trigger) composers are left to their own handlers.
    const onPointerUp = (event: PointerEvent): void => {
      if (!(event.target instanceof HTMLTextAreaElement)) return
      const card = composerCardOf(event.target)
      if (card === null) return
      const textarea = card.querySelector<HTMLTextAreaElement>('textarea')
      if (textarea === null || textarea !== event.target) return
      if (textarea.disabled || textarea.readOnly) return
      if (document.activeElement === textarea) return
      markUserTap()
      textarea.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('touchstart', onTouchStart, true)
    document.addEventListener('pointerup', onPointerUp, true)
    document.addEventListener('focusin', onFocusIn, true)
    return () => {
      flipObserver.disconnect()
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('touchstart', onTouchStart, true)
      document.removeEventListener('pointerup', onPointerUp, true)
      document.removeEventListener('focusin', onFocusIn, true)
      if (tapTimer !== 0) window.clearTimeout(tapTimer)
    }
  }, 'dsh-mobile-shell: restore IME after send')

  // Composer self-heal. The symptom "after one send the input looks normal
  // but taps do absolutely nothing" is the signature of the textarea stuck
  // DISABLED/readOnly while the machine is NOT busy: a disabled textarea is
  // painted identically (the composer text lives in the transparent backdrop),
  // and it swallows every tap with zero feedback.
  // This effect:
  //   1) watches the composer textarea state after every send (readOnly flip)
  //      and on every composer tap;
  //   2) when a composer textarea is disabled/readOnly while its own
  //      data-phase says the machine is NOT submitting/adjudicating and it is
  //      NOT the hero workspace-trigger, force-re-enables it (one-shot per
  //      stuck instance — React only re-locks on a state change);
  //   3) when elementFromPoint at the textarea center resolves to a
  //      non-textarea inside the card, neutralizes that covering layer.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const composerTextareas = (): HTMLTextAreaElement[] => [
      ...document.querySelectorAll<HTMLElement>('[data-input-mirror]'),
    ]
      .map((mirror) => mirror.parentElement?.querySelector<HTMLTextAreaElement>('textarea'))
      .filter((ta): ta is HTMLTextAreaElement => ta instanceof HTMLTextAreaElement)

    // A stuck "submitting"/"adjudicating" phase (input machine dead-locked)
    // must be force-unlocked after a grace period: submitting settles in
    // milliseconds, so a phase that lingers means the settlement was lost.
    const BUSY_LINGER_MS = 30000
    const busySince = new WeakMap<HTMLTextAreaElement, number>()

    const diagnose = (): void => {
      for (const textarea of composerTextareas()) {
        const card = textarea.closest<HTMLElement>('[class$="_card"]')
        const phase = textarea.getAttribute('data-phase') ?? '?'
        const busy = phase === 'submitting' || phase === 'adjudicating'
        const heroTrigger =
          textarea.closest('[data-phase="hero"]') !== null &&
          textarea.disabled &&
          textarea.getAttribute('aria-haspopup') !== null
        const rect = textarea.getBoundingClientRect()
        const cx = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2))
        const cy = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2))
        const top = document.elementFromPoint(cx, cy)
        const hitTextarea = top === textarea || (top !== null && textarea.contains(top))
        // Busy-phase emergency unlock: the phase is authoritative only while
        // it settles quickly; a lingering busy phase is a dead machine.
        if (busy) {
          const since = busySince.get(textarea) ?? Date.now()
          busySince.set(textarea, since)
          if (Date.now() - since > BUSY_LINGER_MS) {
            textarea.readOnly = false
          }
        } else {
          busySince.delete(textarea)
        }
        // Self-heal: locked while the machine is idle and NOT the hero
        // workspace trigger → force re-enable (React re-locks only on state
        // changes; no re-render is coming). Also drop a leftover HTML
        // `inert` attribute on the card (distinct from data-phase="inert"),
        // which paints normally but swallows every tap.
        if (!busy && !heroTrigger) {
          if (textarea.disabled || textarea.readOnly) {
            textarea.disabled = false
            textarea.readOnly = false
          }
          if (textarea.hasAttribute('inert')) textarea.removeAttribute('inert')
          if (card?.hasAttribute('inert')) card.removeAttribute('inert')
        }
        // Covering layer inside the card: neutralize ONLY highlight/backdrop
        // overlays. Hitting the tool row / grow / send wrapper and setting
        // pointer-events:none is what made "/" "+" and send untappable.
        if (
          rect.width >= 8 &&
          rect.height >= 8 &&
          !hitTextarea &&
          top instanceof HTMLElement &&
          card !== null &&
          card.contains(top) &&
          top !== textarea &&
          !top.closest('button, a, textarea, input, select, [role="button"], [data-mobile-nav]')
        ) {
          const cls = typeof top.className === 'string' ? top.className : ''
          if (/overlay|backdrop|highlight|mirror/i.test(cls) || top.hasAttribute('data-input-backdrop')) {
            if (getComputedStyle(top).pointerEvents !== 'none') top.style.pointerEvents = 'none'
          }
        }
        // The card's own scroll (uV2eYG_scroll) can swallow taps when the
        // textarea sits at zero height — guarantee a floor inline.
        if (rect.height < 30) {
          const grow = textarea.parentElement
          if (grow !== null) grow.style.minHeight = '44px'
          textarea.style.minHeight = '44px'
        }
      }
    }

    // After a send: the readOnly/disabled flip marks the submit settle.
    const flipObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const el = mutation.target
        if (!(el instanceof HTMLTextAreaElement)) continue
        if (el.readOnly || el.disabled) continue
        window.setTimeout(diagnose, 700)
        break
      }
    })
    const watched = new WeakSet<HTMLTextAreaElement>()
    const watchFlips = (textarea: HTMLTextAreaElement): void => {
      if (watched.has(textarea)) return
      watched.add(textarea)
      flipObserver.observe(textarea, { attributes: true, attributeFilter: ['readonly', 'disabled'] })
    }
    // Every composer tap reports the live state (and heals a stuck lock).
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Element)) return
      const textarea = event.target.closest('textarea')
      if (textarea === null) return
      if (composerCardOf(textarea) === null) return
      watchFlips(textarea as HTMLTextAreaElement)
      window.setTimeout(diagnose, 120)
    }
    const onFocusIn = (event: FocusEvent): void => {
      if (!(event.target instanceof HTMLTextAreaElement)) return
      if (composerCardOf(event.target) === null) return
      watchFlips(event.target)
    }
    const scanObserver = new MutationObserver(() => {
      for (const textarea of composerTextareas()) watchFlips(textarea)
    })
    scanObserver.observe(document.body, { childList: true, subtree: true })
    for (const textarea of composerTextareas()) watchFlips(textarea)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('focusin', onFocusIn, true)
    // Periodic sweep: catches a busy phase that lingers with NO events
    // (the stuck-submitting case produces no mutations or taps), so the
    // 30s emergency unlock actually fires. Cheap — attribute scan only;
    // diagnose() itself is skipped while the composer is healthy.
    const sweepTimer = window.setInterval(() => {
      for (const textarea of composerTextareas()) {
        const phase = textarea.getAttribute('data-phase') ?? ''
        if (phase === 'submitting' || phase === 'adjudicating' || textarea.disabled || textarea.readOnly) {
          diagnose()
          break
        }
      }
    }, 5000)
    return () => {
      flipObserver.disconnect()
      scanObserver.disconnect()
      window.clearInterval(sweepTimer)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('focusin', onFocusIn, true)
    }
  }, 'dsh-mobile-shell: composer self-heal')
  // Chat font size rail: two stepper buttons (A- / A+) plus a px readout
  // at the FAR RIGHT of the conversation tab bar. The value persists in
  // localStorage and is applied as --mobile-nav-font-scale on the chat
  // scroll container, so ONLY the chat view's message typography scales
  // (the markdown rules read the variable); Trajectory and Status are
  // untouched. The tab bar re-mounts on session switches, so injection is
  // idempotent and re-runs on every structural pass.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const FONT_KEY = 'dsh-mobile-shell:chat-font-size'
    const FONT_BASE = 15
    const FONT_MIN = 13
    const FONT_MAX = 21
    const loadSize = (): number => {
      const raw = Number(localStorage.getItem(FONT_KEY))
      return Number.isFinite(raw) && raw >= FONT_MIN && raw <= FONT_MAX ? raw : FONT_BASE
    }
    const applySize = (px: number): void => {
      localStorage.setItem(FONT_KEY, String(px))
      const scale = px / FONT_BASE
      for (const el of document.querySelectorAll<HTMLElement>('[class$="_scroll"]')) {
        el.style.setProperty('--mobile-nav-font-scale', String(scale))
      }
      for (const out of document.querySelectorAll<HTMLElement>('[data-mobile-nav="font-size"]')) {
        out.textContent = `${px}px`
      }
    }
    const inject = (tabs: HTMLElement): void => {
      const group = document.createElement('div')
      group.setAttribute('data-mobile-nav', 'font-controls')
      const smaller = document.createElement('button')
      smaller.type = 'button'
      smaller.setAttribute('data-mobile-nav', 'font-smaller')
      smaller.setAttribute('aria-label', t('font.smaller'))
      smaller.textContent = 'A−'
      const readout = document.createElement('span')
      readout.setAttribute('data-mobile-nav', 'font-size')
      readout.textContent = `${loadSize()}px`
      const larger = document.createElement('button')
      larger.type = 'button'
      larger.setAttribute('data-mobile-nav', 'font-larger')
      larger.setAttribute('aria-label', t('font.larger'))
      larger.textContent = 'A+'
      smaller.addEventListener('click', () => applySize(Math.max(FONT_MIN, loadSize() - 1)))
      larger.addEventListener('click', () => applySize(Math.min(FONT_MAX, loadSize() + 1)))
      group.append(smaller, readout, larger)
      tabs.appendChild(group)
    }
    let scheduled = false
    const sync = (): void => {
      scheduled = false
      // The readout must track the stored size across re-mounts.
      const px = loadSize()
      const scale = px / FONT_BASE
      for (const el of document.querySelectorAll<HTMLElement>('[class$="_scroll"]')) {
        el.style.setProperty('--mobile-nav-font-scale', String(scale))
      }
      const tabs = document.querySelector<HTMLElement>('[data-phase] [class$="_tabs"]')
      if (tabs !== null) {
        let rail = tabs.querySelector<HTMLElement>('[data-mobile-nav="font-controls"]')
        if (rail === null) {
          inject(tabs)
          rail = tabs.querySelector<HTMLElement>('[data-mobile-nav="font-controls"]')
        }
        // The conversation.view entry set can change AFTER the tab bar first
        // renders (plugin hot reload re-registers the Status entry), and the
        // core appends the newly arrived tab to the end of the flex row —
        // which would land AFTER our rail (对话 / 轨迹 / A− 15px A+ / 状态).
        // Re-append the rail to the end on every structural pass so it stays
        // at the FAR RIGHT no matter what React reorders.
        if (rail !== null && tabs.lastElementChild !== rail) tabs.appendChild(rail)
      }
    }
    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(sync)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    sync()
    return () => observer.disconnect()
  }, 'dsh-mobile-shell: chat font size rail')

  // Context-occupancy ring, relocated from the composer to the tab bar
  // ("状态" label +). The core ContextMeter feeds off the host contextPressure
  // projection and re-renders its aria-label ("上下文已用 43%"); the original
  // button is hidden on mobile and this injected ring mirrors that label via
  // a scoped attribute observer — same figure, no extra projection plumbing.
  // Tapping the ring shows a mini breakdown panel: the core detail panel is
  // a React projection consumer, so we briefly open the (hidden) original
  // trigger, read its rendered text, close it again, and render a mirrored
  // panel anchored under the ring.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const RING_R = 5.5
    const RING_C = 2 * Math.PI * RING_R
    const ARIA_RE = /(\d+)%/
    const parseTokenFigure = (text: string): number | null => {
      const m = /([\d.]+)\s*([KM]?)/.exec(text)
      if (m === null) return null
      const n = Number(m[1])
      if (!Number.isFinite(n)) return null
      if (m[2] === 'K') return n * 1e3
      if (m[2] === 'M') return n * 1e6
      return n
    }
    const formatTokenFigure = (n: number): string =>
      n >= 1e6 ? `${Math.round((n / 1e6) * 10) / 10}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n)
    const ringSvg = (): string =>
      `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="7" cy="7" r="${RING_R}" stroke="var(--dsw-alias-border-l3, rgba(0,0,0,.2))" stroke-width="2"/>` +
      `<circle data-mobile-nav="ctx-fill" cx="7" cy="7" r="${RING_R}" stroke="var(--dsw-alias-label-tertiary, rgba(0,0,0,.45))" stroke-width="2" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="0" transform="rotate(-90 7 7)"/>` +
      `</svg>`
    const original = (): HTMLButtonElement | null =>
      // button-only: the INJECTED ring also mirrors the aria-label and sits
      // earlier in the DOM — without the tag constraint this selector would
      // match the ring itself (broken sync + self-recursive taps).
      document.querySelector<HTMLButtonElement>('button[aria-label*="上下文已用"], button[aria-label*="context used"]')

    // Mini breakdown panel (non-React), anchored under the injected ring.
    let miniPanel: HTMLElement | null = null
    const closeMiniPanel = (): void => {
      miniPanel?.remove()
      miniPanel = null
    }
    const onDocPointerDown = (event: PointerEvent): void => {
      if (miniPanel === null) return
      if (event.target instanceof Node && miniPanel.contains(event.target)) return
      closeMiniPanel()
    }
    const onDocKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeMiniPanel()
    }
    const showMiniPanel = (label: string, figures: string, detail: string): void => {
      closeMiniPanel()
      const ringEl = document.querySelector<HTMLElement>('[data-mobile-nav="ctx-ring"]')
      if (ringEl === null) return
      const rr = ringEl.getBoundingClientRect()
      const panel = document.createElement('div')
      panel.setAttribute('data-mobile-nav', 'ctx-panel')
      const headRow = document.createElement('div')
      headRow.setAttribute('data-mobile-nav', 'ctx-panel-head')
      const head = document.createElement('span')
      head.textContent = label
      headRow.append(head)
      if (figures !== '') {
        const fig = document.createElement('span')
        fig.setAttribute('data-mobile-nav', 'ctx-panel-figures')
        fig.textContent = figures
        headRow.append(fig)
      }
      const bar = document.createElement('div')
      bar.setAttribute('data-mobile-nav', 'ctx-panel-bar')
      const fill = document.createElement('div')
      fill.setAttribute('data-mobile-nav', 'ctx-panel-fill')
      const m = ARIA_RE.exec(label)
      const pct = m === null ? 0 : Math.max(0, Math.min(100, Number(m[1])))
      fill.style.width = `${Math.max(2, pct)}%`
      bar.append(fill)
      panel.append(headRow, bar)
      if (detail !== '') {
        const body = document.createElement('div')
        body.setAttribute('data-mobile-nav', 'ctx-panel-body')
        body.textContent = detail
        panel.append(body)
      }
      document.body.appendChild(panel)
      const width = 272
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, rr.right - width))
      panel.style.left = `${left}px`
      panel.style.top = `${Math.max(8, rr.bottom + 6)}px`
      miniPanel = panel
    }

    let scheduled = false
    const sync = (): void => {
      // Reset FIRST: sync() can bail early (tab bar or source ring not
      // mounted yet), and a stale `scheduled` would swallow every later
      // schedule() and leave the ring uninjected forever.
      scheduled = false
      const tabs = document.querySelector<HTMLElement>('[data-phase] [class$="_tabs"]')
      const src = original()
      let ring = tabs?.querySelector<HTMLElement>('[data-mobile-nav="ctx-ring"]') ?? null
      if (tabs !== null && src !== null && ring === null) {
        ring = document.createElement('span')
        ring.setAttribute('data-mobile-nav', 'ctx-ring')
        ring.innerHTML = ringSvg()
        const rail = tabs.querySelector<HTMLElement>('[data-mobile-nav="font-controls"]')
        if (rail !== null) tabs.insertBefore(ring, rail)
        else tabs.appendChild(ring)
      }
      if (ring === null) return
      // Position correction: a hot reload re-registers the Status view entry
      // and the core appends the arriving tab AFTER our injected nodes, so
      // the ring can end up BEFORE the Status label. Keep the chain pinned
      // as ring → effort label → font rail on every pass (the rail itself
      // stays last). The chain is rebuilt CONVERGENTLY: [ring, effort] is
      // treated as one unit sitting immediately before the rail — when an
      // app tab lands between the pieces, both moves run in the same pass
      // (effort before rail, then ring before effort) so the chain reaches a
      // fixed point in one step. Doing the two moves independently could
      // oscillate forever (each move re-triggers the observer), freezing the
      // page — the exact regression this ordering prevents.
      const rail = tabs?.querySelector<HTMLElement>('[data-mobile-nav="font-controls"]') ?? null
      let effortEl = tabs?.querySelector<HTMLElement>('[data-mobile-nav="ctx-effort"]') ?? null
      if (effortEl === null) {
        effortEl = document.createElement('span')
        effortEl.setAttribute('data-mobile-nav', 'ctx-effort')
      }
      const pinChain = (): void => {
        if (tabs === null) return
        if (rail !== null && tabs.lastElementChild !== rail) tabs.appendChild(rail)
        const effortNext = effortEl.nextElementSibling
        const chainOk = ring.nextElementSibling === effortEl && (rail === null ? effortNext === null || tabs.lastElementChild === effortEl : effortNext === rail)
        if (chainOk) return
        if (effortNext !== rail) tabs.insertBefore(effortEl, rail)
        if (ring.nextElementSibling !== effortEl) tabs.insertBefore(ring, effortEl)
      }
      pinChain()
      if (src === null) {
        if (!ring.hasAttribute('hidden')) ring.setAttribute('hidden', '')
        if (!effortEl.hasAttribute('hidden')) effortEl.setAttribute('hidden', '')
        return
      }
      if (ring.hasAttribute('hidden')) ring.removeAttribute('hidden')
      // Mirror the composer trigger's effort label ("Max" etc.) after the
      // ring. The composer span is hidden on mobile (long model names must
      // not push the input row); the tab bar is its new home. The span
      // itself is display:none, so judge visibility by its trigger parent.
      const srcEffort =
        [...document.querySelectorAll<HTMLElement>('[class$="_trigger"] [class$="_triggerEffort"]')]
          .find((el) => el.parentElement !== null && el.parentElement.offsetParent !== null) ?? null
      const effortText = srcEffort?.textContent?.trim() ?? ''
      if (effortText === '') {
        if (!effortEl.hasAttribute('hidden')) effortEl.setAttribute('hidden', '')
      } else {
        if (effortEl.hasAttribute('hidden')) effortEl.removeAttribute('hidden')
        if (effortEl.textContent !== effortText) effortEl.textContent = effortText
        if (effortEl.getAttribute('title') !== effortText) effortEl.setAttribute('title', effortText)
      }
      pinChain()
      const label = src.getAttribute('aria-label') ?? ''
      const match = ARIA_RE.exec(label)
      const percent = match === null ? null : Math.max(0, Math.min(100, Number(match[1])))
      const fill = ring.querySelector<SVGCircleElement>('[data-mobile-nav="ctx-fill"]')
      if (percent !== null && fill !== null) {
        const offset = String(RING_C * (1 - percent / 100))
        if (fill.getAttribute('stroke-dashoffset') !== offset) fill.setAttribute('stroke-dashoffset', offset)
        if (ring.getAttribute('title') !== label) ring.setAttribute('title', label)
        if (ring.getAttribute('aria-label') !== label) ring.setAttribute('aria-label', label)
        ring.onclick = () => {
          if (miniPanel !== null) {
            closeMiniPanel()
            return
          }
          // Open the hidden original trigger, read its rendered panel text,
          // close it, then show the mirrored mini panel under the ring.
          src.click()
          requestAnimationFrame(() => {
            const root = src.closest('[class$="_root"]')
            const panel = root?.querySelector<HTMLElement>('[class$="_panel"]') ?? null
            // The percent comes from the contextPressure projection (which
            // prices cache read/write traffic too), while the breakdown rows
            // come from contextBreakdown (surface content only) — two
            // independent meters. The core panel bridges them with a
            // "used / window" figures line; mirror it so the numbers add up.
            const figures = root?.querySelector('[class$="_figures"]')?.textContent?.trim() ?? ''
            // Rebuild the breakdown lines from the panel's row structure
            // (dt + dd per row) instead of raw textContent, which glues
            // figures and labels together ("1.6KTools").
            const rows = panel === null ? [] : [...panel.querySelectorAll('[class$="_row"]')]
            const detail =
              rows.length === 0
                ? ''
                : rows
                    .map((row) => {
                      const dt = row.querySelector('dt')?.textContent ?? ''
                      const dd = row.querySelector('dd')?.textContent ?? ''
                      return `${dt} ${dd}`.trim()
                    })
                    .filter((line) => line !== '')
                    .join('\n')
            // The percent's numerator (contextPressure: input + cache
            // read/write traffic) is larger than the content breakdown; add
            // an explicit "other" delta row so the columns add up exactly.
            const used = parseTokenFigure(figures)
            const listed = rows.reduce((sum, row) => sum + (parseTokenFigure(row.querySelector('dd')?.textContent ?? '') ?? 0), 0)
            const otherTokens = used !== null && listed > 0 && used > listed ? used - listed : null
            const detailWithOther =
              otherTokens === null
                ? detail
                : detail === ''
                  ? t('ctx.other', { tokens: formatTokenFigure(otherTokens) })
                  : `${detail}\n${t('ctx.other', { tokens: formatTokenFigure(otherTokens) })}`
            if (panel !== null) src.click()
            const labelNow = src.getAttribute('aria-label') ?? ''
            showMiniPanel(labelNow, figures, detailWithOther)
          })
        }
      }
    }
    const schedule = (): void => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(sync)
    }
    // Structural observer: mounts/re-mounts only. sync() writes attributes on
    // the INJECTED ring, which must never be observed — an attributes observer
    // on the whole tree would re-fire on those writes and loop forever.
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    // Scoped attribute observer on the ORIGINAL button only: the source of
    // truth for the percentage. The injected ring is outside its scope, so
    // writing the mirrored aria-label can never re-trigger it.
    let watched: HTMLButtonElement | null = null
    const sourceObserver = new MutationObserver(schedule)
    const watchSource = (): void => {
      const src = original()
      if (src === watched) return
      watched = src
      sourceObserver.disconnect()
      if (src !== null) sourceObserver.observe(src, { attributes: true, attributeFilter: ['aria-label'] })
    }
    const outerSchedule = (): void => {
      watchSource()
      schedule()
    }
    // Re-attach the source observer whenever the tree changes (the button is
    // re-created on every ContextMeter render).
    const observer2 = new MutationObserver(outerSchedule)
    observer2.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onDocKeyDown)
    watchSource()
    sync()
    return () => {
      observer.disconnect()
      observer2.disconnect()
      sourceObserver.disconnect()
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onDocKeyDown)
      closeMiniPanel()
    }
  }, 'dsh-mobile-shell: context ring relocation')

  // View tab switches on narrow screens: the core conversation view seat
  // unmounts the outgoing tab and mounts the incoming one, so Chat /
  // Trajectory rebuild their whole tree from scratch and the swap reads as
  // a full reload (the jank the user feels). The rebuild itself is core
  // architecture and cannot be stopped from a plugin, but the perceived
  // cost can be cut with the standard keep-position techniques: each tab's
  // scroll ratio is remembered when the tab is tapped and restored after
  // the new tree mounts, and the incoming view fades in instead of
  // popping. (The Trajectory table is virtualized by the core; ChatView is
  // not.)
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const viewArea = (): HTMLElement | null =>
      document.querySelector<HTMLElement>('[data-phase] [class$="_viewArea"]')
    const scrollerIn = (area: HTMLElement): HTMLElement | null =>
      area.querySelector<HTMLElement>('[class$="_scroll"], [class$="_tablePane"]')
    const activeTabLabel = (): string | null =>
      document.querySelector<HTMLElement>('[data-phase] [class$="_tabActive"]')?.textContent?.trim() ?? null

    // label -> scroll ratio (0..1) per tab; cleared when the session changes
    // (the view area element is rebuilt on session switches).
    const positions = new Map<string, number>()
    let pending: { label: string; ratio: number } | null = null
    let lastArea: HTMLElement | null = null
    let restoreRaf = 0
    let restoreTimer = 0
    let retries = 0

    const tryRestore = (): void => {
      restoreRaf = 0
      if (pending === null) return
      const area = viewArea()
      if (area === null) return
      const scroller = scrollerIn(area)
      if (scroller === null || scroller.scrollHeight <= scroller.clientHeight) {
        // The incoming tree is not mounted (or has no scrollable content)
        // yet — retry briefly; give up after ~0.6s.
        retries += 1
        if (retries < 8) {
          restoreTimer = window.setTimeout(() => {
            if (restoreRaf === 0) restoreRaf = requestAnimationFrame(tryRestore)
          }, 80)
        } else {
          pending = null
        }
        return
      }
      scroller.scrollTop = pending.ratio * (scroller.scrollHeight - scroller.clientHeight)
      pending = null
      retries = 0
    }

    const onTabClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null
      if (target === null) return
      const tab = target.closest<HTMLElement>('[data-phase] [class$="_tab"]')
      if (tab === null) return
      const label = tab.textContent?.trim() ?? ''
      if (label === '') return
      const area = viewArea()
      const scroller = area !== null ? scrollerIn(area) : null
      // Remember the outgoing tab's ratio.
      const current = activeTabLabel()
      if (scroller !== null && scroller.scrollHeight > scroller.clientHeight && current !== null) {
        positions.set(current, scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight))
      }
      // Arm the restore for the incoming tab.
      const ratio = positions.get(label)
      pending = ratio === undefined ? null : { label, ratio }
      retries = 0
      // Fade the incoming view in (the marker lives on the view area, which
      // survives the tab swap; one rAF is enough — React 18 commits
      // synchronously inside the click handler).
      if (area !== null) {
        area.removeAttribute('data-mobile-nav')
        requestAnimationFrame(() => {
          if (viewArea() === area) area.setAttribute('data-mobile-nav', 'view-fade')
        })
      }
      if (restoreRaf === 0) restoreRaf = requestAnimationFrame(tryRestore)
    }
    const onAnimationEnd = (event: AnimationEvent): void => {
      const target = event.target as HTMLElement | null
      if (target === null || target.getAttribute('data-mobile-nav') !== 'view-fade') return
      target.removeAttribute('data-mobile-nav')
    }
    // Watch the view area: restore once the incoming tree mounts, and reset
    // the per-tab memory when the session changes (area element replaced).
    let scheduled = false
    const onDomChange = (): void => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => {
        scheduled = false
        const area = viewArea()
        if (area !== null && area !== lastArea) {
          lastArea = area
          positions.clear()
          pending = null
        }
        if (pending !== null && restoreRaf === 0) restoreRaf = requestAnimationFrame(tryRestore)
      })
    }
    const observer = new MutationObserver(onDomChange)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', onTabClick, true)
    document.addEventListener('animationend', onAnimationEnd, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', onTabClick, true)
      document.removeEventListener('animationend', onAnimationEnd, true)
      if (restoreRaf !== 0) cancelAnimationFrame(restoreRaf)
      if (restoreTimer !== 0) window.clearTimeout(restoreTimer)
    }
  }, 'dsh-mobile-shell: view switch keep-position + fade')

  // dsh-web-ui compatibility: the aionui explorer column would render as a
  // sheet over the whole mobile UI whenever its (persisted) expanded state
  // is active — including right after a reload, with no way out (the
  // suite's floating expand button only exists while collapsed). Instead
  // of fighting the suite's store timing, the mobile stylesheet keeps the
  // explorer column hidden by default and the header's Files action (plus
  // the drawer footer entry) opens it via the `data-aionui-explorer-open`
  // marker on the frame. This effect just clears that marker when the
  // sheet's own collapse chevron is tapped, so closing is symmetric with
  // opening.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const onChevronClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target === null || !target.closest('.aionui-collapse-chevron')) return
      document.querySelector('[data-mobile-nav="frame"]')?.removeAttribute('data-aionui-explorer-open')
    }
    document.addEventListener('click', onChevronClick, true)
    return () => document.removeEventListener('click', onChevronClick, true)
  }, 'dsh-mobile-shell: aionui explorer close marker')

  // dsh-web-ui compatibility: the aionui preview column persists its open
  // tabs in localStorage and restores them on load, which would pop the
  // preview sheet over the fresh UI after a reload. Gate it like the
  // explorer: the stylesheet keeps the column hidden unless the frame
  // carries `data-aionui-preview-open`; this effect sets that marker when
  // the user actually taps a file row in the explorer sheet, and clears it
  // whenever the suite hides the column again (collapse chevron / tab
  // close), so a restored-but-unwanted sheet never appears.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const frame = (): HTMLElement | null => document.querySelector('[data-mobile-nav="frame"]')
    const onTap = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target === null) return
      if (target.closest('[data-aionui-explorer-col] [class$="_treeRow"]') === null) return
      frame()?.setAttribute('data-aionui-preview-open', '')
    }
    const sync = (): void => {
      const pv = document.querySelector('[data-aionui-preview-col]')
      if (pv === null) return
      if (getComputedStyle(pv).visibility === 'hidden') frame()?.removeAttribute('data-aionui-preview-open')
    }
    document.addEventListener('click', onTap, true)
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] })
    sync()
    return () => {
      document.removeEventListener('click', onTap, true)
      observer.disconnect()
    }
  }, 'dsh-mobile-shell: preview sheet open marker')


  // The dsh-web-ui explorer / preview columns toggle via `visibility`
  // (their inline style), which never restarts a CSS animation — so the
  // sheets would only animate on first mount. Replay the rise animation
  // with the Web Animations API each time a column turns visible, then
  // leave the resting state to the stylesheet.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const cols = ['[data-aionui-explorer-col]', '[data-aionui-preview-col]']
    const seen = new Map<string, boolean>()
    const play = (el: Element): void => {
      el.animate(
        [
          { opacity: 0, transform: 'translateY(28px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 280, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' },
      )
    }
    const check = (): void => {
      for (const sel of cols) {
        const el = document.querySelector(sel)
        if (el === null) continue
        const visible = getComputedStyle(el).visibility === 'visible'
        const prev = seen.get(sel) ?? false
        if (visible && !prev) play(el)
        seen.set(sel, visible)
      }
    }
    const observer = new MutationObserver(check)
    // Visibility flips come through inline style mutations (suite) or the
    // explorer-open marker on the frame; class changes are watched too.
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'class', 'data-aionui-explorer-open'] })
    check()
    return () => {
      observer.disconnect()
    }
  }, 'dsh-mobile-shell: sheet rise animation replay')

  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'mobile-nav-toggle',
    order: 10,
    locale: NS,
    inject: () => ({
      toggleSidebar: () => ctx.layout.toggleSidebar(),
    }),
  }, MobileNavToggle))

  // Status view tab: a conversation.view entry renders a session-scope tab
  // in the official header ring ("对话 / 轨迹 / 状态"). Order 20 keeps it
  // after the chat tab (order 0) and the trajectory tab (order 10). The
  // view reads the framework standard kit (useSession + useProjection), so
  // no inject face is needed.
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'status',
    order: 20,
    locale: NS,
    label: () => t('view.status'),
    inject: () => ({
      // Session log export, relocated from the drawer footer to the top of
      // the Status tab (the drawer's official foot keeps Settings only).
      downloadSessionLog: (sessionId: string) => ctx.sessionLogDownload.download(sessionId),
    }),
  }, MobileStatusView))

  // Plugin marketplace: a Settings section (Settings → 插件市场) rendering
  // the community catalog with category filters, star/time sorting, a card
  // grid (author avatar, tags, bilingual intro, stars, one-click install,
  // AI translation) and a repo window per plugin.
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'mobile-market',
    order: 60,
    locale: NS,
    label: () => t('market.title'),
  }, MarketplaceView))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'mobile-github',
    order: 61,
    locale: NS,
    label: () => t('github.title'),
  }, GithubKeyView))

  // Composer attachment chrome: the "+" picker button sits in the tool row
  // (conversation.input.left — a React-native seat that survives composer
  // re-renders; flex order places it right after the "/" command button),
  // and the pending-file bubble rail lives in the dock slot, a full-width
  // row stacked above the composer card.
  // Reasoning levels for hand-declared custom-provider models. The official
  // composer picker offers per-model effort levels ONLY when the pi-ai
  // profile declares `reasoningEfforts` on the model entry (the adapter
  // materializes `model.reasoning.efforts`; hand-declared models have none).
  // This card in the settings Models tab writes that declaration through the
  // plugin's node half (GET/POST /api/mobile-nav/reasoning → settings.mutate
  // on the llm-pi-ai namespace). Selection itself stays fully official: the
  // picker renders the declared levels verbatim, and the chosen effort rides
  // the official selectModel → agent request chain into the wire request.
  // The offered tiers are exactly off/low/high/xhigh/max, plus a mandatory
  // route default (max) — the default both pre-selects that effort and keeps
  // the picker's "provider default" option from appearing.
  ctx.effect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)')
    if (!narrow.matches) return () => {}
    const LEVELS = ['off', 'low', 'high', 'xhigh', 'max'] as const
    const LABELS: Record<(typeof LEVELS)[number], string> = {
      off: 'Off', low: 'Low', high: 'High', xhigh: 'Xhigh', max: 'Max',
    }
    interface ReasoningModel { index: number; id: string; name?: string; levels: string[]; disabled?: boolean }
    interface ReasoningProvider { route: string; displayName: string; models: ReasoningModel[]; defaultLevel: string | null }
    let providers: ReasoningProvider[] = []
    let revision = 0
    let card: HTMLLIElement | null = null

    const fetchState = async (): Promise<boolean> => {
      try {
        const res = await fetch('/api/mobile-nav/reasoning')
        const text = await res.text()
        const payload = text === '' ? null : (JSON.parse(text) as { ok?: boolean; revision?: number; providers?: ReasoningProvider[] })
        if (payload?.ok !== true || payload.providers === undefined) return false
        providers = payload.providers
        revision = payload.revision ?? 0
        return true
      } catch {
        return false
      }
    }

    const saveProvider = async (
      provider: ReasoningProvider,
      drafts: Record<string, string[]>,
      draftDefault: string | null,
      save: HTMLButtonElement,
      status: HTMLElement,
    ): Promise<void> => {
      save.disabled = true
      status.textContent = '保存中…'
      try {
        const res = await fetch('/api/mobile-nav/reasoning', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            route: provider.route,
            revision,
            models: provider.models.map((model) => ({ id: model.id, levels: drafts[model.id] })),
            defaultLevel: draftDefault,
          }),
        })
        const text = await res.text()
        const payload = text === '' ? null : (JSON.parse(text) as { ok?: boolean; conflict?: boolean; error?: string })
        if (res.status === 409 || payload?.conflict === true) {
          status.textContent = '配置已变化，已重新加载'
          const ok = await fetchState()
          if (ok) render()
        } else if (res.ok && payload?.ok === true) {
          status.textContent = '已保存'
          const ok = await fetchState()
          if (ok) render()
        } else {
          status.textContent = payload?.error ?? `保存失败 HTTP ${res.status}`
        }
      } catch {
        status.textContent = '网络错误'
      } finally {
        save.disabled = false
      }
    }

    const modelRow = (model: ReasoningModel, drafts: Record<string, string[]>): HTMLElement => {
      const row = document.createElement('div')
      row.setAttribute('data-mobile-nav', 'reasoning-model')
      const nameEl = document.createElement('div')
      nameEl.setAttribute('data-mobile-nav', 'reasoning-model-name')
      nameEl.textContent = model.name !== undefined && model.name !== '' && model.name !== model.id ? `${model.name} · ${model.id}` : model.id
      row.append(nameEl)
      const chips = document.createElement('div')
      chips.setAttribute('data-mobile-nav', 'reasoning-chips')
      for (const level of LEVELS) {
        const chip = document.createElement('button')
        chip.type = 'button'
        chip.setAttribute('data-mobile-nav', 'reasoning-chip')
        chip.setAttribute('data-level', level)
        chip.textContent = LABELS[level]
        const sync = (): void => {
          chip.classList.toggle('on', (drafts[model.id] ?? []).includes(level))
        }
        sync()
        chip.onclick = () => {
          const set = new Set(drafts[model.id] ?? [])
          if (set.has(level)) set.delete(level)
          else set.add(level)
          drafts[model.id] = [...set]
          sync()
        }
        chips.append(chip)
      }
      row.append(chips)
      return row
    }

    const providerBlock = (provider: ReasoningProvider): HTMLElement => {
      const block = document.createElement('div')
      block.setAttribute('data-mobile-nav', 'reasoning-provider')
      const head = document.createElement('div')
      head.setAttribute('data-mobile-nav', 'reasoning-provider-name')
      const name = document.createElement('span')
      name.textContent = provider.displayName
      const route = document.createElement('span')
      route.setAttribute('data-mobile-nav', 'reasoning-provider-route')
      route.textContent = provider.route
      head.append(name, route)
      block.append(head)
      const drafts: Record<string, string[]> = {}
      for (const model of provider.models) {
        // An undeclared model gets the user-chosen default tier set
        // (capability cannot be queried from the gateway), rendered
        // pre-checked. A model explicitly marked non-reasoning
        // (`reasoningEfforts: false`) stays fully unchecked — saving it
        // unchanged keeps it that way.
        drafts[model.id] = model.disabled === true
          ? []
          : model.levels.length > 0
            ? [...model.levels]
            : [...LEVELS]
      }
      let draftDefault: string | null = provider.defaultLevel ?? 'max'
      for (const model of provider.models) block.append(modelRow(model, drafts))
      const defaultRow = document.createElement('div')
      defaultRow.setAttribute('data-mobile-nav', 'reasoning-default')
      const label = document.createElement('span')
      label.textContent = '默认等级'
      const select = document.createElement('select')
      select.setAttribute('data-mobile-nav', 'reasoning-default-select')
      for (const level of LEVELS) {
        const option = document.createElement('option')
        option.value = level
        option.textContent = LABELS[level]
        select.append(option)
      }
      select.value = draftDefault ?? 'max'
      select.onchange = () => {
        draftDefault = select.value
      }
      defaultRow.append(label, select)
      block.append(defaultRow)
      const saveRow = document.createElement('div')
      saveRow.setAttribute('data-mobile-nav', 'reasoning-save-row')
      const save = document.createElement('button')
      save.type = 'button'
      save.setAttribute('data-mobile-nav', 'reasoning-save')
      save.textContent = '保存'
      const status = document.createElement('span')
      status.setAttribute('data-mobile-nav', 'reasoning-status')
      save.onclick = () => void saveProvider(provider, drafts, draftDefault, save, status)
      saveRow.append(save, status)
      block.append(saveRow)
      return block
    }

    const render = (): void => {
      if (card === null || !card.isConnected) return
      card.replaceChildren()
      const title = document.createElement('div')
      title.setAttribute('data-mobile-nav', 'reasoning-title')
      title.textContent = '推理等级 · 自定义模型'
      const desc = document.createElement('div')
      desc.setAttribute('data-mobile-nav', 'reasoning-desc')
      desc.textContent = '为第三方自定义提供方的模型声明支持的推理强度；模型选择器（输入框）只显示已声明的等级。'
      card.append(title, desc)
      if (providers.length === 0) {
        const empty = document.createElement('div')
        empty.setAttribute('data-mobile-nav', 'reasoning-empty')
        empty.textContent = '未配置自定义提供方（Models → Add a custom provider）'
        card.append(empty)
        return
      }
      for (const provider of providers) card.append(providerBlock(provider))
    }

    const inject = (): Promise<void> => {
      if (injecting !== null) return injecting
      injecting = (async () => {
        const modal = document.querySelector<HTMLElement>('[aria-modal="true"][data-mobile-nav="settings-sheet"]')
        if (modal === null) return
        const sections = [...modal.querySelectorAll<HTMLElement>('[class$="_section"]')]
        const section = sections.find((entry) => (entry.querySelector('[class$="_title"]')?.textContent ?? '').trim() === 'Models')
        const rows = section?.querySelector<HTMLUListElement>('[class$="_rows"]')
        if (rows === null || rows === undefined) return
        if (rows.querySelector('[data-mobile-nav="reasoning-card"]') !== null) return
        // Fetch FIRST, then create the card: concurrent observer passes must
        // never render a card from stale (empty) state while a fetch is in
        // flight — the fetch result is what the card renders.
        await fetchState()
        if (!rows.isConnected) return
        if (rows.querySelector('[data-mobile-nav="reasoning-card"]') !== null) return
        card = document.createElement('li')
        card.setAttribute('data-mobile-nav', 'reasoning-card')
        rows.appendChild(card)
        render()
      })().finally(() => {
        injecting = null
      })
      return injecting
    }
    let injecting: Promise<void> | null = null
    const observer = new MutationObserver(() => void inject())
    observer.observe(document.body, { childList: true, subtree: true })
    void inject()
    return () => observer.disconnect()
  }, 'dsh-mobile-shell: reasoning levels card')

  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'mobile-nav-attach',
    order: 10,
    locale: NS,
  }, ComposerAttachButton))

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'mobile-nav-files',
    order: 15,
    locale: NS,
  }, FileRailDock))

  // Files-only send activator: an invisible tap target over the official
  // primary send button (which is disabled while the draft is empty), so
  // attachments submit through the input bar's own send arrow.
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'mobile-nav-send-overlay',
    order: 10,
    locale: NS,
  }, SendOverlay))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'mobile-nav-overlay',
    order: 10,
    locale: NS,
    inject: () => ({
      toggleSidebar: () => ctx.layout.toggleSidebar(),
      // Session deletion is a host-side operation: the browser RPC surface
      // has no delete method (sessions are append-only by design), so the
      // plugin's node half exposes a dedicated route that removes the
      // durable log and the workspace accounting.
      deleteSession: async (sessionId: string) => {
        try {
          const res = await fetch('/api/mobile-nav/delete-session', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          // The host webserver answers unknown routes / crashed handlers with
          // an EMPTY body (404/400), which res.json() would reject — read the
          // text and surface the concrete status so failures are diagnosable.
          const text = await res.text()
          let payload: { ok?: boolean; error?: string } | null = null
          try {
            payload = text === '' ? null : (JSON.parse(text) as { ok?: boolean; error?: string })
          } catch {
            payload = null
          }
          const error = payload?.error ?? (res.ok ? undefined : `HTTP ${res.status}`)
          return { ok: res.ok && payload?.ok === true, status: res.status, error }
        } catch (error) {
          return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) }
        }
      },
      refreshList: () => (ctx.sessions as unknown as { refresh(): Promise<unknown> }).refresh(),
      clearSelection: () => ctx.sessions.clear(),
    }),
  }, MobileNavOverlay))

}

// Type-only augmentation imports: pull the layout / conversation / sidebar
// SlotMap merges and the sessionLogDownload service typing into this program
// without any runtime import.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-session-log-export/client'
