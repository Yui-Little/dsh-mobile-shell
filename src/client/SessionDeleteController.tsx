import { useEffect, useRef, useState } from 'react'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { MobileNavKey } from './locales.ts'

/** Same breakpoint as the shell's SIDEBAR_AUTO_COLLAPSE (viewport < 1024). */
const MOBILE_QUERY = '(max-width: 1023px)'

/** Core `IconTrashOutline16` markup (same path data as the primitives icon). */
const TRASH_SVG =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.4782 4.84067L14.2138 10.1152C14.1102 12.1872 14.067 13.0115 13.3866 13.9607C13.1044 14.3546 12.7498 14.6912 12.3424 14.9535C11.8239 15.2872 11.2415 15.4316 10.5585 15.4998C9.88727 15.5668 9.04946 15.5656 7.99998 15.5656C6.95051 15.5656 6.1127 15.5668 5.44142 15.4998C4.75851 15.4316 4.17602 15.2872 3.65753 14.9535C3.25012 14.6912 2.89559 14.3546 2.61332 13.9607C1.93296 13.0115 1.88979 12.1872 1.78619 10.1152L1.52179 4.84067L2.89006 4.77277L3.15343 10.0463C3.26221 12.2218 3.32452 12.6015 3.72646 13.1624C3.90825 13.4161 4.13686 13.6334 4.39927 13.8023C4.66204 13.9714 5.00263 14.0792 5.57825 14.1367C6.16562 14.1953 6.92298 14.1963 7.99998 14.1963C9.07699 14.1963 9.83434 14.1953 10.4217 14.1367C10.9973 14.0792 11.3379 13.9714 11.6007 13.8023C11.8631 13.6334 12.0917 13.4161 12.2735 13.1624C12.6755 12.6015 12.7378 12.2218 12.8465 10.0463L13.1099 4.77277L14.4782 4.84067ZM5.43011 6.22849H6.7994V11.3909H5.43011V6.22849ZM9.20056 6.22849H10.5699V11.3909H9.20056V6.22849ZM8.53597 0.434431C9.17976 0.434431 9.6522 0.426926 10.0966 0.571258C10.2357 0.616451 10.3717 0.672554 10.502 0.738948C10.9182 0.951107 11.2464 1.29099 11.7015 1.74612L12.4978 2.54136H15.3742V3.91169H0.625732V2.54136H3.50218L4.29845 1.74612C4.75358 1.29099 5.08174 0.951107 5.49801 0.738948C5.62831 0.672554 5.76425 0.616451 5.90334 0.571258C6.34776 0.426926 6.82021 0.434431 7.46399 0.434431H8.53597ZM7.46399 1.80476C6.73208 1.80476 6.51641 1.81187 6.32617 1.87369C6.25545 1.89667 6.18668 1.92533 6.12041 1.95907C5.96398 2.03878 5.82348 2.16253 5.44142 2.54136H10.5585C10.1765 2.16253 10.036 2.03878 9.87955 1.95907C9.81329 1.92533 9.74452 1.89667 9.6738 1.87369C9.48356 1.81187 9.26789 1.80476 8.53597 1.80476H7.46399Z" fill="currentColor"/></svg>'

const ARIA_ZH_RE = /^会话“(.+)”的操作$/
const ARIA_EN_RE = /^Session actions for (.+)$/

/** Extract the session title from the core kebab button's aria-label. */
function titleFromAria(label: string): string | null {
  const zh = ARIA_ZH_RE.exec(label)
  if (zh !== null) return zh[1] ?? null
  const en = ARIA_EN_RE.exec(label)
  if (en !== null) return en[1] ?? null
  return null
}

interface Anchor {
  row: HTMLElement
  title: string
}

/** Resolve the session id behind a row by title, with a DOM-order fallback. */
function resolveSessionId(anchor: Anchor, list: SessionListState): string | null {
  const matches = list.ids.filter((id) => list.byId[id]?.displayTitle === anchor.title)
  if (matches.length === 1) return matches[0] ?? null
  if (matches.length === 0) return null
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[class*="sessionRow"]'))
  const rowIndex = rows.indexOf(anchor.row)
  return matches[Math.min(Math.max(rowIndex, 0), matches.length - 1)] ?? matches[0] ?? null
}

export interface DeleteSessionResult {
  ok: boolean
  status: number
  error?: string | undefined
}

export interface SessionDeleteControllerProps {
  /** Locale seat (mobileNav namespace). */
  t: Translate<MobileNavKey>
  /** Session list snapshot (useSessions). */
  list: SessionListState
  /** POST the session id to the host delete route. */
  deleteSession(sessionId: string): Promise<DeleteSessionResult>
  /** Pull a fresh session list after a successful delete. */
  refreshList(): Promise<unknown>
  /** Drop the current selection when the deleted session was the current one. */
  clearSelection(): void
}

/**
 * Mobile-only "delete session" addition to the official session-row kebab
 * menu: the menu itself is rendered by the core workspace module (rename /
 * fork / archive), so this controller observes the portal menu's mount and
 * appends a danger-styled "Delete session" item that reuses the core menu
 * item classes. Selecting it closes the core menu and opens the framework
 * Modal confirm dialog; confirming performs a REAL host-side delete through
 * the plugin's route and refreshes the list.
 */
export function SessionDeleteController({ t, list, deleteSession, refreshList, clearSelection }: SessionDeleteControllerProps) {
  const [target, setTarget] = useState<{ sessionId: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Latest-value refs: the observers are mounted once, so injected DOM and
  // async callbacks must read the current props without re-mounting.
  const tRef = useRef(t)
  tRef.current = t
  const listRef = useRef(list)
  listRef.current = list
  const deleteSessionRef = useRef(deleteSession)
  deleteSessionRef.current = deleteSession
  const refreshListRef = useRef(refreshList)
  refreshListRef.current = refreshList
  const clearSelectionRef = useRef(clearSelection)
  clearSelectionRef.current = clearSelection

  const anchorRef = useRef<Anchor | null>(null)

  // Watch kebab clicks: remember the tapped row + title so the next menu
  // mount can be attributed to a session row (not a workspace row).
  useEffect(() => {
    const narrow = window.matchMedia(MOBILE_QUERY)
    if (!narrow.matches) return () => {}
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target === null) return
      const btn = target.closest<HTMLButtonElement>('[class*="sessionRow"] button[aria-label]')
      if (btn === null) return
      const title = titleFromAria(btn.getAttribute('aria-label') ?? '')
      if (title === null) return
      const row = btn.closest<HTMLElement>('[class*="sessionRow"]')
      if (row === null) return
      anchorRef.current = { row, title }
    }
    document.addEventListener('click', onDocClick, true)
    return () => document.removeEventListener('click', onDocClick, true)
  }, [])

  // Inject the delete item into every freshly mounted portal menu that
  // follows a session-row kebab click.
  useEffect(() => {
    const narrow = window.matchMedia(MOBILE_QUERY)
    if (!narrow.matches) return () => {}
    const onMenuAdded = (menu: Element): void => {
      const anchor = anchorRef.current
      if (anchor === null || menu.hasAttribute('data-mobile-nav-injected')) return
      if (!anchor.row.isConnected) return
      const firstItem = menu.querySelector<HTMLButtonElement>('button[role="menuitem"]')
      if (firstItem === null) return
      const viewport = menu.querySelector('[role="presentation"]')
      if (viewport === null) return

      const wrap = document.createElement('div')
      wrap.className = firstItem.parentElement?.className ?? ''
      wrap.setAttribute('data-mobile-nav', 'delete-item')
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('role', 'menuitem')
      btn.className = `${firstItem.className} mobile-nav-delete-item`
      const icon = document.createElement('span')
      icon.className = firstItem.querySelector('span')?.className ?? ''
      icon.innerHTML = TRASH_SVG
      const label = document.createElement('span')
      label.className = firstItem.querySelectorAll('span')[1]?.className ?? ''
      label.textContent = tRef.current('delete.menu')
      btn.append(icon, label)
      wrap.append(btn)
      viewport.append(wrap)
      btn.addEventListener('click', () => {
        // Close the core menu (Escape is its documented close path) before
        // the confirm dialog takes over the screen.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
        const id = resolveSessionId(anchor, listRef.current)
        if (id === null) {
          setError(tRef.current('delete.resolveError'))
          return
        }
        setError(null)
        setTarget({ sessionId: id, title: anchor.title })
      })
      menu.setAttribute('data-mobile-nav-injected', '1')
    }
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.getAttribute('role') === 'menu') onMenuAdded(node)
          else {
            const menu = node.querySelector<Element>('[role="menu"]')
            if (menu !== null) onMenuAdded(menu)
          }
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  const closeDialog = (): void => {
    if (deleting) return
    setTarget(null)
    setError(null)
  }

  const confirmDelete = async (): Promise<void> => {
    if (target === null || deleting) return
    setDeleting(true)
    setError(null)
    let result: DeleteSessionResult
    try {
      result = await deleteSessionRef.current(target.sessionId)
    } catch (error) {
      // The inject face folds transport errors already; this is a last-resort
      // guard that surfaces the real message instead of a generic failure.
      setError(error instanceof Error ? error.message : tRef.current('delete.failed'))
      setDeleting(false)
      return
    }
    if (!result.ok) {
      // Show the concrete reason when the host provided one (e.g. its error
      // message), falling back to the localized copy.
      setError(result.error ?? (result.status > 0 ? `${tRef.current('delete.failed')} (HTTP ${result.status})` : tRef.current('delete.failed')))
      setDeleting(false)
      return
    }
    // The host confirmed the deletion. Selection and list refresh are
    // non-fatal follow-ups: the `session/disposed` relay already removed the
    // row, so a failed refresh must not turn a successful delete into an
    // error dialog.
    if (listRef.current.current === target.sessionId) {
      try {
        clearSelectionRef.current()
      } catch {
        // non-fatal
      }
    }
    try {
      await refreshListRef.current()
    } catch {
      // non-fatal
    }
    setDeleting(false)
    setTarget(null)
  }

  return (
    <Modal
      open={target !== null}
      onClose={closeDialog}
      closeLabel={t('delete.close')}
      title={t('delete.title')}
      {...(target !== null ? { description: t('delete.desc', { name: target.title }) } : {})}
      footer={
        <>
          <Button variant="outline" disabled={deleting} onClick={closeDialog}>
            {t('delete.cancel')}
          </Button>
          <Button variant="outline" className="mobile-nav-delete-danger" disabled={deleting} onClick={confirmDelete}>
            {t('delete.confirm')}
          </Button>
        </>
      }
    >
      {deleting && (
        <div className="mobile-nav-delete-status" role="status">
          {t('delete.pending')}
        </div>
      )}
      {!deleting && error !== null && (
        <div className="mobile-nav-delete-error" role="alert">
          {error}
        </div>
      )}
    </Modal>
  )
}
