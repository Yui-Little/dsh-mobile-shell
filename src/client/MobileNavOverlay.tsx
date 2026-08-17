import { useEffect, useLayoutEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconPanelLeftOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { SessionDeleteController } from './SessionDeleteController.tsx'
import type { DeleteSessionResult } from './SessionDeleteController.tsx'
import { NS } from './locales.ts'

/** Full props for the shell overlay entry. */
export interface MobileNavOverlayProps extends PropsRuntime<'shell.overlay'>, PropsLocale<typeof NS> {
  /** Bound ctx.layout.toggleSidebar(). */
  toggleSidebar: () => void
  /** POST the session id to the host delete route. */
  deleteSession: (sessionId: string) => Promise<DeleteSessionResult>
  /** Pull a fresh session list after a successful delete. */
  refreshList: () => Promise<unknown>
  /** Drop the current selection when the deleted session was the current one. */
  clearSelection: () => void
}

/** Same breakpoint as the shell's SIDEBAR_AUTO_COLLAPSE (viewport < 1024). */
const MOBILE_QUERY = '(max-width: 1023px)'

/** Live matchMedia hook for the narrow breakpoint. */
function useMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY)
    const onChange = (event: MediaQueryListEvent) => setMobile(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return mobile
}

/** The AppFrame element: direct parent of the shell overlay layer. */
function findFrame(): HTMLElement | null {
  return document.querySelector('[data-shell-overlay]')?.parentElement ?? null
}

/**
 * Mobile shell overlay: owns the `data-mobile-nav` marker on the AppFrame
 * element (the CSS restructure keys off it), mirrors the frame's collapsed
 * state into React state, and renders the dimmed backdrop plus a floating
 * directory button for the hero/blank phases that have no session header.
 * Also hosts the mobile-only "delete session" kebab-menu addition.
 */
export function MobileNavOverlay({ useSessions, toggleSidebar, deleteSession, refreshList, clearSelection, t }: MobileNavOverlayProps) {
  const mobile = useMobile()
  const [open, setOpen] = useState(false)
  const [fabVisible, setFabVisible] = useState(false)
  // Session list snapshot for the delete controller (resolved before any
  // conditional return — hook order is unconditional).
  const list = useSessions((s) => s)

  // Frame ownership + open-state mirror. On wide screens this effect is inert:
  // the marker is never set, so the layout is untouched.
  useLayoutEffect(() => {
    if (!mobile) {
      setOpen(false)
      return
    }
    const frame = findFrame()
    if (frame === null) return
    frame.setAttribute('data-mobile-nav', 'frame')
    const sync = () => setOpen(!frame.hasAttribute('data-sidebar-collapsed'))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
    return () => {
      observer.disconnect()
      frame.removeAttribute('data-mobile-nav')
    }
  }, [mobile])

  // The floating button is a fallback for surfaces without a session header:
  // phase "active" means the header (and its toggle) is rendered already.
  useEffect(() => {
    if (!mobile) {
      setFabVisible(false)
      return
    }
    let raf = 0
    const sync = () => {
      raf = 0
      setFabVisible(document.querySelector('[data-phase="active"]') === null)
    }
    sync()
    const observer = new MutationObserver(() => {
      // rAF-coalesced: session switches / tab changes mutate the tree in
      // bursts; one query per frame is plenty.
      if (raf === 0) raf = requestAnimationFrame(sync)
    })
    // childList: the conversation root can be replaced wholesale on session
    // switches, so attribute-only observation would miss the new phase.
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-phase'],
    })
    return () => {
      observer.disconnect()
      if (raf !== 0) cancelAnimationFrame(raf)
    }
  }, [mobile])

  // Escape closes the drawer — but yields to an open modal dialog (e.g. the
  // settings panel), which owns its own Escape handling.
  useEffect(() => {
    if (!mobile || !open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.querySelector('[aria-modal="true"]') === null) toggleSidebar()
    }
    // Capture phase: run before the settings panel's own document-bubble Escape
    // handler, so the modal is still present when we yield to it.
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [mobile, open, toggleSidebar])

  // Haptic feedback on primary controls (Android only — iOS has no
  // navigator.vibrate). A short 8ms tick on tap of any interactive element,
  // throttled so a double-tap or fast typing cannot buzz repeatedly. This is
  // the "physical" half of the press feedback the stylesheet provides.
  useEffect(() => {
    if (!mobile || typeof navigator.vibrate !== 'function') return
    let last = 0
    const onTap = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null
      if (target === null) return
      if (target.closest('button, [role="button"], [role="tab"], [role="treeitem"], [role="option"], [role="switch"], a') === null) {
        return
      }
      const now = performance.now()
      if (now - last < 60) return
      last = now
      navigator.vibrate(8)
    }
    document.addEventListener('click', onTap, true)
    return () => document.removeEventListener('click', onTap, true)
  }, [mobile])

  // Drawer slide on the compositor, started the moment the toggle is
  // tapped (capture phase — before React commits the collapsed flag). The
  // official sidebar mounts/unmounts ~80 nodes of session-list DOM on every
  // switch: a 60ms+ main-thread task on desktop, several times that on a
  // phone. A CSS transition only starts AFTER that commit, so its first
  // frames fight the mount (the jank felt when opening the drawer). A WAAPI
  // transform animation is compositor-driven: it plays smoothly while the
  // mount occupies the main thread, and the freshly mounted content simply
  // appears at the animation's current position. The CSS transition stays
  // as a fallback for paths that do not go through these controls.
  useEffect(() => {
    if (!mobile) return
    const onTap = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null
      if (target === null) return
      if (target.closest('[data-mobile-nav="toggle"], [data-mobile-nav="fab"], [data-mobile-nav="backdrop"]') === null) {
        return
      }
      const frame = findFrame()
      if (frame === null) return
      const drawer = frame.firstElementChild as HTMLElement | null
      if (drawer === null) return
      // Capture phase: the collapsed flag has not flipped yet, so its current
      // state IS the target state.
      const opening = frame.hasAttribute('data-sidebar-collapsed')
      for (const animation of drawer.getAnimations()) animation.cancel()
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // Pixel endpoints, not percentages: the official sidebar swaps the
      // rail (~56px) for the full list (~280px) in the same main-thread task
      // that follows the tap, and a percentage target would be re-resolved
      // against the new width mid-slide (the close animation visibly jumped
      // back). A fixed pixel target keeps the curve monotonic. The open
      // starts from the current computed transform (fully off-screen for the
      // rail width); the mount happens inside the task, whose frames are
      // skipped — the drawer simply continues sliding with the content
      // already in place.
      const from = opening ? getComputedStyle(drawer).transform : 'translateX(0px)'
      const to = opening ? 'translateX(0px)' : `translateX(-${Math.round(drawer.getBoundingClientRect().width)}px)`
      drawer.animate(
        [
          { transform: from },
          { transform: to },
        ],
        { duration: reduced ? 0 : 280, easing: 'cubic-bezier(.4, 0, .2, 1)' },
      )
    }
    document.addEventListener('click', onTap, true)
    return () => document.removeEventListener('click', onTap, true)
  }, [mobile])

  // Navigation inside the drawer closes it: tapping a session row or a
  // plugin takeover entry (task board / ssh) must hand the screen to the
  // content it just opened. Capture phase — the drawer closes before the
  // shell or a plugin processes the click, so takeover panels never render
  // under the open drawer.
  //
  // Deliberately NOT closed by this rule:
  // - Settings / Session log: their dialogs render INSIDE the drawer DOM
  //   (portaled into the sidebar); closing the drawer would slide the dialog
  //   off-screen with it.
  // - Workspace folder chevrons, the logo: pure UI toggles, not navigation.
  // - Anything while a modal dialog is open: the dialog owns the screen.
  useEffect(() => {
    if (!mobile || !open) return
    const onDrawerClick = (event: MouseEvent) => {
      if (document.querySelector('[aria-modal="true"]') !== null) return
      const target = event.target as HTMLElement | null
      if (target === null) return
      const drawer = document.querySelector<HTMLElement>('[data-mobile-nav="frame"] > :first-child')
      if (drawer === null || !drawer.contains(target)) return
      // A session row's own action buttons — the "Session actions" kebab
      // (delete / rename), revealed on hover / long-press — open an edit
      // menu. Tapping one must NOT count as tapping the row, or the drawer
      // would close and take the just-opened menu with it.
      if (target.closest('[class*="sessionRow"] button') !== null) return
      const navigates = target.closest(
        'button[data-dsh-taskboard-entry], button[data-dsh-ssh-entry], [class*="newSession"], [class*="sessionRow"], [class*="searchResultRow"], [class*="searchResultWorkspace"]',
      )
      if (navigates !== null) toggleSidebar()
    }
    document.addEventListener('click', onDrawerClick, true)
    return () => document.removeEventListener('click', onDrawerClick, true)
  }, [mobile, open, toggleSidebar])

  if (!mobile) return null
  return (
    <>
      <SessionDeleteController
        t={t}
        list={list}
        deleteSession={deleteSession}
        refreshList={refreshList}
        clearSelection={clearSelection}
      />
      {open && (
        <div
          data-mobile-nav="backdrop"
          role="button"
          aria-label={t('backdrop')}
          onClick={() => toggleSidebar()}
        />
      )}
      {fabVisible && !open && (
        <button
          type="button"
          data-mobile-nav="fab"
          aria-label={t('open')}
          title={t('open')}
          onClick={() => toggleSidebar()}
        >
          <IconPanelLeftOutline16 size={18} />
        </button>
      )}
    </>
  )
}
