window.__ModuleLoader__.load({ id: "dsh-mobile-shell", factory: (require) => {
var __modules = {};
__modules["MobileNavToggle.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileNavToggle = MobileNavToggle;
const jsx_runtime_1 = require("react/jsx-runtime");
const dsh_client_ui_primitives_1 = require("@deepseek-ai/dsh-client-ui-primitives");
/**
 * Mobile-only icon buttons next to the session title:
 * - toggle: opens the directory drawer on narrow screens.
 * - files: toggles the dsh-web-ui explorer sheet directly — one tap opens,
 *   a second tap closes it, no drawer round-trip. (The drawer footer keeps
 *   a Files entry for the hero/blank phases where this header does not
 *   exist.)
 * Hidden entirely on wide screens (CSS media query).
 */
function MobileNavToggle({ toggleSidebar, t }) {
    const toggleExplorer = () => {
        const frame = document.querySelector('[data-mobile-nav="frame"]');
        if (frame === null)
            return;
        if (frame.hasAttribute('data-aionui-explorer-open')) {
            frame.removeAttribute('data-aionui-explorer-open');
        }
        else {
            frame.setAttribute('data-aionui-explorer-open', '');
        }
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { type: "button", "data-mobile-nav": "toggle", "aria-label": t('open'), title: t('open'), onClick: () => toggleSidebar(), children: (0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.IconPanelLeftOutline16, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", "data-mobile-nav": "files", "aria-label": t('files'), title: t('files'), onClick: toggleExplorer, children: (0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.IconFolderOpenOutline16, { size: 16 }) })] }));
}
};
__modules["SessionDeleteController.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionDeleteController = SessionDeleteController;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const dsh_client_ui_primitives_1 = require("@deepseek-ai/dsh-client-ui-primitives");
/** Same breakpoint as the shell's SIDEBAR_AUTO_COLLAPSE (viewport < 1024). */
const MOBILE_QUERY = '(max-width: 1023px)';
/** Core `IconTrashOutline16` markup (same path data as the primitives icon). */
const TRASH_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.4782 4.84067L14.2138 10.1152C14.1102 12.1872 14.067 13.0115 13.3866 13.9607C13.1044 14.3546 12.7498 14.6912 12.3424 14.9535C11.8239 15.2872 11.2415 15.4316 10.5585 15.4998C9.88727 15.5668 9.04946 15.5656 7.99998 15.5656C6.95051 15.5656 6.1127 15.5668 5.44142 15.4998C4.75851 15.4316 4.17602 15.2872 3.65753 14.9535C3.25012 14.6912 2.89559 14.3546 2.61332 13.9607C1.93296 13.0115 1.88979 12.1872 1.78619 10.1152L1.52179 4.84067L2.89006 4.77277L3.15343 10.0463C3.26221 12.2218 3.32452 12.6015 3.72646 13.1624C3.90825 13.4161 4.13686 13.6334 4.39927 13.8023C4.66204 13.9714 5.00263 14.0792 5.57825 14.1367C6.16562 14.1953 6.92298 14.1963 7.99998 14.1963C9.07699 14.1963 9.83434 14.1953 10.4217 14.1367C10.9973 14.0792 11.3379 13.9714 11.6007 13.8023C11.8631 13.6334 12.0917 13.4161 12.2735 13.1624C12.6755 12.6015 12.7378 12.2218 12.8465 10.0463L13.1099 4.77277L14.4782 4.84067ZM5.43011 6.22849H6.7994V11.3909H5.43011V6.22849ZM9.20056 6.22849H10.5699V11.3909H9.20056V6.22849ZM8.53597 0.434431C9.17976 0.434431 9.6522 0.426926 10.0966 0.571258C10.2357 0.616451 10.3717 0.672554 10.502 0.738948C10.9182 0.951107 11.2464 1.29099 11.7015 1.74612L12.4978 2.54136H15.3742V3.91169H0.625732V2.54136H3.50218L4.29845 1.74612C4.75358 1.29099 5.08174 0.951107 5.49801 0.738948C5.62831 0.672554 5.76425 0.616451 5.90334 0.571258C6.34776 0.426926 6.82021 0.434431 7.46399 0.434431H8.53597ZM7.46399 1.80476C6.73208 1.80476 6.51641 1.81187 6.32617 1.87369C6.25545 1.89667 6.18668 1.92533 6.12041 1.95907C5.96398 2.03878 5.82348 2.16253 5.44142 2.54136H10.5585C10.1765 2.16253 10.036 2.03878 9.87955 1.95907C9.81329 1.92533 9.74452 1.89667 9.6738 1.87369C9.48356 1.81187 9.26789 1.80476 8.53597 1.80476H7.46399Z" fill="currentColor"/></svg>';
const ARIA_ZH_RE = /^会话“(.+)”的操作$/;
const ARIA_EN_RE = /^Session actions for (.+)$/;
/** Extract the session title from the core kebab button's aria-label. */
function titleFromAria(label) {
    const zh = ARIA_ZH_RE.exec(label);
    if (zh !== null)
        return zh[1] ?? null;
    const en = ARIA_EN_RE.exec(label);
    if (en !== null)
        return en[1] ?? null;
    return null;
}
/** Resolve the session id behind a row by title, with a DOM-order fallback. */
function resolveSessionId(anchor, list) {
    const matches = list.ids.filter((id) => list.byId[id]?.displayTitle === anchor.title);
    if (matches.length === 1)
        return matches[0] ?? null;
    if (matches.length === 0)
        return null;
    const rows = Array.from(document.querySelectorAll('[class*="sessionRow"]'));
    const rowIndex = rows.indexOf(anchor.row);
    return matches[Math.min(Math.max(rowIndex, 0), matches.length - 1)] ?? matches[0] ?? null;
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
function SessionDeleteController({ t, list, deleteSession, refreshList, clearSelection }) {
    const [target, setTarget] = (0, react_1.useState)(null);
    const [deleting, setDeleting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    // Latest-value refs: the observers are mounted once, so injected DOM and
    // async callbacks must read the current props without re-mounting.
    const tRef = (0, react_1.useRef)(t);
    tRef.current = t;
    const listRef = (0, react_1.useRef)(list);
    listRef.current = list;
    const deleteSessionRef = (0, react_1.useRef)(deleteSession);
    deleteSessionRef.current = deleteSession;
    const refreshListRef = (0, react_1.useRef)(refreshList);
    refreshListRef.current = refreshList;
    const clearSelectionRef = (0, react_1.useRef)(clearSelection);
    clearSelectionRef.current = clearSelection;
    const anchorRef = (0, react_1.useRef)(null);
    // Watch kebab clicks: remember the tapped row + title so the next menu
    // mount can be attributed to a session row (not a workspace row).
    (0, react_1.useEffect)(() => {
        const narrow = window.matchMedia(MOBILE_QUERY);
        if (!narrow.matches)
            return () => { };
        const onDocClick = (event) => {
            const target = event.target;
            if (target === null)
                return;
            const btn = target.closest('[class*="sessionRow"] button[aria-label]');
            if (btn === null)
                return;
            const title = titleFromAria(btn.getAttribute('aria-label') ?? '');
            if (title === null)
                return;
            const row = btn.closest('[class*="sessionRow"]');
            if (row === null)
                return;
            anchorRef.current = { row, title };
        };
        document.addEventListener('click', onDocClick, true);
        return () => document.removeEventListener('click', onDocClick, true);
    }, []);
    // Inject the delete item into every freshly mounted portal menu that
    // follows a session-row kebab click.
    (0, react_1.useEffect)(() => {
        const narrow = window.matchMedia(MOBILE_QUERY);
        if (!narrow.matches)
            return () => { };
        const onMenuAdded = (menu) => {
            const anchor = anchorRef.current;
            if (anchor === null || menu.hasAttribute('data-mobile-nav-injected'))
                return;
            if (!anchor.row.isConnected)
                return;
            const firstItem = menu.querySelector('button[role="menuitem"]');
            if (firstItem === null)
                return;
            const viewport = menu.querySelector('[role="presentation"]');
            if (viewport === null)
                return;
            const wrap = document.createElement('div');
            wrap.className = firstItem.parentElement?.className ?? '';
            wrap.setAttribute('data-mobile-nav', 'delete-item');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('role', 'menuitem');
            btn.className = `${firstItem.className} mobile-nav-delete-item`;
            const icon = document.createElement('span');
            icon.className = firstItem.querySelector('span')?.className ?? '';
            icon.innerHTML = TRASH_SVG;
            const label = document.createElement('span');
            label.className = firstItem.querySelectorAll('span')[1]?.className ?? '';
            label.textContent = tRef.current('delete.menu');
            btn.append(icon, label);
            wrap.append(btn);
            viewport.append(wrap);
            btn.addEventListener('click', () => {
                // Close the core menu (Escape is its documented close path) before
                // the confirm dialog takes over the screen.
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
                const id = resolveSessionId(anchor, listRef.current);
                if (id === null) {
                    setError(tRef.current('delete.resolveError'));
                    return;
                }
                setError(null);
                setTarget({ sessionId: id, title: anchor.title });
            });
            menu.setAttribute('data-mobile-nav-injected', '1');
        };
        const observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (!(node instanceof Element))
                        continue;
                    if (node.getAttribute('role') === 'menu')
                        onMenuAdded(node);
                    else {
                        const menu = node.querySelector('[role="menu"]');
                        if (menu !== null)
                            onMenuAdded(menu);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);
    const closeDialog = () => {
        if (deleting)
            return;
        setTarget(null);
        setError(null);
    };
    const confirmDelete = async () => {
        if (target === null || deleting)
            return;
        setDeleting(true);
        setError(null);
        let result;
        try {
            result = await deleteSessionRef.current(target.sessionId);
        }
        catch (error) {
            // The inject face folds transport errors already; this is a last-resort
            // guard that surfaces the real message instead of a generic failure.
            setError(error instanceof Error ? error.message : tRef.current('delete.failed'));
            setDeleting(false);
            return;
        }
        if (!result.ok) {
            // Show the concrete reason when the host provided one (e.g. its error
            // message), falling back to the localized copy.
            setError(result.error ?? (result.status > 0 ? `${tRef.current('delete.failed')} (HTTP ${result.status})` : tRef.current('delete.failed')));
            setDeleting(false);
            return;
        }
        // The host confirmed the deletion. Selection and list refresh are
        // non-fatal follow-ups: the `session/disposed` relay already removed the
        // row, so a failed refresh must not turn a successful delete into an
        // error dialog.
        if (listRef.current.current === target.sessionId) {
            try {
                clearSelectionRef.current();
            }
            catch {
                // non-fatal
            }
        }
        try {
            await refreshListRef.current();
        }
        catch {
            // non-fatal
        }
        setDeleting(false);
        setTarget(null);
    };
    return ((0, jsx_runtime_1.jsxs)(dsh_client_ui_primitives_1.Modal, { open: target !== null, onClose: closeDialog, closeLabel: t('delete.close'), title: t('delete.title'), ...(target !== null ? { description: t('delete.desc', { name: target.title }) } : {}), footer: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.Button, { variant: "outline", disabled: deleting, onClick: closeDialog, children: t('delete.cancel') }), (0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.Button, { variant: "outline", className: "mobile-nav-delete-danger", disabled: deleting, onClick: confirmDelete, children: t('delete.confirm') })] }), children: [deleting && ((0, jsx_runtime_1.jsx)("div", { className: "mobile-nav-delete-status", role: "status", children: t('delete.pending') })), !deleting && error !== null && ((0, jsx_runtime_1.jsx)("div", { className: "mobile-nav-delete-error", role: "alert", children: error }))] }));
}
};
__modules["MobileNavOverlay.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileNavOverlay = MobileNavOverlay;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const dsh_client_ui_primitives_1 = require("@deepseek-ai/dsh-client-ui-primitives");
const SessionDeleteController_tsx_1 = require("./SessionDeleteController.js");
/** Same breakpoint as the shell's SIDEBAR_AUTO_COLLAPSE (viewport < 1024). */
const MOBILE_QUERY = '(max-width: 1023px)';
/** Live matchMedia hook for the narrow breakpoint. */
function useMobile() {
    const [mobile, setMobile] = (0, react_1.useState)(() => window.matchMedia(MOBILE_QUERY).matches);
    (0, react_1.useEffect)(() => {
        const query = window.matchMedia(MOBILE_QUERY);
        const onChange = (event) => setMobile(event.matches);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);
    return mobile;
}
/** The AppFrame element: direct parent of the shell overlay layer. */
function findFrame() {
    return document.querySelector('[data-shell-overlay]')?.parentElement ?? null;
}
/**
 * Mobile shell overlay: owns the `data-mobile-nav` marker on the AppFrame
 * element (the CSS restructure keys off it), mirrors the frame's collapsed
 * state into React state, and renders the dimmed backdrop plus a floating
 * directory button for the hero/blank phases that have no session header.
 * Also hosts the mobile-only "delete session" kebab-menu addition.
 */
function MobileNavOverlay({ useSessions, toggleSidebar, deleteSession, refreshList, clearSelection, t }) {
    const mobile = useMobile();
    const [open, setOpen] = (0, react_1.useState)(false);
    const [fabVisible, setFabVisible] = (0, react_1.useState)(false);
    // Session list snapshot for the delete controller (resolved before any
    // conditional return — hook order is unconditional).
    const list = useSessions((s) => s);
    // Frame ownership + open-state mirror. On wide screens this effect is inert:
    // the marker is never set, so the layout is untouched.
    (0, react_1.useLayoutEffect)(() => {
        if (!mobile) {
            setOpen(false);
            return;
        }
        const frame = findFrame();
        if (frame === null)
            return;
        frame.setAttribute('data-mobile-nav', 'frame');
        const sync = () => setOpen(!frame.hasAttribute('data-sidebar-collapsed'));
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] });
        return () => {
            observer.disconnect();
            frame.removeAttribute('data-mobile-nav');
        };
    }, [mobile]);
    // The floating button is a fallback for surfaces without a session header:
    // phase "active" means the header (and its toggle) is rendered already.
    (0, react_1.useEffect)(() => {
        if (!mobile) {
            setFabVisible(false);
            return;
        }
        let raf = 0;
        const sync = () => {
            raf = 0;
            setFabVisible(document.querySelector('[data-phase="active"]') === null);
        };
        sync();
        const observer = new MutationObserver(() => {
            // rAF-coalesced: session switches / tab changes mutate the tree in
            // bursts; one query per frame is plenty.
            if (raf === 0)
                raf = requestAnimationFrame(sync);
        });
        // childList: the conversation root can be replaced wholesale on session
        // switches, so attribute-only observation would miss the new phase.
        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['data-phase'],
        });
        return () => {
            observer.disconnect();
            if (raf !== 0)
                cancelAnimationFrame(raf);
        };
    }, [mobile]);
    // Escape closes the drawer — but yields to an open modal dialog (e.g. the
    // settings panel), which owns its own Escape handling.
    (0, react_1.useEffect)(() => {
        if (!mobile || !open)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && document.querySelector('[aria-modal="true"]') === null)
                toggleSidebar();
        };
        // Capture phase: run before the settings panel's own document-bubble Escape
        // handler, so the modal is still present when we yield to it.
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [mobile, open, toggleSidebar]);
    // Haptic feedback on primary controls (Android only — iOS has no
    // navigator.vibrate). A short 8ms tick on tap of any interactive element,
    // throttled so a double-tap or fast typing cannot buzz repeatedly. This is
    // the "physical" half of the press feedback the stylesheet provides.
    (0, react_1.useEffect)(() => {
        if (!mobile || typeof navigator.vibrate !== 'function')
            return;
        let last = 0;
        const onTap = (event) => {
            const target = event.target;
            if (target === null)
                return;
            if (target.closest('button, [role="button"], [role="tab"], [role="treeitem"], [role="option"], [role="switch"], a') === null) {
                return;
            }
            const now = performance.now();
            if (now - last < 60)
                return;
            last = now;
            navigator.vibrate(8);
        };
        document.addEventListener('click', onTap, true);
        return () => document.removeEventListener('click', onTap, true);
    }, [mobile]);
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
    (0, react_1.useEffect)(() => {
        if (!mobile)
            return;
        const onTap = (event) => {
            const target = event.target;
            if (target === null)
                return;
            if (target.closest('[data-mobile-nav="toggle"], [data-mobile-nav="fab"], [data-mobile-nav="backdrop"]') === null) {
                return;
            }
            const frame = findFrame();
            if (frame === null)
                return;
            const drawer = frame.firstElementChild;
            if (drawer === null)
                return;
            // Capture phase: the collapsed flag has not flipped yet, so its current
            // state IS the target state.
            const opening = frame.hasAttribute('data-sidebar-collapsed');
            for (const animation of drawer.getAnimations())
                animation.cancel();
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            // Pixel endpoints, not percentages: the official sidebar swaps the
            // rail (~56px) for the full list (~280px) in the same main-thread task
            // that follows the tap, and a percentage target would be re-resolved
            // against the new width mid-slide (the close animation visibly jumped
            // back). A fixed pixel target keeps the curve monotonic. The open
            // starts from the current computed transform (fully off-screen for the
            // rail width); the mount happens inside the task, whose frames are
            // skipped — the drawer simply continues sliding with the content
            // already in place.
            const from = opening ? getComputedStyle(drawer).transform : 'translateX(0px)';
            const to = opening ? 'translateX(0px)' : `translateX(-${Math.round(drawer.getBoundingClientRect().width)}px)`;
            drawer.animate([
                { transform: from },
                { transform: to },
            ], { duration: reduced ? 0 : 280, easing: 'cubic-bezier(.4, 0, .2, 1)' });
        };
        document.addEventListener('click', onTap, true);
        return () => document.removeEventListener('click', onTap, true);
    }, [mobile]);
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
    (0, react_1.useEffect)(() => {
        if (!mobile || !open)
            return;
        const onDrawerClick = (event) => {
            if (document.querySelector('[aria-modal="true"]') !== null)
                return;
            const target = event.target;
            if (target === null)
                return;
            const drawer = document.querySelector('[data-mobile-nav="frame"] > :first-child');
            if (drawer === null || !drawer.contains(target))
                return;
            // A session row's own action buttons — the "Session actions" kebab
            // (delete / rename), revealed on hover / long-press — open an edit
            // menu. Tapping one must NOT count as tapping the row, or the drawer
            // would close and take the just-opened menu with it.
            if (target.closest('[class*="sessionRow"] button') !== null)
                return;
            const navigates = target.closest('button[data-dsh-taskboard-entry], button[data-dsh-ssh-entry], [class*="newSession"], [class*="sessionRow"], [class*="searchResultRow"], [class*="searchResultWorkspace"]');
            if (navigates !== null)
                toggleSidebar();
        };
        document.addEventListener('click', onDrawerClick, true);
        return () => document.removeEventListener('click', onDrawerClick, true);
    }, [mobile, open, toggleSidebar]);
    if (!mobile)
        return null;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(SessionDeleteController_tsx_1.SessionDeleteController, { t: t, list: list, deleteSession: deleteSession, refreshList: refreshList, clearSelection: clearSelection }), open && ((0, jsx_runtime_1.jsx)("div", { "data-mobile-nav": "backdrop", role: "button", "aria-label": t('backdrop'), onClick: () => toggleSidebar() })), fabVisible && !open && ((0, jsx_runtime_1.jsx)("button", { type: "button", "data-mobile-nav": "fab", "aria-label": t('open'), title: t('open'), onClick: () => toggleSidebar(), children: (0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.IconPanelLeftOutline16, { size: 18 }) }))] }));
}
};
__modules["MobileStatusView.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileStatusView = MobileStatusView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const dsh_client_ui_primitives_1 = require("@deepseek-ai/dsh-client-ui-primitives");
/** Compact token count: 517 / 12.2K / 517K / 1.2M (one decimal under three digits). */
function formatTokens(n) {
    const scaled = (v) => (v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));
    if (n < 1e3)
        return String(n);
    if (n < 1e6)
        return `${scaled(n / 1e3)}K`;
    return `${scaled(n / 1e6)}M`;
}
/** Compact duration: 45.2s under a minute, 2m42s from there on. */
function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms <= 0)
        return '—';
    const s = ms / 1e3;
    if (s < 60)
        return `${Math.round(s * 10) / 10}s`;
    const whole = Math.round(s);
    return `${Math.floor(whole / 60)}m${whole % 60}s`;
}
/** Decode-throughput figure: whole tokens from ten up, one decimal below. */
function formatTokensPerSecond(tps) {
    const clamped = Math.max(0, tps);
    return clamped >= 10 ? String(Math.round(clamped)) : String(Math.round(clamped * 10) / 10);
}
/** Sum the three disjoint prompt-side billing buckets. */
function billedInputTokens(usage) {
    return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
}
/** Cache-hit share of prompt-side input; null when no input was billed.
* Kept as the exact ratio — the caller formats it (two decimals on the card). */
function cacheHitPercent(usage) {
    const denominator = billedInputTokens(usage);
    return denominator === 0 ? null : (usage.cacheReadTokens / denominator) * 100;
}
/**
 * Session status tab — a dashboard of the conversation's engine state.
 *
 * Layout (mobile-first, mirroring the official design language: one soft
 * card per group, hairline separators inside, accent blue for the live
 * state):
 *
 *   ● Running                    active          ← status line (no card)
 *   ┌─────────────────────────────────────────┐
 *   │ 轮数       5 │ 步数       136           │  ← core counts card
 *   │ 模型耗时 12m10s │ 工具耗时 1m54s        │
 *   └─────────────────────────────────────────┘
 *   ┌─────────────────────────────────────────┐
 *   │ 首字延迟  1.3s │ 解码速率  139 tok/s    │  ← latency card
 *   └─────────────────────────────────────────┘
 *   ┌─────────────────────────────────────────┐
 *   │ 缓存命中 99% │ 输入 14.7M │ 输出 76.9K  │  ← usage card (3 columns)
 *   └─────────────────────────────────────────┘
 *   排队消息 0 · 等待确认 0 · 运行中工具 bash     ← transient list
 *
 * Figures ride the durable `sessionStats` + `tokenUsage` projections when
 * the host provides them (client-window fallback for the counts). Every
 * value is a live subscription via the framework standard kit.
 */
/** Stable empty list so a session with no jobs keeps one array identity. */
const NO_TASKS = [];
/** A job the registry still holds open, and whose duration therefore ticks. */
function isLiveJob(job) {
    return job.status === 'running' || job.status === 'stopping';
}
/** Human status word for the row. */
function jobStatusLabel(status, t) {
    switch (status) {
        case 'running': return t('jobs.status.running');
        case 'stopping': return t('jobs.status.stopping');
        case 'completed': return t('jobs.status.completed');
        case 'killed': return t('jobs.status.killed');
        case 'failed': return t('jobs.status.failed');
        default: return t('jobs.status.completed');
    }
}
/** Elapsed time in at most two adjacent units (same vocabulary as the header control). */
function formatJobDuration(elapsedMs, t) {
    const total = Math.max(0, Math.floor(elapsedMs / 1e3));
    const seconds = total % 60;
    const minutes = Math.floor(total / 60) % 60;
    const hours = Math.floor(total / 3600);
    if (hours > 0)
        return t('jobs.duration.hours', { hours, minutes });
    if (minutes > 0)
        return t('jobs.duration.minutes', { minutes, seconds });
    return t('jobs.duration.seconds', { seconds });
}
/** Live rows first in start order, then settled rows newest-first. */
function orderedJobs(jobs) {
    return [...jobs].sort((left, right) => {
        const liveLeft = isLiveJob(left);
        if (liveLeft !== isLiveJob(right))
            return liveLeft ? -1 : 1;
        if (liveLeft)
            return left.startedAt - right.startedAt;
        const finished = (right.finishedAt ?? right.startedAt) - (left.finishedAt ?? left.startedAt);
        return finished !== 0 ? finished : left.startedAt - right.startedAt;
    });
}
/**
 * Background-jobs section inside the Status tab. The official header
 * control (ui-jobs "job-list") is hidden on mobile and its data surface —
 * jobsBySession on the sessions snapshot — is rendered here instead:
 * collapsed by default, one tap expands the live/settled task rows.
 */
function JobsSection({ useSessions, sessionId, t, }) {
    const jobs = useSessions((state) => state.jobsBySession[sessionId]) ?? NO_TASKS;
    const [open, setOpen] = (0, react_1.useState)(false);
    const [now, setNow] = (0, react_1.useState)(() => Date.now());
    (0, react_1.useEffect)(() => {
        if (!open || !jobs.some(isLiveJob))
            return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [open, jobs]);
    if (jobs.length === 0)
        return null;
    // Auto-cleanup: killed jobs disappear entirely (they pile up fast from
    // cancelled runs), and settled rows are capped to the newest MAX_SETTLED
    // so the list can never grow without bound — live jobs always stay on top.
    const MAX_SETTLED = 8;
    const rows = (0, react_1.useMemo)(() => {
        const sorted = orderedJobs(jobs.filter((job) => job.status !== 'killed'));
        const liveCount = sorted.filter(isLiveJob).length;
        return sorted.slice(0, liveCount + MAX_SETTLED);
    }, [jobs]);
    const liveCount = rows.filter(isLiveJob).length;
    return ((0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "jobs-card", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", "data-mobile-nav": "jobs-toggle", "aria-expanded": open, "aria-label": t('jobs.title'), onClick: () => setOpen((v) => !v), children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "jobs-icon", children: (0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.IconChecklistOutline14, {}) }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "jobs-title", children: t('jobs.title') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "jobs-count", "data-live": liveCount > 0 ? '1' : '0', children: liveCount > 0 ? t('jobs.countLive', { count: liveCount }) : t('jobs.count', { count: rows.length }) }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "jobs-chevron", "data-open": open ? '1' : '0', children: (0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.IconChevronDownOutline14, {}) })] }), open && ((0, jsx_runtime_1.jsx)("div", { "data-mobile-nav": "jobs-list", children: rows.map((job) => {
                    const live = isLiveJob(job);
                    const duration = formatJobDuration(live ? now - job.startedAt : (job.finishedAt ?? job.startedAt) - job.startedAt, t);
                    const status = jobStatusLabel(job.status, t);
                    return ((0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "job-row", "data-live": live ? '1' : '0', "data-state": job.status, children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "job-dot" }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "job-kind", children: job.kind }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "job-label", title: job.label, children: job.label }), (0, jsx_runtime_1.jsxs)("span", { "data-mobile-nav": "job-meta", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "job-status", title: job.detail ?? status, children: status }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "job-duration", children: duration })] })] }, job.id));
                }) }))] }));
}
function MobileStatusView({ useSession, useSessions, useProjection, sessionId, downloadSessionLog, t }) {
    const running = useSession((s) => s.running);
    const composerPhase = useSession((s) => s.composerPhase);
    const removed = useSession((s) => s.removed);
    const turnEnds = useSession((s) => s.turnEnds);
    const turnTimings = useSession((s) => s.turnTimings);
    const subagent = useSession((s) => s.subagent);
    const loadingOlder = useSession((s) => s.loadingOlder);
    const lastAgentError = useSession((s) => s.lastAgentError);
    const stats = useProjection('sessionStats');
    const usage = useProjection('tokenUsage');
    const fallback = {
        turns: turnEnds.size,
        steps: turnTimings.size,
        llmMs: 0,
        toolMs: 0,
        ttftMs: 0,
        ttftSteps: 0,
        decodeMs: 0,
        decodeTokens: 0,
    };
    const s = stats ?? fallback;
    const phaseLabel = composerPhase === 'blank' ? t('status.blank') : composerPhase === 'engaging' ? 'engaging' : 'active';
    const showUsage = usage !== undefined && (billedInputTokens(usage) > 0 || usage.outputTokens > 0);
    const cacheHit = usage !== undefined ? cacheHitPercent(usage) : null;
    // "Running tools" is deliberately NOT listed here: on mobile every tool
    // call also surfaces as a background job (Status tab jobs card), so a
    // duplicate inline row would just add noise.
    const transient = [
        ...(subagent !== null ? [{ label: t('status.subagent'), value: subagent.address.address }] : []),
        ...(loadingOlder ? [{ label: t('status.loadingOlder'), value: '…' }] : []),
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status", children: [(0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-line", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "status-dot", "data-running": running ? '1' : '0' }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "status-label", children: running ? t('status.running') : t('status.idle') }), (0, jsx_runtime_1.jsxs)("span", { "data-mobile-nav": "status-phase", children: [phaseLabel, removed ? ` · ${t('status.removed')}` : ''] })] }), downloadSessionLog !== undefined && ((0, jsx_runtime_1.jsxs)("button", { type: "button", "data-mobile-nav": "status-export", disabled: sessionId === undefined, onClick: () => {
                    if (sessionId !== undefined)
                        downloadSessionLog(sessionId);
                }, children: [(0, jsx_runtime_1.jsx)(dsh_client_ui_primitives_1.IconDownloadOutline16, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: t('status.exportLog') })] })), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-card", children: [(0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.turns') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: s.turns })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.steps') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: s.steps })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.llmTime') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: formatDuration(s.llmMs) })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.toolTime') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: formatDuration(s.toolMs) })] })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-card", children: [(0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.ttft') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: s.ttftSteps > 0 ? formatDuration(s.ttftMs / s.ttftSteps) : '—' })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.throughput') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: s.decodeMs > 0 ? `${formatTokensPerSecond(s.decodeTokens / (s.decodeMs / 1e3))} tok/s` : '—' })] })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-card", "data-usage": "1", children: [(0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.cacheHit') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: cacheHit !== null ? `${cacheHit.toFixed(2)}%` : '—' })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.inputTokens') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: showUsage ? formatTokens(billedInputTokens(usage)) : '—' })] }), (0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "status-cell", children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-label", children: t('status.outputTokens') }), (0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "cell-value", children: showUsage ? formatTokens(usage.outputTokens) : '—' })] })] }), transient.length > 0 && ((0, jsx_runtime_1.jsx)("dl", { "data-mobile-nav": "status-list", children: transient.map((row) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("dt", { children: row.label }), (0, jsx_runtime_1.jsx)("dd", { children: row.value })] }, row.label))) })), lastAgentError !== null && ((0, jsx_runtime_1.jsx)("div", { "data-mobile-nav": "status-error", children: lastAgentError })), (0, jsx_runtime_1.jsx)(JobsSection, { useSessions: useSessions, sessionId: sessionId, t: t })] }));
}
};
__modules["MarketplaceView.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceView = MarketplaceView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const CATALOG_URL = '/api/mobile-nav/marketplace';
const README_URL = '/api/mobile-nav/marketplace/readme';
const README_FILE_URL = '/api/mobile-nav/marketplace/readme-file';
const INSTALL_URL = '/api/mobile-nav/marketplace/install';
const TRANSLATE_URL = '/api/mobile-nav/marketplace/translate';
const UPDATED_URL = '/api/mobile-nav/marketplace/updated';
const TRANSLATE_MT_URL = '/api/mobile-nav/marketplace/translate-mt';
const BATCH = 24;
function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls !== undefined && cls !== '')
        node.className = cls;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
/** Parse a JSON response without throwing on SPA HTML / empty / 403 pages. */
async function readJson(res) {
    const type = res.headers.get('content-type') ?? '';
    const text = await res.text();
    if (text === '' || text.startsWith('<') || !/json/i.test(type) && !text.startsWith('{') && !text.startsWith('[')) {
        return null;
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
function iconHtml(name) {
    const paths = {
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
    };
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ''}</svg>`;
}
function iconEl(name, cls = '') {
    const span = document.createElement('span');
    if (cls !== '')
        span.className = cls;
    span.innerHTML = iconHtml(name);
    return span;
}
function initialAvatar(name, cls = 'mkt-avatar-fallback') {
    const d = el('span', cls);
    d.textContent = (name[0] ?? '?').toUpperCase();
    const palette = ['#5b8def', '#8f6ee8', '#e86e9f', '#e89a5b', '#5bc6c6', '#7fc76a', '#e0a83e', '#c68ee8'];
    let h = 0;
    for (let i = 0; i < name.length; i++)
        h = (h * 31 + name.charCodeAt(i)) >>> 0;
    d.style.background = palette[h % palette.length] ?? '#5b8def';
    return d;
}
function formatStars(n) {
    if (n >= 1e6)
        return `${Math.round((n / 1e6) * 10) / 10}M`;
    if (n >= 1e3)
        return `${Math.round((n / 1e3) * 10) / 10}K`;
    return String(n);
}
/** Format an ISO / date string. Every card badge always carries the time
 * portion (`YYYY-MM-DD HH:mm`): a bare catalog date renders as `00:00` until
 * the real GitHub pushed_at arrives and replaces it. */
function formatUpdated(raw) {
    const value = (raw ?? '').trim();
    if (value === '')
        return '';
    const ms = Date.parse(value.includes('T') || value.includes(' ') ? value : `${value}T00:00:00`);
    if (Number.isNaN(ms))
        return value;
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hasTime = /[T ]\d{2}:\d{2}/.test(value);
    if (!hasTime)
        return `${datePart} 00:00`;
    return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const zhUI = () => (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('zh');
/** Full and compact time labels: `YYYY-MM-DD HH:mm` and `MM-DD HH:mm`. The
 * compact one is shown on narrow cards via a media query. */
function timeSpans(value) {
    const short = formatUpdated(value);
    const fullMatch = /^(\d{4}-)(.*)$/.exec(short);
    const full = fullMatch !== null ? `${fullMatch[1]}${fullMatch[2] ?? ''}` : short;
    const compact = fullMatch !== null ? (fullMatch[2] ?? short) : short;
    const fullSpan = el('span', 'mkt-time-full', full);
    const shortSpan = el('span', 'mkt-time-short', compact);
    return [fullSpan, shortSpan];
}
function decodeEntities(s) {
    return s
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function parseRepo(url) {
    try {
        const parts = new URL(url).pathname.split('/').filter(Boolean);
        return { owner: parts[0] ?? '', repo: parts[1] ?? '' };
    }
    catch {
        return { owner: '', repo: '' };
    }
}
/** The real GitHub repo key (`owner/repo`) for a catalog entry. Monorepo
 * entries whose `name` embeds a `#subpath` still key on the repository. */
function repoKeyOf(plugin) {
    const p = parseRepo(plugin.url);
    const owner = p.owner || plugin.owner || '';
    const fallback = plugin.name.includes('#') ? (plugin.name.split('#')[0] ?? plugin.name) : plugin.name;
    const repo = p.repo || fallback;
    return `${owner}/${repo}`;
}
/** A short display name: the last path segment of the repo/subpath. */
function shortName(plugin) {
    const raw = plugin.name || '';
    const base = raw.includes('#') ? (raw.split('#').pop() ?? raw) : raw;
    const segs = base.split('/').filter(Boolean);
    return segs.length > 0 ? (segs[segs.length - 1] ?? base) : base;
}
/** Resolve an in-README link that points at a markdown file of the same repo
 * (language switchers like `[中文](README_CN.md)`) to a repo-relative path.
 * Returns null for external links / non-markdown — those keep opening in a new
 * tab. */
function resolveReadmePath(href) {
    const h = href.trim();
    if (h === '' || h.startsWith('#') || h.startsWith('//'))
        return null;
    if (!/\.(md|markdown|mdx)([?#]|$)/i.test(h))
        return null;
    // same-repo raw / blob URLs
    const rawMatch = /^https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+\.(?:md|markdown|mdx))(?:[?#]|$)/i.exec(h);
    if (rawMatch !== null)
        return rawMatch[1] ?? null;
    const blobMatch = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/(.+\.(?:md|markdown|mdx))(?:[?#]|$)/i.exec(h);
    if (blobMatch !== null)
        return blobMatch[1] ?? null;
    // other absolute URLs (http/https/mailto/…) — external, keep default behavior
    if (/^[a-z][a-z0-9+.-]*:/i.test(h))
        return null;
    const path = h.split('#')[0] ?? '';
    const withoutQuery = path.split('?')[0] ?? '';
    const segs = withoutQuery
        .replace(/^\.\//, '')
        .replace(/^\/+/, '')
        .split('/')
        .filter((seg) => seg !== '' && seg !== '.' && seg !== '..');
    return segs.length > 0 ? segs.join('/') : null;
}
/* ---------- README rendering ----------
 * The registry serves raw markdown (some entries are HTML documents, and most
 * markdown files embed HTML badge blocks and GFM tables). Everything is
 * converted to safe HTML here — raw text is always escaped first, so no tag
 * from a README can ever reach the DOM as markup.
 */
function cleanInline(s) {
    return String(s).replace(/<[^>]+>/g, '').trim();
}
/** Convert HTML fragments inside a README into plain markdown so the markdown
 * pass below never paints raw tags. Runs on every README. */
function preprocessHtml(src) {
    let s = src;
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
    s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
    // bare autolinks in angle brackets survive the final tag-strip
    s = s.replace(/<((?:https?|ftp):\/\/[^>\s]+)>/g, (_m, url) => `[${url}](${url})`);
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<hr\s*\/?>/gi, '\n---\n');
    s = s.replace(/<\/(p|div|h[1-6]|tr|section|article|blockquote|li|ul|ol|table|thead|tbody|details|summary|pre)>/gi, '\n');
    s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, n, body) => `\n${'#'.repeat(Number(n))} ${cleanInline(body)}\n`);
    s = s.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\balt=["']([^"']*)["'][^>]*>/gi, (_m, src, alt) => `![${alt}](${src})`);
    s = s.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, (_m, src) => `![](${src})`);
    s = s.replace(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, body) => `[${cleanInline(body)}](${href})`);
    s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, body) => `\`${cleanInline(body)}\``);
    s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, body) => `**${cleanInline(body)}**`);
    s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, body) => `*${cleanInline(body)}*`);
    s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, body) => `\n\`\`\`\n${decodeEntities(cleanInline(body))}\n\`\`\`\n`);
    s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, body) => `- ${cleanInline(body)}\n`);
    s = s.replace(/<[^>]+>/g, '');
    return decodeEntities(s);
}
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escHtml(s).replace(/"/g, '&quot;');
/** Inline markdown → HTML. Text is escaped first; code spans are parked in
 * placeholders so `*`/`_` inside them are never mangled by emphasis rules. */
function inlineMd(s) {
    const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const codes = [];
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, (_m, body) => {
        codes.push(`<code>${body}</code>`);
        return `\u0000${codes.length - 1}\u0000`;
    });
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_m, alt, src, title) => `<img alt="${escAttr(alt ?? '')}" src="${escAttr(src)}" loading="lazy"${title !== undefined ? ` title="${escAttr(title)}"` : ''}>`);
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_m, label, href, title) => `<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer"${title !== undefined ? ` title="${escAttr(title)}"` : ''}>${label}</a>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/(^|[\s(])_([^_]+)_([\s).,;!?]|$)/g, '$1<em>$2</em>$3');
    t = t.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[Number(i)] ?? '');
    return t;
}
/** Minimal GFM markdown → HTML: headings, fenced code, blockquotes, tables,
 * nested lists, task lists, hr, paragraphs and inline formatting. */
function renderMarkdown(raw) {
    const text = preprocessHtml(raw);
    const split = text.replace(/\r\n/g, '\n').split('\n');
    // Merge soft continuations of a list item ("- item\n  continued text") into
    // the item line so they do not break the list.
    const lines = [];
    for (const rawLine of split) {
        const prev = lines[lines.length - 1];
        if (prev !== undefined &&
            /^\s*([-*+]|\d+[.)])\s+/.test(prev) &&
            /^\s+\S/.test(rawLine) &&
            !/^\s*([-*+]|\d+[.)])\s+/.test(rawLine)) {
            lines[lines.length - 1] = `${prev} ${rawLine.trim()}`;
        }
        else {
            lines.push(rawLine);
        }
    }
    const out = [];
    const inline = (s) => inlineMd(s);
    const stack = [];
    const closeAllLists = () => {
        while (stack.length > 0)
            out.push(`</${stack.pop()?.type ?? 'ul'}>`);
    };
    const closeListsDeeperThan = (indent) => {
        while (stack.length > 0 && (stack[stack.length - 1]?.indent ?? 0) > indent) {
            out.push(`</${stack.pop()?.type ?? 'ul'}>`);
        }
    };
    let para = [];
    const flushPara = () => {
        if (para.length > 0) {
            out.push(`<p>${inline(para.join(' '))}</p>`);
            para = [];
        }
    };
    const indentOf = (line) => {
        let n = 0;
        for (const ch of line) {
            if (ch === ' ')
                n += 1;
            else if (ch === '\t')
                n += 2;
            else
                break;
        }
        return n;
    };
    let i = 0;
    while (i < lines.length) {
        const rawLine = lines[i] ?? '';
        const line = rawLine.trimEnd();
        const trimmed = line.trim();
        // fenced code block
        if (/^(```|~~~)/.test(trimmed)) {
            flushPara();
            closeAllLists();
            const lang = trimmed.slice(3).trim();
            out.push(`<pre><code${lang !== '' ? ` class="language-${escAttr(lang)}"` : ''}>`);
            i++;
            while (i < lines.length && !/^(```|~~~)/.test((lines[i] ?? '').trim())) {
                out.push(`${escHtml(lines[i] ?? '')}\n`);
                i++;
            }
            out.push('</code></pre>');
            i++;
            continue;
        }
        if (trimmed === '') {
            flushPara();
            closeAllLists();
            i++;
            continue;
        }
        // horizontal rule
        if (/^([-*_])\s*\1\s*\1+$/.test(trimmed)) {
            flushPara();
            closeAllLists();
            out.push('<hr>');
            i++;
            continue;
        }
        // heading
        const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
        if (heading !== null) {
            flushPara();
            closeAllLists();
            const level = (heading[1] ?? '#').length;
            out.push(`<h${level}>${inline(heading[2] ?? '')}</h${level}>`);
            i++;
            continue;
        }
        // blockquote (multi-line)
        if (/^>/.test(trimmed)) {
            flushPara();
            closeAllLists();
            const qlines = [];
            while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) {
                qlines.push((lines[i] ?? '').replace(/^>\s?/, ''));
                i++;
            }
            out.push(`<blockquote>${inline(qlines.join(' '))}</blockquote>`);
            continue;
        }
        // GFM table: a row followed by a `| --- | --- |` separator line
        if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+-?\s*\|?\s*$/.test(lines[i + 1] ?? '')) {
            flushPara();
            closeAllLists();
            const header = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
            i += 2;
            const rows = [];
            while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i] ?? '')) {
                rows.push((lines[i] ?? '').replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()));
                i++;
            }
            let html = '<div class="mkt-table-wrap"><table><thead><tr>';
            for (const cell of header)
                html += `<th>${inline(cell)}</th>`;
            html += '</tr></thead><tbody>';
            for (const row of rows) {
                html += '<tr>';
                for (let ci = 0; ci < header.length; ci++)
                    html += `<td>${inline(row[ci] ?? '')}</td>`;
                html += '</tr>';
            }
            html += '</tbody></table></div>';
            out.push(html);
            continue;
        }
        // lists (ul/ol, nested by indentation, task lists)
        const listMatch = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
        if (listMatch !== null) {
            const indent = indentOf(line);
            const marker = listMatch[2] ?? '';
            const content = listMatch[3] ?? '';
            const task = /^\[([ xX])\]\s+/.exec(content);
            flushPara();
            closeListsDeeperThan(indent);
            const top = stack[stack.length - 1];
            const type = /^\d+[.)]/.test(marker) ? 'ol' : 'ul';
            if (top === undefined || top.indent < indent) {
                stack.push({ type, indent });
                out.push(`<${type}>`);
            }
            else if (top.type !== type) {
                out.push(`</${top.type}>`);
                stack.pop();
                stack.push({ type, indent });
                out.push(`<${type}>`);
            }
            if (task !== null) {
                const done = task[1] === 'x' || task[1] === 'X';
                const body = content.slice(task[0].length);
                out.push(`<li class="mkt-task${done ? ' mkt-task-done' : ''}"><input type="checkbox" disabled${done ? ' checked' : ''}> ${inline(body)}</li>`);
            }
            else {
                out.push(`<li>${inline(content)}</li>`);
            }
            i++;
            continue;
        }
        // paragraph
        closeAllLists();
        para.push(line);
        i++;
    }
    flushPara();
    closeAllLists();
    return out.join('\n');
}
function enter(card, index) {
    card.style.animationDelay = `${Math.min(index, 10) * 24}ms`;
    card.classList.add('mkt-enter');
}
function haystackOf(plugin) {
    const desc = plugin.description;
    return `${plugin.name} ${plugin.owner} ${plugin.url} ${desc.zh ?? ''} ${desc.en ?? ''}`.toLowerCase();
}
function MarketplaceView() {
    const hostRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const host = hostRef.current;
        if (host === null)
            return;
        let catalog = null;
        let activeCategory = 'all';
        let sortMode = 'updated';
        let sortDir = -1; // -1: descending (倒序), the default for every mode
        let query = '';
        let rendered = 0;
        let filtered = [];
        let toastTimer = 0;
        let searchTimer = 0;
        const haystacks = new WeakMap();
        const fetchedUpdated = new Set();
        const pendingUpdated = new Set();
        const page = el('div', 'mkt-page');
        const toolbar = el('div', 'mkt-toolbar');
        const searchWrap = el('div', 'mkt-search');
        searchWrap.append(iconEl('search', 'mkt-search-ic'));
        const search = el('input', 'mkt-search-input');
        search.type = 'search';
        search.placeholder = '搜索作者、插件名或简介';
        search.autocomplete = 'off';
        search.spellcheck = false;
        searchWrap.append(search);
        const zh = zhUI();
        const row = el('div', 'mkt-row');
        const catWrap = el('div', 'mkt-cat-wrap');
        const catBtn = el('button', 'mkt-cat');
        catBtn.type = 'button';
        catBtn.setAttribute('aria-haspopup', 'listbox');
        catBtn.setAttribute('aria-expanded', 'false');
        catWrap.append(catBtn, iconEl('chevron', 'mkt-cat-chevron'));
        const catMenu = el('div', 'mkt-cat-menu');
        catMenu.setAttribute('role', 'listbox');
        catWrap.append(catMenu);
        const closeCatMenu = () => {
            catMenu.classList.remove('mkt-cat-open');
            catBtn.setAttribute('aria-expanded', 'false');
        };
        catBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const open = catMenu.classList.toggle('mkt-cat-open');
            catBtn.setAttribute('aria-expanded', String(open));
        });
        const onCatDocClick = (event) => {
            if (!catWrap.contains(event.target))
                closeCatMenu();
        };
        const onCatKey = (event) => {
            if (event.key === 'Escape')
                closeCatMenu();
        };
        document.addEventListener('click', onCatDocClick);
        document.addEventListener('keydown', onCatKey);
        const SORT_OPTS = [
            { mode: 'updated', label: zh ? '更新时间' : 'Updated', icon: 'clock' },
            { mode: 'stars', label: 'Star', icon: 'star' },
        ];
        const sortGroup = el('div', 'mkt-sort-group');
        const sortBtns = new Map();
        const paintSort = () => {
            for (const opt of SORT_OPTS) {
                const btn = sortBtns.get(opt.mode);
                if (btn === undefined)
                    continue;
                const active = sortMode === opt.mode;
                btn.classList.toggle('mkt-sort-active', active);
                btn.replaceChildren(iconEl(opt.icon, `mkt-ic${opt.icon === 'star' ? ' mkt-ic-star' : ''}`), document.createTextNode(` ${opt.label}`), iconEl(sortDir === -1 ? 'arrow-down' : 'arrow-up', 'mkt-ic mkt-ic-dir'));
                btn.title = active
                    ? sortDir === -1
                        ? `当前：按${opt.label}倒序，点击改为升序`
                        : `当前：按${opt.label}升序，点击改为倒序`
                    : `按${opt.label}倒序排列`;
            }
        };
        for (const opt of SORT_OPTS) {
            const btn = el('button', 'mkt-sort-btn');
            btn.type = 'button';
            btn.dataset.sort = opt.mode;
            btn.addEventListener('click', () => {
                if (sortMode === opt.mode) {
                    sortDir = sortDir === -1 ? 1 : -1;
                }
                else {
                    sortMode = opt.mode;
                    sortDir = -1;
                }
                paintSort();
                recompute();
                renderGrid();
            });
            sortBtns.set(opt.mode, btn);
            sortGroup.append(btn);
        }
        paintSort();
        row.append(catWrap, sortGroup);
        const meta = el('div', 'mkt-meta', '');
        const grid = el('div', 'mkt-list');
        const sentinel = el('div', 'mkt-sentinel', '加载中…');
        const empty = el('div', 'mkt-empty', '没有匹配的插件');
        const toast = el('div', 'mkt-toast');
        toolbar.append(searchWrap, row, meta);
        page.append(toolbar, grid, sentinel, toast);
        host.append(page);
        const showToast = (text, isErr = false) => {
            toast.textContent = text;
            toast.classList.toggle('mkt-toast-err', isErr);
            toast.classList.add('mkt-toast-on');
            window.clearTimeout(toastTimer);
            toastTimer = window.setTimeout(() => toast.classList.remove('mkt-toast-on'), 3200);
        };
        const categoryLabel = (id) => {
            const cat = catalog?.categories[id];
            if (cat === undefined)
                return id;
            return zhUI() ? (cat.zh ?? cat.en ?? id) : (cat.en ?? cat.zh ?? id);
        };
        const recompute = () => {
            const plugins = catalog?.plugins ?? [];
            const q = query.trim().toLowerCase();
            filtered = plugins.filter((p) => {
                if (activeCategory !== 'all' && p.category !== activeCategory)
                    return false;
                if (q === '')
                    return true;
                return (haystacks.get(p) ?? haystackOf(p)).includes(q);
            });
            const dirMul = sortDir === -1 ? 1 : -1;
            if (sortMode === 'stars') {
                filtered = [...filtered].sort((a, b) => (b.stars - a.stars) * dirMul);
            }
            else {
                filtered = [...filtered].sort((a, b) => {
                    const ta = Date.parse(a.updatedAt || a.added || '') || 0;
                    const tb = Date.parse(b.updatedAt || b.added || '') || 0;
                    return (tb - ta) * dirMul;
                });
            }
        };
        const timeOf = (plugin) => formatUpdated(plugin.updatedAt || plugin.added);
        const buildCategories = () => {
            catMenu.replaceChildren();
            const add = (id, label) => {
                const item = el('button', 'mkt-cat-opt');
                item.type = 'button';
                item.setAttribute('role', 'option');
                item.dataset.cat = id;
                item.textContent = label;
                item.addEventListener('click', () => {
                    activeCategory = id;
                    catBtn.textContent = label;
                    closeCatMenu();
                    recompute();
                    renderGrid();
                });
                catMenu.append(item);
            };
            add('all', zh ? '全部分类' : 'All categories');
            const catIds = Object.keys(catalog?.categories ?? {});
            for (const id of catIds)
                add(id, categoryLabel(id));
            const activeLabel = activeCategory === 'all' ? (zh ? '全部分类' : 'All categories') : categoryLabel(activeCategory);
            catBtn.textContent = activeLabel;
            for (const item of catMenu.querySelectorAll('.mkt-cat-opt')) {
                item.classList.toggle('mkt-cat-opt-active', item.dataset.cat === activeCategory);
            }
        };
        const buildCard = (plugin, index) => {
            const card = el('article', 'mkt-card');
            card.dataset.repo = repoKeyOf(plugin);
            const descZh = plugin.description.zh;
            const descEn = plugin.description.en;
            const showEn = !zhUI() || descZh === undefined || descZh === '';
            const descText = showEn ? (descEn ?? descZh ?? '') : (descZh ?? descEn ?? '');
            const top = el('div', 'mkt-card-top');
            const name = el('h4', 'mkt-name', shortName(plugin));
            const time = el('time', 'mkt-time');
            time.dateTime = plugin.updatedAt || plugin.added || '';
            time.append(iconEl('clock', 'mkt-ic mkt-ic-time'), ...timeSpans(timeOf(plugin)));
            top.append(name, time);
            const byline = el('div', 'mkt-byline', `${plugin.owner}  ·  ${categoryLabel(plugin.category)}`);
            const desc = el('p', 'mkt-desc', descText);
            const foot = el('div', 'mkt-foot');
            const stars = el('span', 'mkt-stars');
            stars.append(iconEl('star', 'mkt-ic mkt-ic-star'), document.createTextNode(` ${formatStars(plugin.stars)}`));
            stars.title = `${plugin.stars} stars`;
            const actions = el('div', 'mkt-actions');
            if (showEn && descText !== '') {
                const translateBtn = el('button', 'mkt-btn mkt-translate', '翻译');
                translateBtn.type = 'button';
                translateBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    void translateDescription(desc, translateBtn);
                });
                actions.append(translateBtn);
            }
            const installBtn = el('button', 'mkt-btn mkt-install', '安装');
            installBtn.type = 'button';
            // Check if already installed (npm name, bundle name, or github: repo spec)
            const npmName = (plugin.install ?? '').replace(/^dsh\s+plugin(?:\s+--profile\s+\S+)?\s+add\s+/, '').trim();
            const repoKey = repoKeyOf(plugin);
            const isInstalled = (catalog?.installed ?? []).some((name) => name === npmName || name === plugin.name || name === shortName(plugin))
                || (catalog?.installedSpecs ?? []).some((spec) => spec.toLowerCase().includes(`github:${repoKey.toLowerCase()}`));
            if (isInstalled) {
                installBtn.textContent = '';
                installBtn.append(iconEl('check', 'mkt-ic'), document.createTextNode(' 已安装'));
                installBtn.classList.add('mkt-installed');
                installBtn.disabled = true;
            }
            installBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                void installPlugin(plugin, installBtn);
            });
            actions.append(installBtn);
            foot.append(stars, actions);
            card.append(top, byline, desc, foot);
            card.addEventListener('click', () => openRepo(plugin));
            enter(card, index);
            return card;
        };
        const translateDescription = async (descEl, btn) => {
            const text = (descEl.textContent ?? '').trim();
            if (text === '')
                return;
            btn.disabled = true;
            btn.textContent = '翻译中…';
            try {
                const res = await fetch(TRANSLATE_URL, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ text }),
                });
                const payload = await readJson(res);
                if (payload?.ok === true && payload.translation !== undefined && payload.translation !== '') {
                    descEl.textContent = payload.translation;
                    descEl.classList.add('mkt-desc-translated');
                    btn.textContent = '已翻译';
                    btn.disabled = true;
                }
                else {
                    showToast(payload?.error ?? '翻译失败', true);
                    btn.textContent = '翻译';
                    btn.disabled = false;
                }
            }
            catch {
                showToast('翻译请求失败', true);
                btn.textContent = '翻译';
                btn.disabled = false;
            }
        };
        const installPlugin = async (plugin, btn) => {
            if (btn.dataset.state === 'busy')
                return;
            btn.dataset.state = 'busy';
            btn.disabled = true;
            const original = btn.textContent ?? '安装';
            btn.textContent = '安装中…';
            btn.classList.add('mkt-busy');
            try {
                const spec = (plugin.install ?? '').trim();
                const target = spec !== ''
                    ? spec.replace(/^dsh\s+plugin(?:\s+--profile\s+\S+)?\s+add\s+/, '').trim()
                    : `github:${plugin.owner}/${shortName(plugin)}`;
                const res = await fetch(INSTALL_URL, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ target }),
                });
                const payload = await readJson(res);
                if (payload?.ok === true) {
                    btn.textContent = '';
                    btn.append(iconEl('check', 'mkt-ic'), document.createTextNode(' 已安装'));
                    btn.classList.add('mkt-installed');
                    btn.classList.remove('mkt-busy');
                    if (payload.hotLoaded === true && payload.hotName !== undefined && payload.hotName !== '') {
                        showToast(payload.persistFailed === true
                            ? `安装完成，${payload.hotName} 已热加载生效（缺少 dsh.bundle 元数据，重启后需重新安装）`
                            : `安装完成，${payload.hotName} 已热加载生效`);
                    }
                    else if (payload.hotLoaded === true) {
                        showToast('安装完成，插件已热加载生效');
                    }
                    else if (payload.hotLoadError !== undefined && payload.hotLoadError !== '') {
                        const brief = payload.hotLoadError.length > 54 ? `${payload.hotLoadError.slice(0, 54)}…` : payload.hotLoadError;
                        showToast(`已安装，但热加载失败（${brief}），重启 DSH 后生效`);
                    }
                    else {
                        showToast('安装完成，重启 DSH 后生效（Ctrl+C 停止后重新运行 dsh web）');
                    }
                }
                else {
                    btn.textContent = '安装';
                    btn.classList.remove('mkt-busy');
                    showToast(payload?.error ?? '安装失败', true);
                }
            }
            catch {
                btn.textContent = original;
                btn.classList.remove('mkt-busy');
                showToast('安装请求失败', true);
            }
            finally {
                btn.dataset.state = '';
            }
        };
        let modal = null;
        const closeModal = () => {
            if (modal === null)
                return;
            const wrap = modal.querySelector('.mkt-win-wrap');
            const backdrop = modal.querySelector('.mkt-backdrop');
            backdrop?.classList.add('mkt-backdrop-out');
            wrap?.classList.add('mkt-window-out');
            document.removeEventListener('keydown', onModalKey);
            window.setTimeout(() => {
                modal?.remove();
                modal = null;
            }, 200);
        };
        const openRepo = (plugin) => {
            if (modal !== null)
                return;
            const repo = parseRepo(plugin.url);
            const owner = repo.owner || plugin.owner;
            const modalRoot = el('div', 'mkt-modal');
            modal = modalRoot;
            const backdrop = el('div', 'mkt-backdrop');
            const wrap = el('div', 'mkt-win-wrap');
            const closeBtn = el('button', 'mkt-close');
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', '关闭');
            closeBtn.append(iconEl('x', 'mkt-ic'));
            closeBtn.addEventListener('click', closeModal);
            const win = el('section', 'mkt-window');
            const head = el('div', 'mkt-win-head');
            const ident = el('div', 'mkt-win-ident');
            const avatar = el('img', 'mkt-win-avatar');
            avatar.src = `https://github.com/${owner}.png?size=80`;
            avatar.alt = '';
            avatar.referrerPolicy = 'no-referrer';
            avatar.addEventListener('error', () => {
                if (avatar.isConnected)
                    avatar.replaceWith(initialAvatar(owner, 'mkt-win-avatar-fallback'));
            });
            const crumb = el('div', 'mkt-win-crumb');
            const ownerLink = el('a', 'mkt-win-owner', owner);
            ownerLink.href = `https://github.com/${owner}`;
            ownerLink.target = '_blank';
            ownerLink.rel = 'noopener noreferrer';
            ownerLink.addEventListener('click', (event) => event.stopPropagation());
            const slash = el('span', 'mkt-win-slash', ' / ');
            const repoLink = el('a', 'mkt-win-repo', shortName(plugin));
            repoLink.href = plugin.url;
            repoLink.target = '_blank';
            repoLink.rel = 'noopener noreferrer';
            repoLink.addEventListener('click', (event) => event.stopPropagation());
            crumb.append(ownerLink, slash, repoLink);
            const info = el('div', 'mkt-win-info', `★ ${formatStars(plugin.stars)}  ·  更新于 ${timeOf(plugin)}  ·  ${categoryLabel(plugin.category)}`);
            ident.append(avatar, (() => {
                const col = el('div', 'mkt-win-meta');
                col.append(crumb, info);
                return col;
            })());
            const gh = el('a', 'mkt-win-link');
            gh.href = plugin.url;
            gh.target = '_blank';
            gh.rel = 'noopener noreferrer';
            gh.append(iconEl('external', 'mkt-ic mkt-ic-link'), document.createTextNode(' GitHub'));
            head.append(ident, gh);
            const filebar = el('div', 'mkt-win-filebar');
            const filebarLabel = el('span', 'mkt-win-file', 'README.md');
            const translateMd = el('button', 'mkt-btn mkt-translate-md', '翻译');
            translateMd.type = 'button';
            translateMd.disabled = true;
            translateMd.title = '机翻为简体中文';
            filebar.append(filebarLabel, translateMd);
            const body = el('div', 'mkt-win-body');
            body.innerHTML = '<div class="mkt-win-loading">加载 README…</div>';
            win.append(head, filebar, body);
            wrap.append(closeBtn, win);
            modalRoot.append(backdrop, wrap);
            document.body.appendChild(modalRoot);
            backdrop.addEventListener('click', closeModal);
            document.addEventListener('keydown', onModalKey);
            let readmeText = '';
            const repoName = repo.repo || shortName(plugin);
            const renderReadme = (text, label, translated = false) => {
                readmeText = text;
                body.innerHTML = `<article class="mkt-readme markdown-body${translated ? ' mkt-readme-translated' : ''}">${renderMarkdown(text)}</article>`;
                filebarLabel.textContent = label;
                translateMd.disabled = false;
                translateMd.hidden = /[\u3400-\u9fff]/.test(text);
                if (translated) {
                    translateMd.textContent = '已翻译';
                    translateMd.disabled = true;
                }
                else {
                    translateMd.textContent = '翻译';
                }
            };
            const loadReadmeFile = async (path) => {
                body.innerHTML = '<div class="mkt-win-loading">加载文档…</div>';
                try {
                    const res = await fetch(`${README_FILE_URL}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repoName)}&path=${encodeURIComponent(path)}`);
                    const payload = await readJson(res);
                    if (payload?.ok === true && payload.readme !== undefined) {
                        renderReadme(payload.readme, payload.path ?? path);
                    }
                    else {
                        body.innerHTML = `<div class="mkt-win-error">${payload?.error ?? '无法加载文档'}</div>`;
                    }
                }
                catch {
                    body.innerHTML = '<div class="mkt-win-error">无法加载文档</div>';
                }
            };
            // In-place navigation: an in-README link to a markdown file of the same
            // repo (language switcher e.g. `[中文](README_CN.md)`) loads it right
            // here instead of opening a new browser tab.
            body.addEventListener('click', (event) => {
                const target = event.target;
                if (target === null)
                    return;
                const anchor = target.closest('a');
                if (anchor === null)
                    return;
                const path = resolveReadmePath(anchor.getAttribute('href') ?? '');
                if (path === null)
                    return;
                event.preventDefault();
                void loadReadmeFile(path);
            });
            translateMd.addEventListener('click', () => {
                if (translateMd.dataset.state === 'busy')
                    return;
                const text = readmeText.trim();
                if (text === '')
                    return;
                translateMd.dataset.state = 'busy';
                translateMd.disabled = true;
                const original = translateMd.textContent ?? '翻译';
                translateMd.textContent = '翻译中…';
                void (async () => {
                    try {
                        const res = await fetch(TRANSLATE_MT_URL, {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ text }),
                        });
                        const payload = await readJson(res);
                        if (payload?.ok === true && payload.translation !== undefined && payload.translation !== '') {
                            renderReadme(payload.translation, filebarLabel.textContent ?? 'README.md', true);
                        }
                        else {
                            showToast(payload?.error ?? '翻译失败', true);
                            translateMd.textContent = original;
                            translateMd.disabled = false;
                        }
                    }
                    catch {
                        showToast('翻译请求失败', true);
                        translateMd.textContent = original;
                        translateMd.disabled = false;
                    }
                    finally {
                        translateMd.dataset.state = '';
                    }
                })();
            });
            void (async () => {
                try {
                    const res = await fetch(`${README_URL}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repoName)}`);
                    const payload = await readJson(res);
                    if (payload?.ok === true && payload.readme !== undefined) {
                        const label = (payload.url ?? '').split('/').filter(Boolean).pop() || 'README.md';
                        renderReadme(payload.readme, label);
                    }
                    else {
                        body.innerHTML = `<div class="mkt-win-error">${payload?.error ?? '无法加载 README'}</div>`;
                    }
                }
                catch {
                    body.innerHTML = '<div class="mkt-win-error">无法加载 README</div>';
                }
            })();
            requestAnimationFrame(() => {
                backdrop.classList.add('mkt-backdrop-in');
                wrap.classList.add('mkt-window-in');
            });
        };
        const onModalKey = (event) => {
            if (event.key === 'Escape')
                closeModal();
        };
        const renderGrid = () => {
            grid.replaceChildren();
            rendered = 0;
            if (filtered.length === 0) {
                grid.append(empty);
                sentinel.hidden = true;
                meta.textContent = '共 0 个插件';
                return;
            }
            appendMore();
            meta.textContent = `共 ${filtered.length} 个插件`;
        };
        const appendMore = () => {
            const next = filtered.slice(rendered, rendered + BATCH);
            const frag = document.createDocumentFragment();
            next.forEach((plugin, index) => {
                frag.append(buildCard(plugin, rendered + index));
            });
            grid.append(frag);
            rendered += next.length;
            sentinel.hidden = filtered.length <= rendered;
            sentinel.textContent = rendered >= filtered.length ? '' : '加载更多…';
            requestUpdated(reposVisible());
        };
        const reposVisible = () => {
            const out = [];
            for (const card of grid.querySelectorAll('.mkt-card')) {
                const key = card.dataset.repo;
                if (key !== undefined && key !== '')
                    out.push(key);
            }
            return out;
        };
        const applyUpdatedMap = (map) => {
            if (catalog === null)
                return;
            let changed = false;
            for (const plugin of catalog.plugins) {
                const key = repoKeyOf(plugin);
                const iso = map[key];
                if (iso !== undefined && iso !== '' && plugin.updatedAt !== iso) {
                    plugin.updatedAt = iso;
                    changed = true;
                }
            }
            if (!changed)
                return;
            for (const card of grid.querySelectorAll('.mkt-card')) {
                const key = card.dataset.repo;
                if (key === undefined)
                    continue;
                const iso = map[key];
                if (iso === undefined)
                    continue;
                const time = card.querySelector('.mkt-time');
                if (time !== null) {
                    time.replaceChildren(iconEl('clock', 'mkt-ic mkt-ic-time'), ...timeSpans(iso));
                    time.dateTime = iso;
                }
            }
            if (sortMode === 'updated') {
                recompute();
                renderGrid();
            }
        };
        const requestUpdated = (keys) => {
            const need = keys.filter((key) => !fetchedUpdated.has(key) && !pendingUpdated.has(key));
            if (need.length === 0)
                return;
            for (const key of need)
                pendingUpdated.add(key);
            void (async () => {
                try {
                    const res = await fetch(`${UPDATED_URL}?repos=${encodeURIComponent(need.join(','))}`);
                    const payload = await readJson(res);
                    if (payload?.ok === true && payload.updated !== undefined)
                        applyUpdatedMap(payload.updated);
                }
                catch {
                    // keep the catalog dates
                }
                finally {
                    for (const key of need) {
                        pendingUpdated.delete(key);
                        fetchedUpdated.add(key);
                    }
                }
            })();
        };
        search.addEventListener('input', () => {
            window.clearTimeout(searchTimer);
            searchTimer = window.setTimeout(() => {
                query = search.value;
                recompute();
                renderGrid();
            }, 120);
        });
        void (async () => {
            meta.textContent = '正在加载插件市场…';
            try {
                const res = await fetch(CATALOG_URL);
                const payload = await readJson(res);
                if (payload === null || payload.ok !== true || !Array.isArray(payload.plugins)) {
                    meta.textContent = payload?.error ?? '市场暂时不可用';
                    empty.textContent = '市场暂时不可用';
                    grid.append(empty);
                    return;
                }
                catalog = payload;
                for (const plugin of payload.plugins)
                    haystacks.set(plugin, haystackOf(plugin));
                buildCategories();
                recompute();
                renderGrid();
            }
            catch {
                meta.textContent = '市场加载失败，请检查网络';
                empty.textContent = '市场加载失败';
                grid.append(empty);
            }
        })();
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                if (rendered < filtered.length)
                    appendMore();
            }
        }, { rootMargin: '600px' });
        observer.observe(sentinel);
        return () => {
            observer.disconnect();
            document.removeEventListener('keydown', onModalKey);
            document.removeEventListener('click', onCatDocClick);
            document.removeEventListener('keydown', onCatKey);
            closeModal();
            window.clearTimeout(toastTimer);
            window.clearTimeout(searchTimer);
            host.textContent = '';
        };
    }, []);
    return (0, jsx_runtime_1.jsx)("div", { ref: hostRef });
}
};
__modules["GithubKeyView.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubKeyView = GithubKeyView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
/**
 * Settings → GitHub Token. Stores a classic/fine-grained PAT locally via
 * the plugin host (`~/.dsh/.credentials.yaml`, key `GITHUB_TOKEN`). The
 * value never leaves this device and is never echoed back by GET.
 */
const STATUS_URL = '/api/mobile-nav/github-token';
const SAVE_URL = '/api/mobile-nav/github-token';
function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls !== undefined && cls !== '')
        node.className = cls;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
async function readJson(res) {
    const text = await res.text();
    if (text === '' || text.startsWith('<'))
        return null;
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
function GithubKeyView() {
    const hostRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const host = hostRef.current;
        if (host === null)
            return;
        const zh = (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('zh');
        const page = el('div', 'ghk-page');
        const card = el('div', 'ghk-card');
        const title = el('div', 'ghk-title', zh ? 'GitHub Token' : 'GitHub Token');
        const desc = el('p', 'ghk-desc', zh
            ? '保存在本机 ~/.dsh/.credentials.yaml，用于 git push 和 GitHub API。不会写入插件仓库，也不会回显明文。需要 repo 权限。'
            : 'Stored locally in ~/.dsh/.credentials.yaml for git push and GitHub API. Never committed and never echoed back. Needs repo scope.');
        const status = el('div', 'ghk-status', zh ? '正在读取…' : 'Loading…');
        const input = el('input', 'ghk-input');
        input.type = 'password';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = zh ? '粘贴 ghp_… 或 github_pat_…' : 'Paste ghp_… or github_pat_…';
        const actions = el('div', 'ghk-actions');
        const saveBtn = el('button', 'ghk-save');
        saveBtn.type = 'button';
        saveBtn.textContent = zh ? '保存' : 'Save';
        const clearBtn = el('button', 'ghk-clear');
        clearBtn.type = 'button';
        clearBtn.textContent = zh ? '清除' : 'Clear';
        const hint = el('div', 'ghk-hint');
        actions.append(saveBtn, clearBtn);
        card.append(title, desc, status, input, actions, hint);
        page.append(card);
        host.append(page);
        const paintStatus = (configured, source) => {
            if (configured) {
                const src = source === 'file' ? (zh ? '本机凭据文件' : 'local credentials file') : (source ?? '');
                status.textContent = zh ? `已保存（${src}）` : `Saved (${src})`;
                status.dataset.state = 'on';
                input.placeholder = zh ? '已保存。输入新 token 可覆盖' : 'Saved. Paste a new token to replace';
            }
            else {
                status.textContent = zh ? '尚未保存' : 'Not saved';
                status.dataset.state = 'off';
            }
        };
        const setHint = (text, err = false) => {
            hint.textContent = text;
            hint.dataset.err = err ? '1' : '';
        };
        const refresh = async () => {
            try {
                const res = await fetch(STATUS_URL);
                const payload = await readJson(res);
                if (payload?.ok === true)
                    paintStatus(payload.configured === true, payload.source);
                else {
                    status.textContent = payload?.error ?? (zh ? '读取失败' : 'Failed to load');
                    status.dataset.state = 'off';
                }
            }
            catch {
                status.textContent = zh ? '读取失败' : 'Failed to load';
                status.dataset.state = 'off';
            }
        };
        const save = async (token) => {
            saveBtn.disabled = true;
            clearBtn.disabled = true;
            setHint(zh ? '正在保存…' : 'Saving…');
            try {
                const res = await fetch(SAVE_URL, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(token === null ? { clear: true } : { token }),
                });
                const payload = await readJson(res);
                if (payload?.ok === true) {
                    input.value = '';
                    paintStatus(payload.configured === true, payload.source);
                    setHint(token === null ? (zh ? '已清除' : 'Cleared') : (zh ? '已保存到本机' : 'Saved on this device'));
                }
                else {
                    setHint(payload?.error ?? (zh ? '保存失败' : 'Save failed'), true);
                }
            }
            catch {
                setHint(zh ? '保存请求失败' : 'Save request failed', true);
            }
            finally {
                saveBtn.disabled = false;
                clearBtn.disabled = false;
            }
        };
        saveBtn.addEventListener('click', () => {
            const token = input.value.trim();
            if (token === '') {
                setHint(zh ? '请先粘贴 token' : 'Paste a token first', true);
                return;
            }
            void save(token);
        });
        clearBtn.addEventListener('click', () => {
            void save(null);
        });
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter')
                saveBtn.click();
        });
        void refresh();
        return () => {
            host.textContent = '';
        };
    }, []);
    return (0, jsx_runtime_1.jsx)("div", { ref: hostRef });
}
};
__modules["attachmentStore.js"] = function (require, module, exports) {
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pendingAttachmentsOf = pendingAttachmentsOf;
exports.addAttachment = addAttachment;
exports.removeAttachment = removeAttachment;
exports.clearAttachments = clearAttachments;
exports.subscribeAttachments = subscribeAttachments;
const EMPTY = [];
const bySession = new Map();
const listeners = new Set();
function emit() {
    for (const listener of listeners)
        listener();
}
/** Current pending attachments for one session (stable reference while unchanged). */
function pendingAttachmentsOf(sessionId) {
    return bySession.get(sessionId) ?? EMPTY;
}
function addAttachment(sessionId, attachment) {
    const next = [...(bySession.get(sessionId) ?? []), attachment];
    bySession.set(sessionId, next);
    emit();
}
function removeAttachment(sessionId, id) {
    const current = bySession.get(sessionId);
    if (current === undefined)
        return;
    const next = current.filter((entry) => entry.id !== id);
    if (next.length === 0)
        bySession.delete(sessionId);
    else
        bySession.set(sessionId, next);
    emit();
}
/** Drop all pending attachments after a successful send. */
function clearAttachments(sessionId) {
    if (!bySession.delete(sessionId))
        return;
    emit();
}
function subscribeAttachments(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
};
__modules["fileText.js"] = function (require, module, exports) {
"use strict";
/**
 * Browser-side attachment text extraction. Only the formats the model can
 * actually read are supported: plain-text-ish files are read verbatim
 * (capped), .docx is deflated (DecompressionStream) and its XML runs are
 * unwrapped into paragraphs. Anything else is rejected at pick time by the
 * caller's accept filter; a failed parse yields an unreadable marker.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_FILE_CHARS = void 0;
exports.extensionOf = extensionOf;
exports.isCoreImageType = isCoreImageType;
exports.isSupportedFile = isSupportedFile;
exports.extractFileText = extractFileText;
/** Per-file character cap for the appended prompt text. */
exports.MAX_FILE_CHARS = 100_000;
/** Extensions treated as plain text (read verbatim). */
const TEXT_EXTS = new Set([
    'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'log', 'yaml', 'yml', 'xml',
    'html', 'htm', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'java', 'c',
    'cpp', 'h', 'hpp', 'go', 'rs', 'sh', 'bash', 'zsh', 'sql', 'ini', 'toml',
    'conf', 'cfg', 'env', 'css', 'scss', 'less', 'svg', 'properties',
]);
/** Lower-case extension without the dot ('' when none). */
function extensionOf(name) {
    const dot = name.lastIndexOf('.');
    if (dot <= 0 || dot === name.length - 1)
        return '';
    return name.slice(dot + 1).toLowerCase();
}
/** MIME types the core draft-image pipeline accepts. */
function isCoreImageType(mime) {
    return mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/gif';
}
/** A selectable non-image file? (text-ish or docx). */
function isSupportedFile(name) {
    const ext = extensionOf(name);
    return ext === 'docx' || TEXT_EXTS.has(ext);
}
function truncate(text, cap) {
    if (text.length <= cap)
        return { text, truncated: false };
    return { text: text.slice(0, cap), truncated: true };
}
async function readTextFile(file) {
    return truncate(await file.text(), exports.MAX_FILE_CHARS);
}
/** Minimal docx reader: central-directory scan + deflate-raw inflate + XML text runs. */
async function readDocx(file) {
    const buf = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    // End of central directory record: locate from the tail (signature 0x06054b50).
    let eocd = -1;
    const tail = Math.max(0, buf.length - 22 - 65536);
    for (let i = buf.length - 22; i >= tail; i--) {
        if (view.getUint32(i, true) === 0x06054b50) {
            eocd = i;
            break;
        }
    }
    if (eocd < 0)
        return { text: '', truncated: false };
    const count = view.getUint16(eocd + 10, true);
    const directory = view.getUint32(eocd + 16, true);
    let xml = null;
    for (let n = 0; n < count; n++) {
        const entry = directory + n * 46;
        if (view.getUint32(entry, true) !== 0x02014b50)
            break;
        const method = view.getUint16(entry + 10, true);
        const nameLength = view.getUint16(entry + 28, true);
        const localOffset = view.getUint32(entry + 42, true);
        const name = new TextDecoder().decode(buf.subarray(entry + 46, entry + 46 + nameLength));
        if (name !== 'word/document.xml')
            continue;
        const localNameLength = view.getUint16(localOffset + 26, true);
        const localExtraLength = view.getUint16(localOffset + 28, true);
        // Local file header: 18-21 = compressed size, 22-25 = uncompressed size.
        const compressedSize = view.getUint32(localOffset + 18, true);
        const start = localOffset + 30 + localNameLength + localExtraLength;
        const raw = buf.subarray(start, start + compressedSize);
        if (method === 0) {
            xml = raw;
        }
        else if (method === 8) {
            if (typeof DecompressionStream === 'undefined')
                return { text: '', truncated: false };
            const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            xml = new Uint8Array(await new Response(stream).arrayBuffer());
        }
        break;
    }
    if (xml === null)
        return { text: '', truncated: false };
    const decoded = new TextDecoder().decode(xml);
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
        .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return truncate(out, exports.MAX_FILE_CHARS);
}
/**
 * Read one selected file for sending. Throws when the file is unreadable
 * (the caller surfaces the failure toast).
 */
async function extractFileText(file) {
    return extensionOf(file.name) === 'docx' ? readDocx(file) : readTextFile(file);
}
};
__modules["ComposerAttach.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initComposerAttach = initComposerAttach;
exports.toast = toast;
exports.openFilePicker = openFilePicker;
exports.ComposerAttachButton = ComposerAttachButton;
exports.FileRailDock = FileRailDock;
exports.SendOverlay = SendOverlay;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const attachmentStore_ts_1 = require("./attachmentStore.js");
const fileText_ts_1 = require("./fileText.js");
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
const MAX_IMAGES = 9;
const MAX_FILES = 10;
const ACCEPT = [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    '.txt', '.md', '.markdown', '.json', '.csv', '.tsv', '.log', '.yaml',
    '.yml', '.xml', '.html', '.htm', '.js', '.mjs', '.cjs', '.jsx', '.ts',
    '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.go', '.rs', '.sh',
    '.bash', '.zsh', '.sql', '.ini', '.toml', '.conf', '.cfg', '.env', '.css',
    '.scss', '.less', '.svg', '.properties', '.docx',
].join(',');
let services = null;
let translate = null;
/** Bind the services and the bound NS translator (called once from apply). */
function initComposerAttach(conversation, t) {
    services = conversation;
    translate = t;
}
/* ------------------------------------------------------------------ */
/* Transient toast: upload errors land here for a few seconds, never in */
/* the composer's red notice strip.                                     */
/* ------------------------------------------------------------------ */
let toastHost = null;
function showToast(text) {
    if (toastHost === null) {
        toastHost = document.createElement('div');
        toastHost.setAttribute('data-mobile-nav', 'toast-host');
        document.body.appendChild(toastHost);
    }
    const el = document.createElement('div');
    el.setAttribute('data-mobile-nav', 'toast');
    el.textContent = text;
    toastHost.appendChild(el);
    window.setTimeout(() => {
        el.classList.add('data-mobile-nav-toast-out');
        window.setTimeout(() => el.remove(), 260);
    }, 2600);
}
function toast(key, params) {
    if (translate === null)
        return;
    showToast(translate(key, params));
}
/**
 * Bubble label for one pending file: the plain filename only. Bubbles are
 * uniform width, so over-long names are cut to the first ~13 glyph units
 * (CJK counts double) followed by a full stop — "cur_powermode.txt"
 * becomes "cur_powermod.".
 */
function bubbleName(name) {
    const CAP = 13;
    let units = 0;
    let end = 0;
    for (let i = 0; i < name.length; i++) {
        units += name.charCodeAt(i) > 0xff ? 2 : 1;
        if (units > CAP)
            break;
        end = i + 1;
    }
    return end === name.length ? name : `${name.slice(0, end)}.`;
}
/* ------------------------------------------------------------------ */
/* Hidden multi-select input; one per page, reused across sessions.     */
/* ------------------------------------------------------------------ */
let pickerElement = null;
function pickerInput() {
    if (pickerElement !== null)
        return pickerElement;
    const el = document.createElement('input');
    el.type = 'file';
    el.multiple = true;
    el.accept = ACCEPT;
    el.style.display = 'none';
    document.body.appendChild(el);
    pickerElement = el;
    return el;
}
/** Split the picked files and route each kind to its pipeline. */
async function intake(sessionId, fileList) {
    if (services === null)
        return;
    const images = [];
    const textFiles = [];
    const rejected = [];
    for (const file of fileList) {
        if ((0, fileText_ts_1.isCoreImageType)(file.type))
            images.push(file);
        else if ((0, fileText_ts_1.isSupportedFile)(file.name))
            textFiles.push(file);
        else
            rejected.push(file.name);
    }
    if (rejected.length > 0)
        toast('attach.unsupported', { name: rejected.join('、') });
    // Images → core draft pipeline: serialization rides the official path,
    // bubbles render in the dock rail (imageIds from the input state).
    if (images.length > 0) {
        const shell = services.input.shell(sessionId);
        const existing = shell.snapshot.imageIds.length;
        const added = images.slice(0, Math.max(0, MAX_IMAGES - existing));
        if (added.length < images.length)
            toast('attach.tooManyImages', { count: String(MAX_IMAGES) });
        if (added.length > 0) {
            let created = [];
            try {
                created = services.createDraftImages(added);
                if (!shell.addImages(created.map((attachment) => attachment.id)))
                    services.releaseDraftImages(created);
            }
            catch {
                services.releaseDraftImages(created);
                toast('attach.imageFailed', { name: added[0]?.name ?? '' });
            }
        }
    }
    // Text-ish files → pending store (bubble rail + send-time text append).
    for (const file of textFiles) {
        if ((0, attachmentStore_ts_1.pendingAttachmentsOf)(sessionId).length >= MAX_FILES) {
            toast('attach.tooManyFiles', { count: String(MAX_FILES) });
            break;
        }
        try {
            const { text, truncated } = await (0, fileText_ts_1.extractFileText)(file);
            (0, attachmentStore_ts_1.addAttachment)(sessionId, {
                id: crypto.randomUUID(),
                name: file.name,
                ext: (0, fileText_ts_1.extensionOf)(file.name),
                text,
                truncated,
            });
        }
        catch {
            toast('attach.readFailed', { name: file.name });
        }
    }
}
/** Open the picker for one session (attaches to that session's drafts). */
function openFilePicker(sessionId) {
    const el = pickerInput();
    el.value = '';
    el.onchange = () => {
        // Snapshot FIRST: clearing el.value empties the (possibly shared)
        // FileList in place, which would also empty the captured reference.
        const files = Array.from(el.files ?? []);
        el.value = '';
        if (files.length > 0)
            void intake(sessionId, files);
    };
    el.click();
}
function ComposerAttachButton({ session, t }) {
    const sessionId = session?.sessionId;
    return ((0, jsx_runtime_1.jsx)("button", { type: "button", "data-mobile-nav": "attach", "aria-label": t('attach.label'), title: t('attach.label'), disabled: sessionId === undefined, onClick: () => {
            if (sessionId !== undefined)
                openFilePicker(sessionId);
        }, children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M8.64453 1.5V7.34961H14.5V8.65039H8.64453V14.5H7.34473V8.65039H1.5V7.34961H7.34473V1.5H8.64453Z", fill: "currentColor" }) }) }));
}
function FileRailDock({ session, input, t }) {
    const sessionId = session?.sessionId;
    const files = (0, react_1.useSyncExternalStore)(attachmentStore_ts_1.subscribeAttachments, () => (sessionId === undefined ? [] : (0, attachmentStore_ts_1.pendingAttachmentsOf)(sessionId)));
    const images = sessionId === undefined || services === null
        ? EMPTY_IMAGES
        : services.draftImages(input?.imageIds ?? []).map((attachment) => ({
            id: attachment.id,
            previewUrl: attachment.previewUrl,
            name: attachment.file.name,
        }));
    if (sessionId === undefined || (files.length === 0 && images.length === 0))
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "file-rail", role: "group", "aria-label": t('attach.label'), children: [images.map((image) => ((0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "img-bubble", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", "data-mobile-nav": "file-x", "aria-label": t('attach.remove', { name: image.name }), onClick: () => services?.input.shell(sessionId).removeImage(image.id), children: "\u00D7" }), (0, jsx_runtime_1.jsx)("img", { src: image.previewUrl, alt: image.name, draggable: false })] }, image.id))), files.map((file) => ((0, jsx_runtime_1.jsxs)("div", { "data-mobile-nav": "file-bubble", title: file.name, children: [(0, jsx_runtime_1.jsx)("span", { "data-mobile-nav": "file-name", children: bubbleName(file.name) }), (0, jsx_runtime_1.jsx)("button", { type: "button", "data-mobile-nav": "file-x", "aria-label": t('attach.remove', { name: file.name }), onClick: () => (0, attachmentStore_ts_1.removeAttachment)(sessionId, file.id), children: "\u00D7" })] }, file.id)))] }));
}
const EMPTY_IMAGES = [];
function SendOverlay({ session, input, t }) {
    const sessionId = session?.sessionId;
    const files = (0, react_1.useSyncExternalStore)(attachmentStore_ts_1.subscribeAttachments, () => (sessionId === undefined ? [] : (0, attachmentStore_ts_1.pendingAttachmentsOf)(sessionId)));
    if (sessionId === undefined ||
        files.length === 0 ||
        (input?.draft ?? '').trim() !== '' ||
        (input?.imageIds.length ?? 0) > 0) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)("button", { type: "button", "data-mobile-nav": "send-overlay", "aria-label": t('attach.sendFiles'), onClick: () => services?.submitFiles(sessionId) }));
}
};
__modules["mobile.css.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOBILE_CSS = void 0;
/**
 * Mobile stylesheet for the DSH web shell.
 *
 * Hooks are the stable framework attributes only — no hashed classes:
 * - `[data-mobile-nav="frame"]`     our marker on the AppFrame element (value-scoped so
 *                                   it never matches the plugin's own controls)
 * - `[data-sidebar-collapsed]`     AppFrame: sidebar is in the compact rail state
 * - `[data-side="sidebar"|"details"]` AppFrame drag handles
 * - `[data-shell-overlay]`         AppFrame overlay layer (used to locate the frame)
 * - `[data-phase]`                 conversation root phase (hero|active|settling)
 *
 * Below the official auto-collapse breakpoint (1024px) the rail is removed
 * from the grid entirely; the sidebar column becomes an overlay drawer that
 * slides in when the frame leaves the collapsed state (narrowExpanded).
 */
exports.MOBILE_CSS = `
/* ---------- base control styles (rendered at any width, hidden where unused) ---------- */

/* Kill the browser's default tap flash (Chromium: rgba(0,0,0,.18)) on
   every control and replace it with a modern press feedback: interactive
   elements dip in brightness while held. The transition is declared on the
   element (NOT on :active) so both press and release ease in and out —
   an instant snap reads as stiff. background-color/opacity are included so
   state changes (selected tabs, hover fills, disabled) share the same
   gentle easing; transform is deliberately absent (the drawer slide owns
   its own 280ms transform transition). */
html {
  -webkit-tap-highlight-color: transparent;
  tap-highlight-color: transparent;
}

[data-mobile-nav="toggle"],
[data-mobile-nav="files"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-secondary, inherit);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
/* Floating directory button for surfaces without a session header (hero /
   new-topic page). Sits exactly where the header toggle would be. */
[data-mobile-nav="fab"] {
  position: fixed;
  top: 12px;
  left: 8px;
  z-index: 60;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  padding: 0;
  border: none !important;
  border-radius: 50%;
  background: var(--dsw-alias-bg-module, #ffffff);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  color: var(--dsw-alias-label-primary, inherit);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
[data-mobile-nav="fab"]:active {
  filter: brightness(0.92);
}
[data-mobile-nav="files"][hidden] {
  display: none !important;
}
[data-mobile-nav="toggle"]:hover,
[data-mobile-nav="files"]:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06));
}
/* Current session in the drawer: stronger selected tint than the official
   hover-only highlight so the active row reads at a glance. */
[data-mobile-nav="frame"] [role="treeitem"][aria-selected="true"] {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 10%, transparent) !important;
}
[data-mobile-nav="toggle"]:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #4f6ef7);
  outline-offset: 1px;
}

/* Drawer backdrop: fills the viewport behind the open drawer so a tap on the
   blank area folds the sidebar back (the official overlay layer already
   covers the frame and re-enables pointer events on children). Dimmed so
   the content behind reads as inactive, per the drawer design notes. */
[data-mobile-nav="backdrop"] {
  position: absolute !important;
  inset: 0 !important;
  z-index: 30 !important;
  background: rgba(0, 0, 0, 0.32) !important;
  cursor: pointer;
  animation: dsh-mobile-shell-backdrop-in 0.22s ease-out;
}
@keyframes dsh-mobile-shell-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}


/* ---------- mobile-only layout ---------- */

@media (max-width: 1023px) {
  /* --- Phone chrome ---
     The system status bar stays visible (no fullscreen). Two adjustments
     make it behave:
     - touch-action: manipulation kills double-tap-to-zoom (and the 300ms
       tap delay) while keeping pan and pinch zoom; the client also
       suppresses legacy-iOS gesturestart as a fallback.
     - With the client's viewport-fit=cover, env(safe-area-inset-top) is the
       status bar / notch height; the rules below push the app content below
       it so the status bar never covers anything. Off notched phones (or in
       a normal browser tab where the layout viewport already sits below the
       status bar) the inset is 0 and nothing shifts. */
  html,
  body {
    touch-action: manipulation !important;
  }

  /* Press feedback: scoped to the phone shell so desktop menus, dialogs,
     and official opacity/filter animations are not forced onto a 120ms
     !important transition (that fight is what made buttons feel dead). */
  button,
  [role="button"],
  [role="tab"],
  [role="treeitem"],
  [role="option"],
  [role="menuitem"],
  [role="switch"],
  a,
  [class*="navCell"],
  [class*="sessionRow"],
  [class*="searchResultRow"],
  [class*="workspaceRow"] {
    transition: filter 0.12s ease-out, background-color 0.12s ease-out, opacity 0.12s ease-out;
  }
  button:active,
  [role="button"]:active,
  [role="tab"]:active,
  [role="treeitem"]:active,
  [role="option"]:active,
  [role="menuitem"]:active,
  [role="switch"]:active,
  a:active,
  [class*="navCell"]:active,
  [class*="sessionRow"]:active,
  [class*="searchResultRow"]:active,
  [class*="workspaceRow"]:active {
    filter: brightness(0.92);
  }

  /* AppFrame: the drawer takes the sidebar column out of grid flow, so the
     remaining in-flow items (center, details) land in tracks 1..2: give the
     center every pixel and keep the details track at zero. The top padding
     clears the status bar / notch for every in-flow surface (session header,
     messages, composer); the absolutely-positioned drawer is unaffected (its
     containing block is the frame's padding box, i.e. still the frame top). */
  [data-mobile-nav="frame"] {
    position: relative !important;
    grid-template-columns: minmax(0, 1fr) 0 0 !important;
    padding-top: env(safe-area-inset-top, 0px) !important;
  }

  /* The sidebar column (first grid child) becomes a left drawer. The drawer
     hugs the sidebar content exactly (the wide sidebar carries an inline
     width, ~280px): a fixed 92vw box would leave a white strip where the
     container background shows beside the content.
     Closed state: translateX(-110%) — more than -100% of the max-content
     width — guarantees the whole drawer (and its shadow, had it one) leaves
     the viewport. A mere -100% leaves a sliver on screen; -105% (as used
     before) left 14px of the drawer plus a long 32px-blur shadow gradient
     visible along the left edge of the main UI. No box-shadow at all: the
     dimmed backdrop already separates drawer from content. */
  [data-mobile-nav="frame"] > :first-child {
    position: absolute !important;
    inset: 0 auto 0 0 !important;
    width: max-content !important;
    max-width: 92vw !important;
    z-index: 40 !important;
    transform: translateX(-110%);
    transition: transform .28s var(--ds-ease-in-out, ease-in-out);
    /* NOTE: no will-change / contain here on purpose. The settings dialog
       is portaled into the drawer DOM; paint containment AND will-change
       both make this element the containing block of that dialog's
       absolutely-positioned sheet, shrinking it to the drawer's 280px
       width (the right slice of the settings page vanished). The browser
       promotes an actively-transitioning transform to its own layer
       anyway, so the slide stays on the compositor without either. */
    background: var(--dsw-alias-bg-base, #ffffff);
    /* Keep the drawer's own content below the status bar / notch: the drawer
       spans the full frame height (its absolute containing block is the
       frame's padding box, so the frame's own safe-area padding does NOT
       reach it). The drawer background paints the status-bar strip, which
       the client's theme-color meta matches, so the strip reads seamless. */
    padding-top: env(safe-area-inset-top, 0px) !important;
    /* Kill the official sidebarCol right border: with the backdrop the edge
       reads cleanly, and the settings dialog (width:100% of this box) stays
       pixel-flush with the drawer. */
    border-right: none !important;
  }

  /* Expanded state (frame without data-sidebar-collapsed) slides the drawer in.
     The open state must be transform:none — NOT translateX(0): an identity
     transform still makes the drawer the containing block for fixed-position
     descendants (the settings dialog's .VOzbGW_overlay is portaled into the
     sidebar DOM). With the identity transform the wide settings sheet
     (100vw-16) overflows the 280px drawer, the dialog's focus scrolls the
     overflow:hidden drawer to scrollLeft=102, and every static child (plus the
     fixed overlay) shifts 102px off-screen. With transform:none the overlay is
     viewport-anchored: it dims the full screen and the sheet sits at left:8. */
  [data-mobile-nav="frame"]:not([data-sidebar-collapsed]) > :first-child {
    /* Deliberately NOT !important: an !important declaration outranks both
       WAAPI animations and CSS transitions, which silently killed the open
       slide (the drawer snapped into place after the mount task). Plain
       "none" keeps the viewport-anchoring semantics (identity transform is
       what would re-anchor the settings overlay) while letting the slide
       animation own the value during playback. */
    transform: none;
  }

  /* Drag handles are useless on touch and would float over the drawer. */
  [data-side="sidebar"],
  [data-side="details"] {
    display: none !important;
  }

  /* --- Conversation text on mobile ---
     The official message flow keeps desktop's 32px side gutters and 16px
     type. On a phone: shrink the type a notch and widen the lines by
     trimming the gutters (the sidebar drawer list keeps its size). The
     flow's scroll container is the only _scroll element holding markdown
     <p> paragraphs — the composer's own scroll (textarea) is excluded
     via :has(p). */
  /* The official main scroll body reserves scrollbar-gutter for desktop
     scrollbars (8px), which shoves every column off-center on a phone.
     Classic desktop scrollbars (Edge/Chrome) also occupy ~8-17px in a
     phone-sized viewport, shifting the column further. Mobile scrolling
     is touch/wheel, so remove the scrollbar entirely on phones: the
     column is then exactly centered in every browser. */
  [data-phase] [class$="_scrollBody"] {
    scrollbar-gutter: auto !important;
    scrollbar-width: none !important;
  }
  [data-phase] [class$="_scrollBody"]::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  /* Message action rows (copy / run-time badges) can overflow the right
     edge on narrow screens — keep them inside the message width. */
  [data-phase] [class$="_actions"] {
    overflow: hidden !important;
  }
  [data-phase] [class$="_actions"] [class$="_timeEnd"] {
    flex: 0 1 auto !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  [data-phase] [class$="_scroll"][data-mobile-nav="markdown"] {
    padding-left: 20px !important;
    padding-right: 20px !important;
    font-size: calc(15px * var(--mobile-nav-font-scale, 1)) !important;
  }
  /* The official markdown styles set an explicit 16px on paragraphs and
     list items, so the container's inherited 15px is not enough. User
     messages render their text in a div whose class carries _text_
     (16px too) — cover it as well. The font-size rail control (tab bar)
     scales these via --mobile-nav-font-scale; line-height scales along so
     enlarged text does not overlap. */
  [data-phase] [class$="_scroll"][data-mobile-nav="markdown"] p,
  [data-phase] [class$="_scroll"][data-mobile-nav="markdown"] li,
  [data-phase] [class$="_scroll"][data-mobile-nav="markdown"] [class*="_text_"] {
    font-size: calc(15px * var(--mobile-nav-font-scale, 1)) !important;
    line-height: calc(20px * var(--mobile-nav-font-scale, 1)) !important;
  }

  /* --- Composer bottom row on mobile ---
     The official row gives the model pill (trailing) flex:0 0 auto, which
     squeezes the agent-permission pill (modes) down to 15px: the pill's
     chevron then overflows on top of the model name. Let the permission
     pill keep its natural width and let the model pill shrink instead.
     Anchored by the composer card (:has(textarea)): row = last child,
     tools = first child, permission pill = its 2nd child, model pill =
     row's last child. */
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child {
    gap: 8px !important;
    /* The official row is flex-wrap: wrap, and wrap outranks shrink: when the
       tools group ([/] [+] modes pill) plus the trailing group (model pill +
       send) exceed the line width, the WHOLE trailing group drops to a second
       line — the model selector + send end up below the permission pill.
       Both groups have min-width: 0 and their labels already ellipsize, so
       forcing a single line lets them share the squeeze instead. */
    flex-wrap: nowrap !important;
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child {
    gap: 8px !important;
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > :nth-child(2) {
    flex: 0 0 auto !important;
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :last-child {
    /* Content-sized, not row-filling: the row's space-between pushes the
       whole trailing (model pill + send) to the right edge, so the model
       name sits directly left of the send button regardless of name length.
       A row-filling trailing (flex: 1) instead pinned the model to the left
       with a dead gap before the send whenever the name was short. */
    flex: 0 1 auto !important;
    min-width: 0 !important;
    position: relative;
    /* Keep the permission pill (tools row) and the model pill apart —
       the official 8px row gap reads as fused on small screens. */
    margin-left: 8px;
  }
  /* Pin the primary send button to the row's right edge (it otherwise
     floats mid-row with dead space behind it), which also gives the
     files-only send overlay a deterministic seat. */
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :last-child > :last-child {
    margin-left: auto !important;
  }

  /* --- Composer attachments on mobile ---
     The official command button (aria-haspopup="listbox", the "/"-menu
     launcher) shows a plus icon; mobile replaces the glyph with a "/" via
     pure CSS (no DOM surgery, survives composer re-renders). The attach
     "+" button rides the conversation.input.left slot — its DOM seat is
     the tool row's THIRD child (the slot list wrapper), while the
     permission pill block is the row's FIRST div child; flex order pulls
     the wrapper's content next to the "/" button: [/, +, modes]. */
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > button[aria-haspopup="listbox"] svg {
    display: none !important;
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > button[aria-haspopup="listbox"]::after {
    content: '/';
    font-size: 17px;
    font-weight: 500;
    line-height: 1;
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > button[aria-haspopup="listbox"] {
    border-radius: 8px !important;
    background: rgba(128, 128, 128, 0.16) !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > div:nth-of-type(1) {
    order: 2 !important;
    /* The official .modes carries a 28px left margin (built for a lone
       plus icon); with our own attach button beside it the pill ends up
       36px from the "+" — drop the margin so the permission control hugs
       the icon row. */
    margin-left: 0 !important;
  }
  [data-mobile-nav="attach"] {
    order: 1 !important;
    flex: 0 0 auto !important;
    width: 28px;
    height: 28px;
    padding: 0 !important;
    border: none !important;
    border-radius: 8px !important;
    display: grid !important;
    place-items: center;
    background: rgba(128, 128, 128, 0.16) !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
    color: var(--dsw-alias-label-primary, inherit);
    cursor: pointer;
  }
  [data-mobile-nav="attach"]:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover-solid, rgba(128, 128, 128, 0.18));
  }
  [data-mobile-nav="attach"]:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* --- Composer tool chips: modern icon-button motion ---
     Both the "/" command launcher and the "+" attach button get a press
     scale (transform is safe HERE — it is excluded from the global
     transition only because the drawer slide owns transform) plus a hover
     deepen. The "/" launcher also tints accent-blue while its command menu
     is open (the official listbox flips aria-expanded). */
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > button[aria-haspopup="listbox"],
  [data-phase] [data-mobile-nav-composer] [data-mobile-nav="attach"] {
    transition:
      filter 0.12s ease-out,
      background-color 0.12s ease-out,
      opacity 0.12s ease-out,
      transform 0.12s ease-out !important;
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > button[aria-haspopup="listbox"]:active,
  [data-phase] [data-mobile-nav-composer] [data-mobile-nav="attach"]:active {
    transform: scale(0.88);
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > button[aria-haspopup="listbox"]:hover {
    background: rgba(128, 128, 128, 0.26) !important;
  }
  [data-phase] [class*="_card"][data-mobile-nav-composer] > :last-child > :first-child > button[aria-haspopup="listbox"][aria-expanded="true"] {
    background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 18%, transparent) !important;
    color: var(--dsw-alias-state-business-primary, #4f6ef7) !important;
  }

  /* Attachment media blocks OUTSIDE the text bubble (modern messenger
     layout): image thumbnails and file-name chips under the bubble, inside
     the user stack. The model-facing body (paths, hints) is never shown. */
  [data-mobile-nav="attach-media"] {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-top: 6px;
    width: 100%;
  }
  /* Image thumbnails: a horizontal swipeable strip, same mental model as
     the picker rail — small squares, scroll sideways, tap to zoom. */
  [data-mobile-nav="attach-media"] .media-strip {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    width: 100%;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 1px 1px 3px;
  }
  [data-mobile-nav="attach-media"] .media-strip::-webkit-scrollbar {
    display: none;
  }
  [data-mobile-nav="attach-media"] .media-strip img {
    flex: none;
    width: 84px;
    height: 84px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .03));
    cursor: zoom-in;
  }
  /* Lightbox: full-screen viewer with prev/next + swipe. */
  [data-mobile-nav="lightbox"] {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.86);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: dsh-mobile-shell-fade 0.15s ease-out;
    touch-action: pan-y;
  }
  [data-mobile-nav="lightbox"] img {
    max-width: 94vw;
    max-height: 88vh;
    border-radius: 8px;
    object-fit: contain;
  }
  [data-mobile-nav="lightbox"] .lb-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  [data-mobile-nav="lightbox"] .lb-prev {
    left: 10px;
  }
  [data-mobile-nav="lightbox"] .lb-next {
    right: 10px;
  }
  /* Text-file chips: one per row, icon + name (WeChat file list style). */
  [data-mobile-nav="attach-media"] .attach-file-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    padding: 7px 12px;
    border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
    border-radius: 10px;
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .03));
  }
  [data-mobile-nav="attach-media"] .attach-file-chip .attach-chip-name {
    font-size: 13px;
    font-weight: 500;
    line-height: 18px;
    color: var(--dsw-alias-label-primary, inherit);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 220px;
  }
  /* Pure-attachment messages: the empty text bubble is hidden. */
  [data-mobile-nav="attach-only"] {
    display: none !important;
  }

  /* Android WebView: html/body touch-action:manipulation can swallow caret
     placement and IME on the composer. Restore default touch on the
     textarea so a tap always opens the keyboard and shows a caret. */
  [data-phase] [class*="_card"][data-mobile-nav-composer] textarea,
  [data-phase] [class$="_grow"] textarea {
    touch-action: auto !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    pointer-events: auto !important;
    caret-color: var(--dsw-alias-state-business-primary, #4f6ef7);
    z-index: 2;
  }
  /* Official textarea is position:absolute; inset:0 inside _grow. If grow
     ever collapses after send, the hit target is 0px and taps miss until
     reload. Keep a one-line floor so the field stays tappable. The
     structural [class$="_grow"] arm covers the microtask window before our
     marker stamp lands after a React commit. */
  [data-phase] [class*="_card"][data-mobile-nav-composer] [class$="_grow"],
  [data-phase] [class$="_grow"] {
    min-height: 44px !important;
  }
  /* Syntax-highlight overlay sits over the textarea (absolute inset:0).
     It must never steal taps — especially after send, when the hero-empty
     height collapse can leave the overlay covering the hit target. */
  [data-phase] [class*="_card"][data-mobile-nav-composer] [class$="_overlayAnchor"],
  [data-phase] [class*="_card"][data-mobile-nav-composer] [class$="_overlayAnchor"] *,
  [data-phase] [class*="_card"][data-mobile-nav-composer] [class$="_backdrop"],
  [data-phase] [class*="_card"][data-mobile-nav-composer] [data-input-backdrop],
  [data-phase] [class$="_card"] > [class$="_overlayAnchor"],
  [data-phase] [class$="_card"] > [class$="_overlayAnchor"] *,
  [data-phase] [class$="_grow"] [class$="_backdrop"],
  [data-phase] [class$="_grow"] [data-input-backdrop] {
    pointer-events: none !important;
  }

  /* --- Command menu (the "/" launcher) as a mobile sheet ---
     The official listbox floats mid-screen at desktop sizing; on a phone it
     becomes a rounded floating panel with a rise animation and two-line
     option rows (name + description). Layout position stays official;
     only the shell and rows are restyled (hash-prefixed class suffixes
     like _menu / _item are stable across the official builds). */
  [class$="_menu"][role="listbox"] {
    width: min(92vw, 420px) !important;
    max-width: min(92vw, 420px) !important;
    border-radius: 16px !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .1)) !important;
    background: var(--dsw-alias-bg-module-platform, #ffffff) !important;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28) !important;
    overflow: hidden !important;
    z-index: 300 !important;
    animation: dsh-mobile-shell-menu-in 0.22s var(--ds-ease-out, ease-in-out);
  }
  @keyframes dsh-mobile-shell-menu-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  [class$="_menu"][role="listbox"] [class$="_viewport"] {
    max-height: min(60dvh, 480px) !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    padding: 6px 6px 14px !important;
  }
  [class$="_menu"][role="listbox"] [class$="_groupTitle"] {
    padding: 8px 14px 2px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    letter-spacing: 0.05em;
    color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, .5)) !important;
    text-transform: uppercase;
  }
  [class$="_menu"][role="listbox"] [role="option"] {
    min-height: 50px !important;
    padding: 8px 14px !important;
    margin: 2px 0 !important;
    border-radius: 12px !important;
    border: none !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: center !important;
    gap: 1px !important;
    background: transparent !important;
    cursor: pointer !important;
  }
  [class$="_menu"][role="listbox"] [role="option"]:hover,
  [class$="_menu"][role="listbox"] [role="option"]:active {
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .05)) !important;
  }
  [class$="_menu"][role="listbox"] [role="option"][class*="_active"] {
    background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 12%, transparent) !important;
  }
  [class$="_menu"][role="listbox"] [class$="_itemName"] {
    font-size: 14px !important;
    font-weight: 600 !important;
    color: var(--dsw-alias-label-primary, inherit) !important;
    line-height: 20px !important;
  }
  [class$="_menu"][role="listbox"] [class$="_itemDescription"] {
    font-size: 12px !important;
    color: var(--dsw-alias-label-secondary, inherit) !important;
    line-height: 18px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  /* Pending-file bubble rail (conversation.input.dock — a row of its own
     above the composer card): horizontal scroll, per-bubble filename +
     format badge + top-right remove X, trailing Send for files-only
     submissions (the official primary button is disabled while the draft
     is empty). */
  [data-mobile-nav="file-rail"] {
    box-sizing: border-box;
    width: calc(100% - 2 * var(--dsh-composer-side-clearance, 16px));
    max-width: var(--dsh-composer-card-max-width, none);
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 2px 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
  [data-mobile-nav="file-rail"]::-webkit-scrollbar {
    display: none;
  }
  /* Uniform-width filename-only chips: every bubble is the same size and
     shows just the file name (long names are cut to "first chars." by the
     component). Pill shape on the composer surface color, name left-
     aligned, remove X inline at the right end (never overlapping text). */
  [data-mobile-nav="file-bubble"] {
    position: relative;
    flex: 0 0 auto;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 6px;
    width: 148px;
    height: 36px;
    padding: 0 6px 0 14px;
    border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(128, 128, 128, 0.22));
    border-radius: 999px;
    background: var(--dsw-specific-input-major, rgba(128, 128, 128, 0.14));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
  [data-mobile-nav="file-name"] {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    line-height: 18px;
    color: var(--dsw-alias-label-primary, inherit);
  }
  /* Remove X inside a file chip: inline, vertically centered, subtle. */
  [data-mobile-nav="file-bubble"] [data-mobile-nav="file-x"] {
    flex: none;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.16));
    color: var(--dsw-alias-label-secondary, inherit);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
  }
  /* Remove X on an image thumbnail: pinned to the thumbnail's corner. */
  [data-mobile-nav="img-bubble"] [data-mobile-nav="file-x"] {
    position: absolute;
    top: 3px;
    right: 3px;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
  }
  /* Image preview bubbles in the dock rail (the official in-card
     AttachmentRail is hidden on mobile; images render here, unified with
     the file chips). */
  [data-mobile-nav="img-bubble"] {
    position: relative;
    flex: 0 0 auto;
    width: 56px;
    height: 56px;
  }
  [data-mobile-nav="img-bubble"] img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.28));
    background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));
  }
  /* Hide the official in-card image rail: images live in the dock rail. */
  [data-phase] [class*="_card"][data-mobile-nav-composer] [class$="_attachments"] {
    display: none !important;
  }
  /* Files-only send activator: an invisible tap target exactly over the
     official primary send button (pinned to the trailing row's right edge
     by the rule above). */
  [data-mobile-nav="send-overlay"] {
    position: absolute;
    z-index: 3;
    right: 0;
    top: 0;
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    transform: translateY(-2px);
  }
  /* Transient upload-error toasts (a few seconds, then gone). */
  [data-mobile-nav="toast-host"] {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-top: 20px;
    pointer-events: none;
  }
  [data-mobile-nav="toast"],
  [data-mobile-nav="update-toast"] {
    max-width: min(86vw, 420px);
    padding: 9px 16px;
    border-radius: 999px;
    background: rgba(20, 20, 28, 0.88);
    color: #fff;
    font-size: 13px;
    line-height: 20px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
    animation: dshMobileNavToastIn 0.22s ease-out;
  }
  [data-mobile-nav="update-toast"] {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    padding: 9px 16px;
    border-radius: 999px;
    background: rgba(20, 20, 28, 0.88);
    color: #fff;
    font-size: 13px;
    line-height: 20px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
    pointer-events: none;
    animation: dshMobileNavToastIn 0.22s ease-out;
  }
  [data-mobile-nav="toast"].data-mobile-nav-toast-out {
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 0.26s ease, transform 0.26s ease;
  }
  @keyframes dshMobileNavToastIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* --- Session header on mobile ---
     Layout goal: [toggle] [session title] [mode badge] in a row, with the
     Session log capsule removed from the header (relocated to the drawer
     footer). Stable structural hooks only:
       [data-phase] header                     the session header element
       header > :first-child                   titleRow (titleCluster + utilities)
       header > :first-child > :last-child     headerUtilities (Session log seat) */
  [data-phase] header {
    padding-right: 12px !important;
  }
  /* Give the title row a lane clear of the absolutely-placed toggle, then
     balance the header: with header padding-right 12px, a 20px left
     padding puts the title's geometric center exactly on the viewport
     center (measured 195/195 at 390px). */
  [data-phase] header > :first-child {
    padding-left: 20px !important;
  }
  /* The mode badge after the title is pushed to the right end so the
     title (crumbs) keeps every spare pixel: title flexes and truncates,
     badge stays at its natural width with a small gap. */
  [data-phase] header > :first-child > :first-child > :first-child {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  [data-phase] header > :first-child > :first-child > :last-child {
    flex: 0 0 auto !important;
    margin-left: 12px !important;
  }
  /* The mode badge label ("Router Standard (experimental)") is ~190px wide
     and starts around the screen center on phones, squeezing the title.
     Cap it: the label truncates with an ellipsis, the title keeps the rest. */
  [data-phase] header [class$="_headerActions"] [class$="_label"] {
    display: block !important;
    max-width: 112px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  /* The leading preset icon: baseline alignment floats it ~2px high in the
     22px line; nudge it down to sit centered on the text line. */
  [data-phase] header [class$="_headerActions"] [class$="_label"] svg {
    vertical-align: -2px !important;
  }
  /* Hero (blank session) workspace row: same treatment — the agent-preset
     mode badge (inside a display:contents slot wrapper) is pushed to the
     right end; the workspace chip keeps its natural width. */
  [data-phase] [class*="heroWorkspaceRow"] > :last-child > :first-child {
    margin-left: auto !important;
  }
  /* The directory toggle sits at the far left of the header (the header
     is position:relative; the data-slot wrappers are display:contents). */
  [data-mobile-nav="toggle"] {
    position: absolute !important;
    left: 8px !important;
    top: 12px !important;
    z-index: 2 !important;
  }
  /* The Files action sits at the FAR RIGHT of the header so it reads as a
     distinct control from the directory toggle on the left (which opens
     the history sidebar). */
  [data-mobile-nav="files"] {
    position: absolute !important;
    left: auto !important;
    right: 8px !important;
    top: 12px !important;
    z-index: 2 !important;
  }
  /* Session log download: gone from the header row on mobile (the utilities
     seat holds only the session-log-export capsule). */
  [data-phase] header > :first-child > :last-child {
    display: none !important;
  }

  /* --- Settings dialog on mobile ---
     Desktop: 800px two-column flex (188px nav + content). Mobile: a
     near-full-width sheet — nav tabs wrap into rows on top, option rows
     stay horizontal (title+description left, control right). Structural
     selectors are scoped to the unique aria-modal dialog; every
     settings-specific rule is gated with
     :has(> :first-child > :last-child > button) — the settings nav tab
     list holds <button> tabs, so the transient export dialog (the same
     primitives Modal, header(title+close)+description+body) keeps its
     official centered card layout. Requires :has() support
     (Chromium 105+, 2022). */
  /* Settings is a FULL PAGE on mobile (no modal, no dim mask): the panel
     covers the whole viewport and the close control becomes a back arrow
     at the top-left (see the _close rules below). */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    flex-direction: row !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    animation: dsh-mobile-shell-page-in .26s var(--ds-ease-out, ease-in-out);
  }
  /* No dimmed backdrop behind the full-page settings. */
  [data-mobile-nav="sheet-overlay"] > :first-child {
    display: none !important;
  }
  @media (prefers-reduced-motion: reduce) {
    [aria-modal="true"][data-mobile-nav="settings-sheet"] {
      animation: none !important;
    }
  }
  /* The export dialog (not the settings sheet) must never overflow the
     viewport: the official centered card can be wider than 390px. */
  [aria-modal="true"]:not([data-mobile-nav="settings-sheet"]) {
    max-width: calc(100vw - 32px) !important;
  }
  /* V3 layout: LEFT icon nav rail (fixed 64px) + right content column.
     The back arrow sits at the rail top; the six sections stack as
     icon+label cells; the content area gets the remaining width. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :first-child {
    width: 64px !important;
    flex: none !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 2px !important;
    padding: calc(env(safe-area-inset-top, 0px) + 10px) 0 10px !important;
    background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.02)) !important;
    border-right: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.07)) !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :first-child > :first-child {
    display: none !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :first-child > :last-child {
    flex-direction: column !important;
    align-items: center !important;
    width: auto !important;
    gap: 2px !important;
    overflow: visible !important;
    /* The absolute back arrow occupies the rail's top; push the section
       cells below it so the first tab never sits under the arrow. */
    margin-top: 44px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class*="_navCell"] {
    box-sizing: border-box !important;
    width: 54px !important;
    height: 50px !important;
    min-height: 0 !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 1px !important;
    padding: 4px 0 !important;
    border-radius: 12px !important;
    font-size: 9px !important;
    line-height: 12px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class*="_navIcon"] {
    flex: none !important;
    display: grid !important;
    place-items: center !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class*="_navLabel"] {
    /* The official label flexes (flex:1), which stretches it across the
       cell's full height and top-aligns the glyphs — the active highlight
       then looks off-center. Pin it to its content height so the icon +
       label stack centers as one unit. */
    flex: 0 0 auto !important;
    display: block !important;
    font-size: 9px !important;
    line-height: 12px !important;
    text-align: center !important;
    white-space: nowrap !important;
    max-width: 54px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  /* Content header: "设置" page title on the left, actions on the right. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :first-child {
    justify-content: flex-start !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 10px 12px 4px !important;
    min-height: 0 !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :first-child > * {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :first-child::before {
    content: '设置';
    margin-right: auto;
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
    color: var(--dsw-alias-label-primary, inherit);
    white-space: nowrap;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :first-child button {
    min-height: 34px !important;
  }
  /* The close control becomes a BACK ARROW at the top-left: the X glyph is
     hidden and a chevron-left is painted through a mask (theme-aware). The
     official click handler still closes the settings page. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :first-child > :last-child {
    position: absolute !important;
    top: calc(env(safe-area-inset-top, 0px) + 8px) !important;
    left: 14px !important;
    z-index: 3 !important;
    width: 36px !important;
    height: 36px !important;
    border-radius: 10px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06)) !important;
  }
  /* Hide the X glyph, paint a theme-aware chevron-left via mask. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :first-child > :last-child svg {
    display: none !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :first-child > :last-child::before {
    content: '';
    width: 18px;
    height: 18px;
    background-color: var(--dsw-alias-label-primary, currentColor);
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M10.5 2.5 4 8l6.5 5.5' stroke='black' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M10.5 2.5 4 8l6.5 5.5' stroke='black' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
  }
  /* Appearance mode cards: the official cube row renders three tall
     vertical cards (~268px) that eat half the sheet. Turn them into a
     compact horizontal trio (icon + label inline, equal widths).
     Relies on the official cube-row class name of this version. */
  [aria-modal="true"] [class$="_cubeRow"] {
    gap: 6px !important;
  }
  [aria-modal="true"] [class$="_cubeRow"] > * {
    flex: 1 1 0 !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    padding: 10px 8px !important;
    min-height: 0 !important;
  }
  /* Content: the options scroll area gets bottom breathing room so the last
     row never sits flush against the sheet's rounded corner. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child {
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] > :last-child > :last-child {
    padding: 2px 12px 16px !important;
  }

  /* ---------- settings section pages on mobile ----------
     Every tab's inner page is rebuilt for touch: cards become full-width
     with comfortable padding, rows get tappable heights, forms go single
     column, and buttons/inputs grow to 40px+ targets. Class selectors use
     the stable CSS-module suffixes (_row/_card/_section/…). */

  /* Section headings + intro copy. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_section"] > [class$="_title"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_heading"] {
    font-size: 14px !important;
    font-weight: 600 !important;
    line-height: 20px !important;
    margin: 2px 2px 4px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_intro"] {
    font-size: 12px !important;
    line-height: 18px !important;
    color: var(--dsw-alias-label-tertiary, inherit) !important;
    margin: 0 2px 6px !important;
    /* The Agent presets intro wraps to 4 lines on a phone; 2 lines with
       ellipsis keeps the context without eating a third of the screen. */
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
  }
  /* Preset groups (Built-in / Custom) sit 20px apart — 12px is enough. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_group"] + [class$="_group"] {
    margin-top: 12px !important;
  }
  /* Rows and cards across General / Models / Plugins / Agent presets:
     full-width tappable cards. Compact on purpose: on a phone every
     extra px of padding/gap costs a scroll; rows keep 44px+ touch
     targets but nothing more. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_row"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowCard"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_card"] {
    box-sizing: border-box !important;
    width: 100% !important;
    min-height: 40px !important;
    margin-bottom: 4px !important;
    padding: 6px 12px !important;
    border-radius: 10px !important;
    background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.07)) !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_row"] > *,
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowCard"] > * {
    min-width: 0 !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowText"] {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    padding-right: 8px !important;
    /* official 4px column gap between title and desc adds up; 2px is
       enough for the compact card. */
    gap: 2px !important;
  }
  /* Official rows are flex-column with an 8px gap between the text block
     and the control; 6px keeps the rhythm without the airy feel. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_row"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowCard"] {
    gap: 6px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_title"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowName"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_name"] {
    font-size: 14px !important;
    font-weight: 500 !important;
    line-height: 20px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_desc"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_description"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cardDesc"] {
    font-size: 12px !important;
    line-height: 16px !important;
    color: var(--dsw-alias-label-tertiary, inherit) !important;
    margin-top: 1px !important;
    /* Long official copy wraps to 3+ lines on a phone and blows up the
       card; clamp at 1 line with ellipsis. The official cardDesc also
       pins min-height: 42px — clear it or the clamp leaves dead space. */
    min-height: 0 !important;
    height: auto !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 1 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
  }
  /* Models page: provider cards + add block. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowHead"] {
    flex-wrap: wrap !important;
    gap: 8px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_addBlock"] {
    border-radius: 12px !important;
    padding: 12px !important;
    margin-top: 4px !important;
  }
  /* Plugins page: inner segmented tabs (配置 / 列表) + plugin cards. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_tabs"] {
    display: flex !important;
    gap: 6px !important;
    margin: 2px 0 6px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_tab"] {
    flex: 1 1 0 !important;
    min-height: 30px !important;
    border-radius: 999px !important;
    font-size: 13px !important;
  }
  /* 官方下划线指示器与胶囊样式冲突（横穿整行）——隐藏，改用选中背景。 */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_tab"]::after {
    display: none !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_tab"][data-active="true"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_tab"][aria-selected="true"] {
    background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12)) !important;
    color: var(--dsw-alias-label-primary, inherit) !important;
    font-weight: 500 !important;
  }
  /* Agent preset cards: fuller padding, badge inline. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cardMain"] {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 4px !important;
    padding: 8px 12px 6px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cardId"] {
    font-size: 10px !important;
    line-height: 14px !important;
    color: var(--dsw-alias-label-tertiary, inherit) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    margin: 1px 0 2px !important;
    font-family: ui-monospace, monospace !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cardFoot"] {
    padding: 0 10px 2px !important;
    gap: 4px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cardHead"] {
    align-items: center !important;
    gap: 6px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cardName"] {
    font-size: 14px !important;
    font-weight: 600 !important;
  }
  /* Plugins tab: the card list carries a 10px flex gap and each card
     header has 14px padding — stacked, the air between rows doubles. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cards"] {
    gap: 6px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_cards"] [class$="_card"] {
    margin-bottom: 0 !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_card"] [class$="_header"] {
    padding: 10px 12px !important;
    gap: 10px !important;
  }
  /* Generic touch targets: inputs, selects, buttons. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] input,
  [aria-modal="true"][data-mobile-nav="settings-sheet"] select,
  [aria-modal="true"][data-mobile-nav="settings-sheet"] textarea {
    min-height: 40px !important;
    font-size: 14px !important;
    border-radius: 8px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] input[type="text"],
  [aria-modal="true"][data-mobile-nav="settings-sheet"] input:not([type]),
  [aria-modal="true"][data-mobile-nav="settings-sheet"] input[type="password"] {
    width: 100% !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] button {
    min-height: 36px !important;
    border-radius: 9px !important;
    font-size: 13px !important;
  }

  /* Vision toolkit form (dvt-*): single-column form, full-width fields,
     stretch save action. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-form-grid {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-panel {
    padding: 10px !important;
    border-radius: 10px !important;
    margin-bottom: 8px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-alert {
    font-size: 12px !important;
    line-height: 18px !important;
    border-radius: 10px !important;
    padding: 10px 12px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-muted {
    font-size: 11px !important;
    line-height: 16px !important;
    margin-top: 2px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-panel-title {
    font-size: 15px !important;
    font-weight: 600 !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-field input::placeholder {
    color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, .45)) !important;
    opacity: 1 !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-field label {
    font-size: 13px !important;
    margin-bottom: 4px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-save-row {
    margin-top: 8px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-save-row button,
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .dvt-actions button {
    width: 100% !important;
    min-height: 42px !important;
  }
  /* Super-injector plugin-management page (spi-*): mobile-first.
     The page itself is collapsible (details/summary) with 44px+ touch
     targets; here we stack full-width controls and swap the hints. */
  /* [hidden] fallback: the official "Open configuration file" action is
     hidden on mobile (no native editor on a phone); some button styles
     override the UA hidden rule, so force it. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] [hidden] {
    display: none !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-page {
    max-width: none !important;
    padding: 4px 2px 8px !important;
    font-size: 14px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-title {
    font-size: 17px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-badge {
    font-size: 10px !important;
    padding: 2px 8px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-stats {
    white-space: normal !important;
    line-height: 1.7 !important;
    margin-bottom: 8px !important;
  }
  /* Desktop drag hint is meaningless on a phone; show the mobile one. */
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-hint {
    display: none !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-hint-mobile {
    display: block !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-add {
    border-radius: 14px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-add summary {
    min-height: 44px !important;
    font-size: 15px !important;
    padding: 0 16px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-add-body {
    padding: 10px 12px 12px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-row {
    flex-wrap: wrap !important;
    gap: 8px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-input {
    background: var(--dsw-alias-bg-base, rgba(255, 255, 255, 0.05)) !important;
    border-color: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12)) !important;
    color: var(--dsw-alias-label-primary, inherit) !important;
    flex: 1 1 100% !important;
    min-height: 42px !important;
    font-size: 14px !important;
    border-radius: 12px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-btn {
    flex: 1 1 calc(50% - 4px) !important;
    min-height: 42px !important;
    font-size: 14px !important;
    border-radius: 12px !important;
    padding: 0 10px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-btn.danger {
    min-height: 40px !important;
    font-size: 13px !important;
    border-radius: 10px !important;
    flex: 0 0 auto !important;
    padding: 0 14px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-section {
    margin: 10px 0 6px !important;
    font-size: 13px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-item {
    padding: 10px 12px !important;
    border-radius: 10px !important;
    margin-bottom: 6px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-item .name {
    font-size: 14px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-item .dir {
    font-size: 11px !important;
    max-width: none !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-item .st {
    font-size: 11px !important;
    padding: 3px 9px !important;
  }
  [aria-modal="true"][data-mobile-nav="settings-sheet"] .spi-empty {
    padding: 18px 14px !important;
    text-align: center !important;
  }

  /* ---------- dsh-web-ui family compatibility ----------
     The linxin666 plugin suite extends the shell frame directly:
       - aionui-panel appends two trailing grid columns (explorer / preview)
         plus absolute drag handles to [data-dsh-frame]; its 5-track inline
         grid is already overridden above, but the handles and columns would
         still float over the main UI. On mobile the columns leave the grid
         as floating bottom sheets and keep their own visibility state —
         the suite's collapse chevron / preview tabs still work, so no
         feature is lost. The task-board / ssh plugins inject sidebar
         entries and center-column takeover panels; the entries need
         spacing and the kanban needs scrollable columns. */

  /* Touch devices: the drag handles are useless — the floating expand
     button is the opener. */
  .aionui-explorer-handle,
  .aionui-preview-handle {
    display: none !important;
  }

  /* Shared base: both columns leave the grid as floating panels. The
     explorer is gated shut by default (its own persisted expanded state
     must never cover the mobile UI on load); the header Files action opens
     it via the frame marker below, and the sheet's own collapse chevron
     clears it. Preview stays owned by the suite (hidden while no tab is
     open). The per-column rules below override the geometry. */
  [data-aionui-explorer-col],
  [data-aionui-preview-col] {
    position: fixed !important;
    z-index: 55 !important;
    background: var(--aion-bg-base, #ffffff) !important;
    border-left: none !important;
  }
  /* Explorer (file tree) bottom sheet: bottom edge aligned exactly with
     the composer card's bottom line — the card sits 36px above the
     viewport bottom (8px composer padding + the 28px stats strip below
     the card), so the sheet uses the same 36px bottom offset. */
  [data-aionui-explorer-col] {
    visibility: hidden !important;
    left: 8px !important;
    right: 8px !important;
    top: auto !important;
    bottom: 36px !important;
    width: auto !important;
    height: min(55dvh, 460px) !important;
    max-height: calc(100dvh - 44px) !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    box-shadow: 0 -4px 28px rgba(0, 0, 0, .18) !important;
    animation: dsh-mobile-shell-sheet-up .24s var(--ds-ease-out, ease-in-out) !important;
  }
  /* Preview (file content) bottom sheet. Gated shut by default: the suite
     persists open preview tabs in localStorage and restores them on load,
     which would pop the sheet over the fresh UI. The client only sets the
     frame marker after the user taps a file row in the explorer; the
     suite's own collapse chevron clears it via the visibility watcher. */
  [data-aionui-preview-col] {
    visibility: hidden !important;
    position: fixed !important;
    left: 8px !important;
    right: 8px !important;
    top: auto !important;
    bottom: 40px !important;
    width: auto !important;
    height: min(50dvh, 420px) !important;
    max-height: calc(100dvh - 48px) !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    box-shadow: 0 -4px 28px rgba(0, 0, 0, .18) !important;
    z-index: 56 !important;
    animation: dsh-mobile-shell-sheet-up .24s var(--ds-ease-out, ease-in-out) !important;
  }
  /* User-opened preview sheet (frame marker, set on file-row tap). */
  [data-mobile-nav="frame"][data-aionui-preview-open] [data-aionui-preview-col] {
    visibility: visible !important;
  }
  /* The Files action opens the explorer sheet (frame marker). */
  [data-mobile-nav="frame"][data-aionui-explorer-open] [data-aionui-explorer-col] {
    visibility: visible !important;
  }
  /* The open drawer must never sit under a sheet: while the frame is in the
     narrow-expanded state both sheets yield (later in the file than the
     open marker rule, so it wins at equal specificity). */
  [data-mobile-nav="frame"]:not([data-sidebar-collapsed]) [data-aionui-explorer-col],
  [data-mobile-nav="frame"]:not([data-sidebar-collapsed]) [data-aionui-preview-col] {
    visibility: hidden !important;
  }
  /* The suite's own expand button reads the store state we bypass on
     mobile — hide it; the header Files action is the opener. */
  .aionui-floating-expand {
    display: none !important;
  }

  /* dsh-web-ui sidebar entries (task board / ssh) sit flush against each
     other — give the injected rows breathing room. */
  button[data-dsh-taskboard-entry],
  button[data-dsh-ssh-entry] {
    margin-bottom: 8px !important;
  }

  /* Task board: five kanban columns at minmax(0,1fr) crush into ~78px phone
     strips. Give every column a usable minimum and let the row scroll. */
  [data-dsh-taskboard-board] > [class$="_columns"] {
    grid-template-columns: repeat(5, minmax(240px, 1fr)) !important;
    overflow-x: auto !important;
  }
  /* The floating button must not float over a takeover panel (task board /
     ssh own the center column while active). */
  html[data-dsh-taskboard-active] [data-mobile-nav="fab"],
  html[data-dsh-ssh-active] [data-mobile-nav="fab"],
  html[data-dsh-taskboard-active] [data-mobile-nav="backdrop"],
  html[data-dsh-ssh-active] [data-mobile-nav="backdrop"] {
    display: none !important;
  }
  /* Board header: let the search field take the slack instead of squeezing
     the action buttons. */
  [data-dsh-taskboard-board] > [class$="_boardHeader"] [class$="_search"] {
    flex: 1 1 auto !important;
    min-width: 80px !important;
  }

  /* ---------- dsh-web-ui polish: plugin market search ----------
     The market tab row (Discover / Themes / Installed + the plugin search
     box) is a no-wrap flex: at 390px the tabs plus the ~218px search box
     (~475px total) overflow the ~334px sheet and the search box runs off
     the right edge of the screen (it also forces a horizontal scrollbar on
     the sheet's options area). Let the row wrap: the tabs keep the first
     line and the search box gets its own full-width second line. */

  [aria-modal="true"] [class$="_tabs"] {
    flex-wrap: wrap !important;
    row-gap: 8px !important;
  }
  [aria-modal="true"] [class$="_searchInline"] {
    flex: 1 1 100% !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* ---------- dsh-usage-stats polish: usage & balance panel ----------
     The panel's stats row shows three token counters side by side
     (today / month / total). The counters use tabular nowrap figures whose
     min-content width overflows the ~336px panel body on a phone: figures
     clip at the row's edges and the panel grows a horizontal scrollbar.
     Stack the three counters vertically — full-width rows, so the figures
     always fit. */

  [class*="usg_"][class$="_statsRow"] {
    flex-direction: column !important;
  }
  [class*="usg_"][class$="_stat"] {
    flex: 0 0 auto !important;
    width: 100% !important;
    min-width: 0 !important;
  }

  /* ---------- dsh-web-ui polish: settings sheet ----------
     The official dialog is a desktop two-column form; on a phone the
     label/control split leaves a huge dead gap and long descriptions wrap
     into tall stacks. Stack each row (text above, control full-width) and
     compact the nav tabs into an even wrap. */

  [aria-modal="true"] [class*="_navCell"] {
    padding: 6px 8px !important;
    gap: 6px !important;
    font-size: 13px !important;
    justify-content: flex-start !important;
  }
  [aria-modal="true"] [class*="_navCell"] svg {
    width: 14px !important;
    height: 14px !important;
    flex: none !important;
  }
  /* Setting rows: text on top, control below at full width. */
  [aria-modal="true"] [class$="_section"] [class$="_row"] {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 6px !important;
  }
  [aria-modal="true"] [class$="_section"] [class$="_row"] > :first-child {
    width: 100% !important;
    max-width: none !important;
  }
  [aria-modal="true"] [class$="_section"] [class$="_row"] > :last-child {
    width: 100% !important;
    max-width: none !important;
  }
  /* Appearance mode group: give the cube row a consistent bordered
     segmented look (the official borders differ per state). */
  [aria-modal="true"] [class$="_cubeRow"] > * {
    border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .12)) !important;
  }

  /* ---------- dsh-web-ui polish: explorer sheet ----------
     The aionui explorer was designed for a desktop side column: compact the
     header, search box and tree rows so a phone shows more entries, and pad
     the scroll bottom so the last row never sits flush on the edge. */

  [data-aionui-explorer-col] [class$="_tabBar"] {
    height: 36px !important;
  }
  [data-aionui-explorer-col] [class$="_tabBtn"],
  [data-aionui-explorer-col] [class$="_tabBtnActive"] {
    padding: 0 12px !important;
    font-size: 13px !important;
  }
  [data-aionui-explorer-col] [class$="_searchBox"] {
    height: 32px !important;
    font-size: 13px !important;
  }
  [data-aionui-explorer-col] [class$="_treeRow"] {
    height: 30px !important;
    font-size: 13px !important;
  }
  [data-aionui-explorer-col] [class$="_treeRow"] svg {
    width: 14px !important;
    height: 14px !important;
  }
  [data-aionui-explorer-col] [class$="_scrollArea"] {
    padding-bottom: 28px !important;
  }

    [data-mobile-nav="drawer-actions"] {
    width: 100% !important;
  }
  [data-mobile-nav="drawer-actions"] > button {
    flex: 1 1 0 !important;
    padding: 0 8px !important;
    white-space: nowrap !important;
  }

  /* ---------- dsh-web-ui polish: floating pet ----------
     The whale-girl pet (dsh-pet) floats at the viewport corner with a
     persisted, draggable position. On phones the pet is scaled down so
     it does not dominate the screen; the plugin's own drag + persist
     still work (the position itself is left alone — the mobile default
     position is seeded via the pet API to just above the composer). */

  body > [data-mobile-nav="pet"] {
    transform: scale(.66);
    transform-origin: bottom right;
  }
  /* While a modal dialog (settings sheet / export) owns the screen the pet
     floats ABOVE it and covers the dialog content; modal semantics say the
     background is inert, so hide the pet for the modal's lifetime. */
  body[data-mobile-nav="modal-open"] > [data-mobile-nav="pet"] {
    display: none !important;
  }

  /* ---------- conversation stats line: relocated to the Status tab ----------
     The official session-status row (turns / steps / LLM time / TTFT /
     cache / tokens) is now displayed in full inside the Status view tab
     (conversation.view entry id "status"), so the strip under the composer
     is hidden entirely on mobile. The client still marks the row with
     [data-mobile-nav="stats"] (text-anchored); the TPS readout that was
     folded into it is likewise gone — the Status tab shows decode
     throughput and every other figure instead. */

  [data-mobile-nav="stats"] {
    display: none !important;
  }

  /* ---------- hero composer on mobile ----------
     The official hero card carries a 2-line textarea plus a tall tool row,
     which reads oversized on a phone. Tighten the empty-state rhythm: keep
     the official centered hero, shrink the textarea line box, slim the card
     padding and the tool row, and close the gap under the headline. */

  [data-phase="hero"] [class$="_card"][data-mobile-nav-composer] {
    padding-top: 6px !important;
    gap: 8px !important;
  }

  /* ---------- status view tab ----------
     A dashboard of the conversation's engine state, mirroring the official
     design language: one soft card per group with hairline separators,
     accent blue for the live state, tabular figures. Mobile-first, but the
     same cards read fine on desktop inside the chat column width. */

  [data-mobile-nav="status"] {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px 24px;
    max-width: var(--dsh-chat-content-width, 748px);
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  /* Status line: ● Running / Idle + phase, no card. */
  [data-mobile-nav="status-line"] {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 2px 4px 0;
    font-size: 13px;
    line-height: 20px;
  }
  [data-mobile-nav="status-dot"] {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dsw-alias-label-caption, rgba(0, 0, 0, .35));
    flex: none;
    transition: background-color .2s;
  }
  /* While the drawer is open the pulse animation would keep fighting the
     slide for compositor time; pause it (opacity snap is imperceptible). */
  [data-mobile-nav="frame"]:not([data-sidebar-collapsed]) [data-mobile-nav="status-dot"] {
    animation-play-state: paused !important;
  }
  [data-mobile-nav="status-dot"][data-running="1"] {
    background: var(--dsw-alias-state-business-primary, #4f6ef7);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 18%, transparent);
  }
  [data-mobile-nav="status-label"] {
    color: var(--dsw-alias-label-primary, inherit);
    font-weight: 500;
  }
  [data-mobile-nav="status-phase"] {
    color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, .5));
    margin-left: auto;
    font-size: 11px;
    font-weight: 500;
    line-height: 18px;
    font-variant-numeric: tabular-nums;
    padding: 1px 8px;
    border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
    border-radius: 999px;
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .04));
  }

  /* Session-log export action (relocated from the drawer footer to the top
     of the Status tab): full-width pill matching the card language. */
  [data-mobile-nav="status-export"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 40px;
    border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .12));
    border-radius: 12px;
    background: transparent;
    color: var(--dsw-alias-label-primary, inherit);
    font-family: inherit;
    font-size: 13px;
    line-height: 20px;
    cursor: pointer;
    transition: background-color .15s;
  }
  [data-mobile-nav="status-export"]:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .04));
  }
  [data-mobile-nav="status-export"]:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  /* Metric cards: 2-column cell grid with hairline separators. */
  [data-mobile-nav="status-card"] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
    border-radius: 14px;
    background: var(--dsw-alias-bg-module, rgba(255, 255, 255, .5));
    overflow: hidden;
  }
  /* Usage card: three equal columns (cache hit / input / output). */
  [data-mobile-nav="status-card"][data-usage] {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  [data-mobile-nav="status-cell"] {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
    padding: 9px 12px 10px;
  }
  [data-mobile-nav="status-cell"]:nth-child(odd) {
    border-right: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
  }
  [data-mobile-nav="status-card"][data-usage] [data-mobile-nav="status-cell"]:nth-child(odd) {
    border-right: none;
  }
  [data-mobile-nav="status-card"][data-usage] [data-mobile-nav="status-cell"]:nth-child(-n + 2) {
    border-right: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
  }
  [data-mobile-nav="status-card"]:not([data-usage]) [data-mobile-nav="status-cell"]:nth-child(n + 3) {
    border-top: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
  }
  [data-mobile-nav="cell-label"] {
    color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, .5));
    font-size: 11px;
    line-height: 16px;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  [data-mobile-nav="cell-value"] {
    color: var(--dsw-alias-label-primary, inherit);
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Transient list: full-width rows, hairline separators, no card chrome. */
  [data-mobile-nav="status-list"] {
    display: flex;
    flex-direction: column;
    margin: 2px 4px 0;
    border-top: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
  }
  [data-mobile-nav="status-list"] > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    padding: 8px 0 7px;
    border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
  }
  [data-mobile-nav="status-list"] > div:last-child {
    border-bottom: none;
  }
  [data-mobile-nav="status-list"] dt {
    color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, .7));
    font-size: 13px;
    line-height: 20px;
    white-space: nowrap;
  }
  [data-mobile-nav="status-list"] dd {
    margin: 0;
    color: var(--dsw-alias-label-primary, inherit);
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
    font-variant-numeric: tabular-nums;
    text-align: right;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  /* Last engine error: a soft danger card, not a bare red line. */
  [data-mobile-nav="status-error"] {
    margin: 0 4px;
    padding: 9px 12px;
    border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #d86161) 45%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #d86161) 8%, transparent);
    color: var(--dsw-alias-state-error-primary, #d86161);
    font-size: 12px;
    line-height: 18px;
    overflow-wrap: anywhere;
  }
  /* Empty-hero composer: do NOT force height on _scroll/_grow. The official
     textarea is position:absolute; inset:0 inside _grow, so a stale 48px
     lock after send leaves the real hit target collapsed and taps miss
     until a full reload. Size the empty state via the hidden mirror's
     min-height instead — that is what the official autosizer measures. */
  [data-phase="hero"] [class$="_card"][data-mobile-nav-hero-empty] [class$="_mirror"] {
    min-height: 48px !important;
  }
  [data-phase="hero"] [class$="_card"][data-mobile-nav-composer] > [class$="_row"] {
    padding-top: 4px !important;
  }
  [data-phase="hero"] [class$="_headline"] {
    line-height: 1.15 !important;
    margin-bottom: 0 !important;
  }
  [data-phase="hero"] [class$="_stack"] {
    gap: 0 !important;
  }
}

/* ---------- desktop: the mobile controls must never appear ---------- */

@media (min-width: 1024px) {
  [data-mobile-nav="toggle"],
  [data-mobile-nav="files"],
  [data-mobile-nav="fab"],
  [data-mobile-nav="backdrop"] {
    display: none !important;
  }
}

/* ---------- session delete (kebab menu addition + confirm dialog) ---------- */
/* The injected kebab item reuses the core menu item classes; only the danger
   color is ours. !important keeps it red over the core item:hover rule. */
[data-mobile-nav="delete-item"] button.mobile-nav-delete-item {
  color: var(--dsw-alias-state-error-primary, #e5484d) !important;
}
[data-mobile-nav="delete-item"] button.mobile-nav-delete-item:hover {
  color: var(--dsw-alias-state-error-primary, #e5484d) !important;
}
/* Confirm dialog: danger confirm button + status/error rows. */
.mobile-nav-delete-danger:not(:disabled) {
  color: #fff !important;
  background: var(--dsw-alias-state-error-primary, #e5484d) !important;
  border-color: var(--dsw-alias-state-error-primary, #e5484d) !important;
}
.mobile-nav-delete-status {
  color: var(--dsw-alias-label-secondary, inherit);
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
}
.mobile-nav-delete-error {
  color: var(--dsw-alias-state-error-primary, #e5484d);
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
}

/* ---------- view tab switch: keep-position + fade ----------
   The core conversation view seat unmounts the outgoing tab and rebuilds
   the incoming one from scratch; the fade softens the swap while the
   scroll restore runs in JS. Animation lives on the view area (survives
   the tab swap), keyed off a marker stamped on tab tap. */
[data-phase] [class$="_viewArea"][data-mobile-nav="view-fade"] {
  animation: dsh-mobile-shell-view-in .16s var(--ds-ease-out, ease-out);
}
@keyframes dsh-mobile-shell-view-in {
  from { opacity: 0 }
  to { opacity: 1 }
}
@media (prefers-reduced-motion: reduce) {
  [data-phase] [class$="_viewArea"][data-mobile-nav="view-fade"] {
    animation: none !important;
  }
}

/* ---------- chat font size rail (tab bar, right end) ----------
   Two stepper buttons plus a px readout, pushed to the far right of the
   conversation tab bar. Only the chat view's message typography scales
   (--mobile-nav-font-scale above); Trajectory / Status are untouched. */
[data-mobile-nav="font-controls"] {
  display: inline-flex;
  align-items: center;
  gap: 0;
  margin-left: auto;
  flex: none;
  user-select: none;
  /* Identical typography to the official tab buttons (13px/500/16px + the
     same 11px bottom padding reserved for the active underline), so the
     A− / px / A+ glyphs sit on the exact same baseline as 对话/轨迹/状态. */
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, inherit);
  padding-bottom: 11px;
}
[data-mobile-nav="font-controls"] button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 20px;
  padding: 0 3px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
[data-mobile-nav="font-controls"] button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06));
  color: var(--dsw-alias-label-secondary, inherit);
}
[data-mobile-nav="font-controls"] [data-mobile-nav="font-size"] {
  min-width: 18px;
  text-align: center;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
/* On very narrow phones the tab bar could still run out of room (wide
   languages, long tab labels): let it scroll horizontally instead of
   pushing the last tab out of the viewport, and tighten the official
   36px tab gap below 360px. */
[data-phase] [class$="_tabs"] {
  overflow-x: auto;
  scrollbar-width: none;
}
[data-phase] [class$="_tabs"]::-webkit-scrollbar {
  display: none;
}
@media (max-width: 420px) {
  [data-phase] [class$="_tabs"] {
    gap: 24px !important;
  }
}
@media (max-width: 359px) {
  [data-phase] [class$="_tabs"] {
    gap: 16px !important;
  }
}

/* ---------- background jobs: moved from the chat header into Status ----------
   The official ui-jobs header control is hidden on mobile; the Status tab
   renders the same job surface as a collapsed card (tap to expand). The
   card mirrors the status-card language: 1px border-l1 frame, 14px radius,
   module background, hairline separators inside. */
[data-phase] header button[aria-label*="后台任务"],
[data-phase] header button[aria-label*="background job"] {
  display: none !important;
}

/* Full-width card (the status cards above are 2/3-column grids; this one is
   a list card, so it lives outside the grid containers). */
[data-mobile-nav="jobs-card"] {
  border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
  border-radius: 14px;
  background: var(--dsw-alias-bg-module, rgba(255, 255, 255, .5));
  overflow: hidden;
}

/* Header row: icon + title + count pill + chevron. */
[data-mobile-nav="jobs-toggle"] {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
[data-mobile-nav="jobs-icon"] {
  flex: none;
  color: var(--dsw-alias-label-secondary, inherit);
}
[data-mobile-nav="jobs-title"] {
  flex: none;
}
[data-mobile-nav="jobs-count"] {
  margin-left: auto;
  flex: none;
  border-radius: 999px;
  padding: 2px 9px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06));
  color: var(--dsw-alias-label-secondary, inherit);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}
[data-mobile-nav="jobs-count"][data-live="1"] {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 12%, transparent);
  color: var(--dsw-alias-state-business-primary, #4f6ef7);
}
[data-mobile-nav="jobs-chevron"] {
  flex: none;
  color: var(--dsw-alias-label-tertiary, inherit);
  transition: transform .18s var(--ds-ease-in-out, ease-in-out);
}
[data-mobile-nav="jobs-chevron"][data-open="1"] {
  transform: rotate(180deg);
}

/* Expanded rows. */
[data-mobile-nav="jobs-list"] {
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .1));
  padding: 4px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: dsh-mobile-shell-jobs-in .16s var(--ds-ease-out, ease-out);
}
@keyframes dsh-mobile-shell-jobs-in {
  from { opacity: 0; transform: translateY(-4px) }
  to { opacity: 1; transform: none }
}
[data-mobile-nav="job-row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 6px;
  border-radius: 10px;
}
[data-mobile-nav="job-row"][data-live="1"] {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 5%, transparent);
}

/* Status dot: solid state color, live ones pulse. */
[data-mobile-nav="job-dot"] {
  position: relative;
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, .4));
}
[data-mobile-nav="job-row"][data-state="running"] [data-mobile-nav="job-dot"] {
  background: var(--dsw-alias-state-business-primary, #4f6ef7);
}
[data-mobile-nav="status-dot"][data-running="1"]::after,
[data-mobile-nav="job-row"][data-state="running"] [data-mobile-nav="job-dot"]::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 40%, transparent);
  animation: dsh-mobile-shell-dot-pulse 1.6s ease-in-out infinite;
  will-change: transform, opacity;
  pointer-events: none;
}
[data-mobile-nav="job-row"][data-state="completed"] [data-mobile-nav="job-dot"] {
  background: var(--dsw-alias-state-success-primary, #2ea37f);
}
[data-mobile-nav="job-row"][data-state="failed"] [data-mobile-nav="job-dot"] {
  background: var(--dsw-alias-state-error-primary, #e5484d);
}
[data-mobile-nav="job-row"][data-state="stopping"] [data-mobile-nav="job-dot"],
[data-mobile-nav="job-row"][data-state="killed"] [data-mobile-nav="job-dot"] {
  background: var(--dsw-alias-state-warn-label, #c08a2d);
}
/* Pulse ring on a pseudo-element, animating ONLY transform/opacity: a
   box-shadow pulse repaints the dot region every frame, which steals
   main-thread/compositor time on low-end phones. The ring scales out and
   fades — both are compositor properties (GPU). */
/* Settings full-page entrance (was referenced but never defined — the
   animation silently did not play). Compositor-only properties. */
@keyframes dsh-mobile-shell-page-in {
  from { opacity: 0; transform: translateY(10px) }
  to { opacity: 1; transform: none }
}
/* Bottom sheet rise (explorer / preview sheets). */
@keyframes dsh-mobile-shell-sheet-up {
  from { opacity: 0; transform: translateY(28px) }
  to { opacity: 1; transform: none }
}
/* Generic soft fade. */
@keyframes dsh-mobile-shell-fade {
  from { opacity: 0 }
  to { opacity: 1 }
}
@keyframes dsh-mobile-shell-dot-pulse {
  0% { transform: scale(1); opacity: .85 }
  70% { transform: scale(1.9); opacity: 0 }
  100% { transform: scale(1.9); opacity: 0 }
}

/* Kind badge: code face on a platform chip. */
[data-mobile-nav="job-kind"] {
  flex: none;
  border-radius: 4px;
  padding: 1px 5px;
  background: var(--dsw-alias-bg-module-platform, rgba(0, 0, 0, .045));
  color: var(--dsw-alias-label-secondary, inherit);
  font-family: var(--ds-font-family-code, monospace);
  font-size: 10px;
  line-height: 15px;
}
/* Command label takes the slack; status + duration cluster right. */
[data-mobile-nav="job-label"] {
  flex: 1 1 auto;
  min-width: 56px;
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
[data-mobile-nav="job-meta"] {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-left: 4px;
}
[data-mobile-nav="job-status"] {
  flex: none;
  color: var(--dsw-alias-label-secondary, inherit);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
[data-mobile-nav="job-row"][data-state="failed"] [data-mobile-nav="job-status"] {
  color: var(--dsw-alias-state-error-primary, #e5484d);
}
[data-mobile-nav="job-duration"] {
  flex: none;
  color: var(--dsw-alias-label-tertiary, inherit);
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}
@media (prefers-reduced-motion: reduce) {
  [data-mobile-nav="jobs-list"],
  [data-mobile-nav="job-row"][data-state="running"] [data-mobile-nav="job-dot"] {
    animation: none !important;
  }
}

/* ---------- view tab switch: keep-position + fade ----------
   The core conversation view seat unmounts the outgoing tab and rebuilds
   the incoming one from scratch; the fade softens the swap while the
   scroll restore runs in JS. Animation lives on the view area (survives
   the tab swap), keyed off a marker stamped on tab tap. */
[data-phase] [class$="_viewArea"][data-mobile-nav="view-fade"] {
  animation: dsh-mobile-shell-view-in .16s var(--ds-ease-out, ease-out);
}
@keyframes dsh-mobile-shell-view-in {
  from { opacity: 0 }
  to { opacity: 1 }
}
@media (prefers-reduced-motion: reduce) {
  [data-phase] [class$="_viewArea"][data-mobile-nav="view-fade"] {
    animation: none !important;
  }
}

/* ---------- chat font size rail (tab bar, right end) ----------
   Two stepper buttons plus a px readout, pushed to the far right of the
   conversation tab bar. Only the chat view's message typography scales
   (--mobile-nav-font-scale above); Trajectory / Status are untouched. */
[data-mobile-nav="font-controls"] {
  display: inline-flex;
  align-items: center;
  gap: 0;
  margin-left: auto;
  flex: none;
  user-select: none;
  /* Identical typography to the official tab buttons (13px/500/16px + the
     same 11px bottom padding reserved for the active underline), so the
     A− / px / A+ glyphs sit on the exact same baseline as 对话/轨迹/状态. */
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, inherit);
  padding-bottom: 11px;
}
[data-mobile-nav="font-controls"] button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 20px;
  padding: 0 3px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
[data-mobile-nav="font-controls"] button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06));
  color: var(--dsw-alias-label-secondary, inherit);
}
[data-mobile-nav="font-controls"] [data-mobile-nav="font-size"] {
  min-width: 18px;
  text-align: center;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
/* On very narrow phones the tab bar could still run out of room (wide
   languages, long tab labels): let it scroll horizontally instead of
   pushing the last tab out of the viewport, and tighten the official
   36px tab gap below 360px. */
[data-phase] [class$="_tabs"] {
  overflow-x: auto;
  scrollbar-width: none;
}
[data-phase] [class$="_tabs"]::-webkit-scrollbar {
  display: none;
}
@media (max-width: 420px) {
  [data-phase] [class$="_tabs"] {
    gap: 24px !important;
  }
}
@media (max-width: 359px) {
  [data-phase] [class$="_tabs"] {
    gap: 16px !important;
  }
}

/* ---------- context ring: relocated from the composer to the tab bar ----------
   The core ContextMeter ring (aria-label "上下文已用 N%") is hidden on
   mobile; the tab bar shows a mirrored ring after the Status label, fed by
   the original's aria-label. The composer's permission + model pills shift
   right by the ring width to fill the vacated slot. */
[data-phase] button[aria-label*="上下文已用"],
[data-phase] button[aria-label*="context used"] {
  display: none !important;
}
/* Permission pill and model pill move right ~28px (ring width + gap) so the
   vacated composer slot reads as occupied. */
[data-phase] [class$="_modes"] {
  margin-left: 28px !important;
}
[data-phase] [class$="_trailing"] > [class$="_root"] {
  margin-left: 28px !important;
}

/* Injected ring next to the Status tab. */
[data-mobile-nav="ctx-ring"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin: 0 1px;
  cursor: pointer;
  color: inherit;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}
[data-mobile-nav="ctx-ring"]:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06));
}
[data-mobile-nav="ctx-ring"][hidden] {
  display: none;
}

/* The composer trigger's effort label ("Max") is hidden on mobile — long
   model names must not push the input row — and mirrored next to the
   relocated context ring in the tab bar instead. */
[data-phase] [class$="_triggerEffort"] {
  display: none !important;
}
/* Pin the composer model selector to the right of the input row, flush
   against the send button: cap its width so a long model name ellipsizes
   compactly instead of sprawling toward the tool buttons or overlapping the
   send button, tighten the trailing-row gap, and recover 2px of label room
   from the trigger's right padding so the current names still fit whole. */
@media (max-width: 1023px) {
  [data-phase] [class$="_trailing"] {
    flex: 0 1 auto !important;
    min-width: 0 !important;
    gap: 4px !important;
  }
  [data-phase] [class$="_trailing"] > [class$="_root"] {
    min-width: 0 !important;
    flex: 0 1 auto !important;
  }
  [data-phase] [class$="_trigger"] {
    max-width: 172px !important;
    min-width: 0 !important;
    padding-right: 2px !important;
  }
  /* The relocated ring's composer slot is a 0×0 flex item that still
     occupies its gap on both sides — hide the whole root so the model
     selector sits directly against the send button. */
  [data-phase] [class$="_trailing"] > [class$="_root"]:has(button[aria-label*="context used"]),
  [data-phase] [class$="_trailing"] > [class$="_root"]:has(button[aria-label*="上下文已用"]) {
    display: none !important;
  }
}
[data-mobile-nav="ctx-effort"] {
  display: inline-flex;
  align-items: center;
  height: 20px;
  margin: 0 4px 0 4px;
  color: var(--dsw-alias-label-primary, #000);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
  flex: none;
}
[data-mobile-nav="ctx-effort"][hidden] {
  display: none;
}

/* Mini context breakdown panel (opened by tapping the relocated ring). */
[data-mobile-nav="ctx-panel"] {
  position: fixed;
  z-index: 200;
  width: 272px;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .15));
  background: var(--dsw-specific-menu, #fff);
  box-shadow: var(--dsw-shadow-lv3, 0 12px 32px rgba(0, 0, 0, .18));
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary, inherit);
  animation: dsh-mobile-shell-fade .14s var(--ds-ease-out, ease-out);
}
[data-mobile-nav="ctx-panel-head"] {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  color: var(--dsw-alias-label-primary, inherit);
  font-weight: 500;
  margin-bottom: 6px;
}
[data-mobile-nav="ctx-panel-figures"] {
  flex: none;
  color: var(--dsw-alias-label-tertiary, inherit);
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}
[data-mobile-nav="ctx-panel-bar"] {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06));
  border-radius: 999px;
  height: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}
[data-mobile-nav="ctx-panel-fill"] {
  background: var(--dsw-alias-state-business-primary, #4f6ef7);
  border-radius: 999px;
  height: 100%;
  transition: width .2s var(--ds-ease-out, ease-out);
}
[data-mobile-nav="ctx-panel-body"] {
  color: var(--dsw-alias-label-tertiary, inherit);
  font-size: 11px;
  line-height: 17px;
  white-space: pre-wrap;
}
@media (prefers-reduced-motion: reduce) {
  [data-mobile-nav="ctx-panel"] {
    animation: none !important;
  }
}

/* ---- Reasoning levels card (settings Models tab, custom providers) ---- */
li[data-mobile-nav="reasoning-card"] {
  list-style: none !important;
  margin: 0 !important;
  padding: 10px 12px !important;
  background: var(--dsw-alias-bg-module, #ffffff);
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .08));
  border-radius: 10px;
  box-sizing: border-box;
}
[data-mobile-nav="reasoning-title"] {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
[data-mobile-nav="reasoning-desc"] {
  margin-top: 3px;
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, inherit);
}
[data-mobile-nav="reasoning-provider"] {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--dsw-alias-border-l3, rgba(0, 0, 0, .1));
}
[data-mobile-nav="reasoning-provider-name"] {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}
[data-mobile-nav="reasoning-provider-route"] {
  font-size: 10px;
  font-weight: 400;
  opacity: .55;
}
[data-mobile-nav="reasoning-model"] {
  margin-top: 6px;
}
[data-mobile-nav="reasoning-model-name"] {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, inherit);
  margin-bottom: 4px;
}
[data-mobile-nav="reasoning-chips"] {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
[data-mobile-nav="reasoning-chip"] {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, .14));
  background: transparent;
  color: var(--dsw-alias-label-secondary, inherit);
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
[data-mobile-nav="reasoning-chip"].on {
  background: var(--dsw-alias-state-business-primary, #4f6ef7);
  border-color: var(--dsw-alias-state-business-primary, #4f6ef7);
  color: #ffffff;
}
[data-mobile-nav="reasoning-default"] {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, inherit);
}
[data-mobile-nav="reasoning-default-select"] {
  appearance: auto;
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, .14));
  border-radius: 6px;
  background: var(--dsw-alias-bg-module, #ffffff);
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 11px;
  padding: 2px 4px;
  min-height: 26px;
}
[data-mobile-nav="reasoning-save-row"] {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
[data-mobile-nav="reasoning-save"] {
  appearance: none;
  border: none;
  border-radius: 999px;
  background: var(--dsw-alias-state-business-primary, #4f6ef7);
  color: #ffffff;
  font-size: 12px;
  padding: 5px 18px;
  cursor: pointer;
}
[data-mobile-nav="reasoning-save"]:disabled {
  opacity: .55;
}
[data-mobile-nav="reasoning-status"] {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, inherit);
}
[data-mobile-nav="reasoning-empty"] {
  margin-top: 8px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, inherit);
}

/* ---------- plugin marketplace (Settings → 插件市场) ---------- */
.mkt-page{box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:4px 4px 28px;color:var(--dsw-alias-label-primary,inherit)}
.mkt-toolbar{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.mkt-search{position:relative;display:flex;align-items:center}
.mkt-search-ic{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-tertiary,inherit);pointer-events:none;display:inline-flex}
.mkt-search-ic svg{width:15px;height:15px}
.mkt-search-input{box-sizing:border-box;width:100%;height:36px;padding:0 12px 0 34px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-module,transparent);color:inherit;font:inherit;font-size:13px;outline:none;transition:border-color .16s,box-shadow .16s}
.mkt-search-input::placeholder{color:var(--dsw-alias-label-tertiary,inherit)}
.mkt-search-input:focus{border-color:var(--dsw-alias-state-business-primary,#4f6ef7);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#4f6ef7) 18%,transparent)}
.mkt-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;min-width:0}
.mkt-cat-wrap{position:relative;flex:0 0 auto;min-width:0}
.mkt-cat{box-sizing:border-box;width:132px;min-width:0;height:32px;padding:0 26px 0 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:999px;background:var(--dsw-alias-bg-module,transparent);color:inherit;font:inherit;font-size:12px;font-weight:500;cursor:pointer;outline:none;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:border-color .16s,box-shadow .16s}
.mkt-cat:hover{border-color:var(--dsw-alias-border-l1,rgba(0,0,0,.2))}
.mkt-cat:focus-visible,.mkt-cat[aria-expanded="true"]{border-color:var(--dsw-alias-state-business-primary,#4f6ef7);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#4f6ef7) 16%,transparent)}
.mkt-cat-chevron{position:absolute;right:9px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-tertiary,inherit);pointer-events:none;display:inline-flex}
.mkt-cat-chevron svg{width:12px;height:12px}
.mkt-cat-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:30;min-width:100%;width:max-content;max-width:236px;max-height:190px;overflow-y:auto;background:var(--dsw-specific-menu,#fff);color:var(--dsw-alias-label-primary,inherit);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.16);padding:4px;display:none;overscroll-behavior:contain}
.mkt-cat-menu.mkt-cat-open{display:block}
.mkt-cat-opt{display:block;width:100%;box-sizing:border-box;text-align:left;padding:7px 10px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap}
.mkt-cat-opt:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}
.mkt-cat-opt-active{background:var(--dsw-alias-state-business-primary,#4f6ef7);color:#fff}
.mkt-cat-opt-active:hover{background:var(--dsw-alias-state-business-primary,#4f6ef7)}
.mkt-sort-group{flex:1 1 auto;min-width:0;display:flex;flex-wrap:wrap;gap:6px}
.mkt-sort-btn{flex:1 1 110px;min-width:110px;height:32px;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:999px;background:var(--dsw-alias-bg-module,transparent);color:var(--dsw-alias-label-secondary,inherit);font:inherit;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background-color .16s,transform .1s,border-color .16s,color .16s}
.mkt-sort-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}
.mkt-sort-btn:active{transform:scale(.97)}
.mkt-sort-active{background:var(--dsw-alias-state-business-primary,#4f6ef7);border-color:var(--dsw-alias-state-business-primary,#4f6ef7);color:#fff}
.mkt-sort-active:hover{background:var(--dsw-alias-state-business-primary,#4f6ef7)}
.mkt-sort-active .mkt-ic-dir{color:#fff}
.mkt-ic-dir{flex:none;color:var(--dsw-alias-label-tertiary,inherit)}
.mkt-ic-dir svg{width:11px;height:11px}
/* The four settings pages (General / Models / Plugins / Agent presets) draw
   their setting cards with a grey tint inside the mobile settings sheet; pull
   them to the sheet's own white so the whole settings area reads cleanly. */
@media (max-width: 1023px) {
  html [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_row"],
  html [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowCard"],
  html [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_card"] {
    background: var(--dsw-specific-menu, #fff) !important;
  }
}
.mkt-meta{color:var(--dsw-alias-label-tertiary,inherit);font-size:12px;line-height:1.4;padding:0 2px}
.mkt-list{display:flex;flex-direction:column;gap:8px;width:100%}
.mkt-card{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:5px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.10));background:var(--dsw-alias-bg-module,transparent);border-radius:14px;padding:13px 15px;cursor:pointer;transition:transform .14s cubic-bezier(.16,1,.3,1),box-shadow .18s,border-color .18s;-webkit-tap-highlight-color:transparent}
.mkt-card:hover{transform:translateY(-1px);border-color:var(--dsw-alias-border-l1,rgba(0,0,0,.18));box-shadow:var(--dsw-shadow-lv2,0 6px 16px rgba(0,0,0,.07))}
.mkt-card:active{transform:scale(.985)}
.mkt-enter{opacity:0;animation:mkt-rise .28s cubic-bezier(.16,1,.3,1) forwards}
@keyframes mkt-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.mkt-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}
.mkt-name{margin:0;flex:1 1 auto;min-width:0;font-size:14px;font-weight:650;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mkt-time{flex:none;display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-tertiary,inherit);font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.10));border-radius:999px;padding:3px 9px;line-height:1;background:color-mix(in srgb,var(--dsw-alias-bg-module,transparent) 55%,transparent)}
.mkt-time-short{display:none}
@media (max-width:560px){.mkt-time-full{display:none}.mkt-time-short{display:inline}}
.mkt-ic-time{color:var(--dsw-alias-label-tertiary,inherit)}
.mkt-byline{color:var(--dsw-alias-label-tertiary,inherit);font-size:12px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mkt-desc{margin:0;color:var(--dsw-alias-label-secondary,inherit);font-size:12px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mkt-desc-translated{color:var(--dsw-alias-label-primary,inherit)}
.mkt-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}
.mkt-stars{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-tertiary,inherit);font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}
.mkt-ic{display:inline-flex;align-items:center;justify-content:center;line-height:0}
.mkt-ic svg{width:13px;height:13px}
.mkt-ic-star{color:#e3a008}
.mkt-ic-link{vertical-align:-1px}
.mkt-avatar-fallback{width:22px;height:22px;border-radius:50%;flex:none;color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;line-height:1;user-select:none}
.mkt-actions{display:flex;align-items:center;gap:6px}
.mkt-btn{border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;line-height:1;cursor:pointer;transition:background-color .16s,transform .1s,color .16s;font-family:inherit;white-space:nowrap}
.mkt-btn:active{transform:scale(.96)}
.mkt-btn:disabled{opacity:.55;cursor:default}
.mkt-install{background:var(--dsw-alias-state-business-primary,#4f6ef7);color:#fff}
.mkt-install.mkt-installed{background:var(--dsw-alias-state-success-primary,#2ea37f);color:#fff}
.mkt-translate{background:transparent;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));color:var(--dsw-alias-label-secondary,inherit)}
.mkt-busy{position:relative;color:transparent!important}
.mkt-busy::after{content:"";position:absolute;inset:0;margin:auto;width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:mkt-spin .7s linear infinite}
@keyframes mkt-spin{to{transform:rotate(360deg)}}
.mkt-sentinel{padding:12px 0 2px;text-align:center;color:var(--dsw-alias-label-tertiary,inherit);font-size:12px;min-height:8px}
.mkt-empty{padding:36px 16px;text-align:center;color:var(--dsw-alias-label-tertiary,inherit);font-size:13px}
.mkt-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translate(-50%,16px);background:var(--dsw-specific-menu,#fff);color:var(--dsw-alias-label-primary,inherit);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));box-shadow:var(--dsw-shadow-lv3,0 12px 32px rgba(0,0,0,.18));border-radius:12px;padding:10px 16px;font-size:13px;line-height:1.5;max-width:min(320px,calc(100vw - 32px));z-index:10050;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}
.mkt-toast-on{opacity:1;transform:translate(-50%,0)}
.mkt-toast-err{color:var(--dsw-alias-state-error-primary,inherit)}
/* GitHub-style repo window. The wrap is larger than the card so the X can
   sit fully outside the top-right corner without being clipped. */
.mkt-modal{position:fixed;inset:0;z-index:10040;display:flex;align-items:center;justify-content:center;padding:40px 28px;overflow:visible;pointer-events:none}
.mkt-backdrop{position:absolute;inset:0;background:rgba(1,4,9,.52);opacity:0;transition:opacity .2s;pointer-events:auto}
.mkt-backdrop-in{opacity:1}
.mkt-backdrop-out{opacity:0}
.mkt-win-wrap{position:relative;box-sizing:border-box;width:min(720px,calc(100vw - 56px));max-height:min(78vh,680px);padding:18px 18px 0 0;overflow:visible;opacity:0;transform:scale(.96) translateY(8px);transition:opacity .2s,transform .2s cubic-bezier(.16,1,.3,1);pointer-events:none}
.mkt-window-in{opacity:1;transform:none}
.mkt-window-out{opacity:0;transform:scale(.97) translateY(6px)}
.mkt-window{position:relative;box-sizing:border-box;width:100%;height:100%;max-height:min(78vh,680px);background:var(--dsw-specific-menu,#fff);color:var(--dsw-alias-label-primary,inherit);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:12px;box-shadow:0 16px 48px rgba(1,4,9,.28);display:flex;flex-direction:column;overflow:hidden;pointer-events:auto}
.mkt-close{position:absolute;top:0;right:0;z-index:2;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#1f2328;color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.28);transition:transform .16s,background-color .16s;font-family:inherit;padding:0;pointer-events:auto}
.mkt-close .mkt-ic svg{width:15px;height:15px}
.mkt-close:hover{transform:scale(1.08);background:#32383f}
.mkt-close:active{transform:scale(.96)}
.mkt-win-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.10));flex:none;background:var(--dsw-alias-bg-module-platform,rgba(0,0,0,.02))}
.mkt-win-ident{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.mkt-win-avatar,.mkt-win-avatar-fallback{width:32px;height:32px;border-radius:50%;flex:none;background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));object-fit:cover}
.mkt-win-avatar-fallback{color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center}
.mkt-win-meta{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.mkt-win-crumb{display:flex;align-items:baseline;min-width:0;font-size:14px;line-height:1.3;overflow:hidden}
.mkt-win-owner{color:var(--dsw-alias-label-primary,inherit);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mkt-win-owner:hover{text-decoration:underline}
.mkt-win-slash{color:var(--dsw-alias-label-tertiary,inherit);flex:none}
.mkt-win-repo{color:var(--dsw-alias-label-primary,inherit);font-weight:600;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mkt-win-repo:hover{text-decoration:underline;color:var(--dsw-alias-state-business-primary,#4f6ef7)}
.mkt-win-info{color:var(--dsw-alias-label-tertiary,inherit);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mkt-win-link{flex:none;display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-secondary,inherit);text-decoration:none;font-size:12px;font-weight:500;white-space:nowrap;padding:5px 10px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:8px}
.mkt-win-link:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.mkt-win-filebar{flex:none;display:flex;align-items:center;gap:8px;padding:0 16px;height:38px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.10));background:var(--dsw-alias-bg-module-platform,rgba(0,0,0,.015))}
.mkt-win-file{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary,inherit);padding:4px 0;border-bottom:2px solid var(--dsw-alias-state-business-primary,#4f6ef7);margin-right:auto}
.mkt-translate-md{flex:none;height:26px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:999px;background:var(--dsw-alias-bg-module,transparent);color:var(--dsw-alias-label-secondary,inherit);font-size:11.5px;font-weight:600;line-height:1;cursor:pointer;transition:background-color .16s,color .16s,border-color .16s;font-family:inherit}
.mkt-translate-md:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}
.mkt-translate-md:disabled{opacity:.55;cursor:default}
.mkt-readme-translated{position:relative;padding-left:14px}
.mkt-readme-translated::before{content:"";position:absolute;left:0;top:2px;bottom:2px;width:3px;border-radius:3px;background:var(--dsw-alias-state-business-primary,#4f6ef7);opacity:.55}
.mkt-win-body{overflow-y:auto;padding:16px 20px 24px;-webkit-overflow-scrolling:touch;min-height:140px;background:var(--dsw-specific-menu,#fff)}
.mkt-win-loading,.mkt-win-error{padding:28px 8px;text-align:center;color:var(--dsw-alias-label-tertiary,inherit);font-size:13px}
.mkt-win-error{color:var(--dsw-alias-state-error-primary,inherit)}
.mkt-readme{font-size:14px;line-height:1.7;word-break:break-word;color:var(--dsw-alias-label-primary,inherit)}
.mkt-readme h1,.mkt-readme h2,.mkt-readme h3,.mkt-readme h4{margin:18px 0 8px;color:var(--dsw-alias-label-primary,inherit);line-height:1.3;font-weight:600;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));padding-bottom:6px}
.mkt-readme h1{font-size:22px}.mkt-readme h2{font-size:18px}.mkt-readme h3{font-size:15px;border-bottom:none;padding-bottom:0}.mkt-readme h4{font-size:14px;border-bottom:none;padding-bottom:0}
.mkt-readme h1:first-child,.mkt-readme h2:first-child{margin-top:0}
.mkt-readme p{margin:8px 0}
.mkt-readme a{color:#0969da;text-decoration:none}
.mkt-readme a:hover{text-decoration:underline}
.mkt-readme ul,.mkt-readme ol{margin:8px 0;padding-left:22px}
.mkt-readme li{margin:3px 0}
.mkt-readme blockquote{margin:10px 0;padding:0 12px;border-left:3px solid var(--dsw-alias-border-l2,rgba(0,0,0,.16));color:var(--dsw-alias-label-secondary,inherit)}
.mkt-readme hr{border:none;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));margin:16px 0}
.mkt-readme pre{background:#f6f8fa;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:8px;padding:12px 14px;overflow-x:auto;margin:10px 0}
.mkt-readme code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;background:rgba(175,184,193,.2);border-radius:4px;padding:1px 4px}
.mkt-readme pre code{background:transparent;padding:0;font-size:12.5px}
.mkt-readme img{max-width:100%;border-radius:6px;background:transparent}
.mkt-readme del{color:var(--dsw-alias-label-tertiary,inherit)}
.mkt-readme .mkt-table-wrap{overflow-x:auto;margin:10px 0;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.10));border-radius:8px}
.mkt-readme table{border-collapse:collapse;width:100%;font-size:13px;line-height:1.5}
.mkt-readme th,.mkt-readme td{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.10));padding:7px 12px;text-align:left;vertical-align:top}
.mkt-readme thead th{background:var(--dsw-alias-bg-module-platform,rgba(0,0,0,.03));font-weight:600;white-space:nowrap}
.mkt-readme tr:nth-child(2n) td{background:var(--dsw-alias-bg-module-platform,rgba(0,0,0,.015))}
.mkt-readme .mkt-task{list-style:none;margin-left:-22px}
.mkt-readme .mkt-task input[type=checkbox]{margin-right:8px;accent-color:var(--dsw-alias-state-business-primary,#4f6ef7);vertical-align:-1px}
.mkt-readme .mkt-task-done{color:var(--dsw-alias-label-tertiary,inherit)}

/* ---- GitHub Token settings page ---- */
.ghk-page{padding:16px 16px 28px;max-width:560px}
.ghk-card{
  padding:16px 16px 14px;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));
  border-radius:14px;
  background:var(--dsw-alias-bg-module,#fff);
}
.ghk-title{font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}
.ghk-desc{margin:6px 0 12px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,inherit)}
.ghk-status{font-size:12px;font-weight:500;margin-bottom:10px;color:var(--dsw-alias-label-secondary,inherit)}
.ghk-status[data-state="on"]{color:var(--dsw-alias-state-success,#2f9e44)}
.ghk-status[data-state="off"]{color:var(--dsw-alias-label-tertiary,inherit)}
.ghk-input{
  width:100%;
  box-sizing:border-box;
  min-height:40px;
  padding:8px 12px;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));
  border-radius:10px;
  background:var(--dsw-alias-bg-module-platform,transparent);
  color:inherit;
  font-size:14px;
}
.ghk-actions{display:flex;gap:8px;margin-top:12px}
.ghk-save,.ghk-clear{
  min-height:36px;
  padding:0 14px;
  border-radius:10px;
  font-size:13px;
  font-weight:500;
  cursor:pointer;
}
.ghk-save{
  border:none;
  background:var(--dsw-alias-state-business-primary,#4f6ef7);
  color:#fff;
}
.ghk-clear{
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));
  background:transparent;
  color:inherit;
}
.ghk-hint{min-height:18px;margin-top:10px;font-size:12px;color:var(--dsw-alias-label-tertiary,inherit)}
.ghk-hint[data-err="1"]{color:var(--dsw-alias-state-danger,#d9480f)}

`;
};
__modules["locales.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandDescriptionsZh = exports.en = exports.zh = exports.NS = void 0;
/** `mobileNav` namespace dictionaries: drawer controls. */
exports.NS = 'mobileNav';
/** Simplified Chinese dictionary (the key-set source of truth). */
exports.zh = {
    'open': '打开目录',
    'close': '收起目录',
    'backdrop': '点击关闭目录',
    'sessionLog': '导出会话日志',
    'files': '文件浏览',
    // Status view tab + panel copy.
    'view.status': '状态',
    'market.title': '插件市场',
    'status.running': '运行中',
    'status.idle': '空闲',
    'status.turns': '轮数',
    'status.steps': '步数',
    'status.llmTime': '模型耗时',
    'status.toolTime': '工具耗时',
    'status.ttft': '首字延迟',
    'status.decode': '解码耗时',
    'status.tokens': '输出 tokens',
    'status.throughput': '解码速率',
    'status.cacheHit': '缓存命中',
    'status.inputTokens': '输入 tokens',
    'status.outputTokens': '输出 tokens',
    'status.tools': '运行中工具',
    'status.session': '会话',
    'status.phase': '阶段',
    'status.error': '最近错误',
    'status.none': '无',
    'status.blank': '空白会话',
    'status.removed': '已移除',
    'status.subagent': '子代理',
    'status.loadingOlder': '加载历史…',
    'status.exportLog': '导出会话日志',
    // Session delete (kebab menu addition + confirm dialog).
    'delete.menu': '删除对话',
    'delete.title': '删除对话',
    'delete.desc': '将永久删除会话“{name}”及其全部消息，此操作不可恢复。',
    'delete.confirm': '删除',
    'delete.cancel': '取消',
    'delete.close': '关闭',
    'delete.pending': '正在删除…',
    'delete.failed': '删除失败，请稍后重试。',
    'delete.running': '该会话正在运行，无法删除。',
    'delete.resolveError': '无法定位该会话，请重试。',
    // Chat font size controls (tab-bar rail).
    'font.smaller': '缩小对话字号',
    'font.larger': '放大对话字号',
    // Composer file attachments (attach button + dock rail + send-time text).
    'attach.label': '添加附件',
    'attach.aria': '选择图片或文件附加到消息',
    'attach.sendFiles': '发送附件',
    'attach.remove': '移除 {name}',
    'attach.tooManyImages': '一次最多添加 {count} 张图片',
    'attach.tooManyFiles': '一次最多添加 {count} 个文件',
    'attach.unsupported': '不支持的文件类型：{name}',
    'attach.imageFailed': '图片 {name} 添加失败',
    'attach.readFailed': '文件 {name} 读取失败',
    'attach.truncated': '（内容过长，仅保留前 100000 字符）',
    'attach.unreadable': '（该文件内容无法解析，仅提示文件名）',
    'attach.filePrefix': '[附件] {name}',
    'attach.fold': '附件内容 · 共 {chars} 字 · 点击展开',
    'attach.imagePath': '图片文件：{path}',
    'attach.imageHint': '（当前模型不支持直接查看图片，可调用 vision 工具读取该文件）',
    'attach.fallbackFailed': '图片降级失败：{error}',
    // Background jobs section (moved into the Status tab on mobile).
    'jobs.title': '后台任务',
    'jobs.countLive': '{count} 运行中',
    'jobs.count': '{count} 个',
    'jobs.status.running': '运行中',
    'jobs.status.stopping': '正在停止',
    'jobs.status.completed': '已完成',
    'jobs.status.killed': '已取消',
    'jobs.status.failed': '已失败',
    'jobs.duration.seconds': '{seconds}秒',
    'jobs.duration.minutes': '{minutes}分{seconds}秒',
    'jobs.duration.hours': '{hours}小时{minutes}分',
    // Context panel: the delta between pressure (input + cache traffic) and
    // the content breakdown rows.
    'ctx.other': '其他（缓存读写等）~{tokens}',
    'github.title': 'GitHub Token',
};
/** English dictionary, key-identical to the Chinese source of truth. */
exports.en = {
    'open': 'Open directory',
    'close': 'Close directory',
    'backdrop': 'Click to close directory',
    'sessionLog': 'Session log',
    'files': 'Files',
    'view.status': 'Status',
    'market.title': 'Plugin Market',
    'status.running': 'Running',
    'status.idle': 'Idle',
    'status.turns': 'Turns',
    'status.steps': 'Steps',
    'status.llmTime': 'LLM time',
    'status.toolTime': 'Tool time',
    'status.ttft': 'TTFT',
    'status.decode': 'Decode',
    'status.tokens': 'Output tokens',
    'status.throughput': 'Throughput',
    'status.cacheHit': 'Cache hit',
    'status.inputTokens': 'Input tokens',
    'status.outputTokens': 'Output tokens',
    'status.tools': 'Running tools',
    'status.session': 'Session',
    'status.phase': 'Phase',
    'status.error': 'Last error',
    'status.none': 'None',
    'status.blank': 'Blank session',
    'status.removed': 'Removed',
    'status.subagent': 'Subagent',
    'status.loadingOlder': 'Loading older…',
    'status.exportLog': 'Export session log',
    'delete.menu': 'Delete session',
    'delete.title': 'Delete session',
    'delete.desc': 'Permanently delete session “{name}” and all of its messages. This cannot be undone.',
    'delete.confirm': 'Delete',
    'delete.cancel': 'Cancel',
    'delete.close': 'Close',
    'delete.pending': 'Deleting…',
    'delete.failed': 'Delete failed. Please try again later.',
    'delete.running': 'This session is running and cannot be deleted.',
    'delete.resolveError': 'Could not locate this session. Please try again.',
    'font.smaller': 'Decrease chat font size',
    'font.larger': 'Increase chat font size',
    'attach.label': 'Add attachment',
    'attach.aria': 'Pick images or files to attach to the message',
    'attach.sendFiles': 'Send attachments',
    'attach.remove': 'Remove {name}',
    'attach.tooManyImages': 'Up to {count} images per message',
    'attach.tooManyFiles': 'Up to {count} files per message',
    'attach.unsupported': 'Unsupported file type: {name}',
    'attach.imageFailed': 'Could not add image {name}',
    'attach.readFailed': 'Could not read file {name}',
    'attach.truncated': ' (content too long; first 100000 chars kept)',
    'attach.unreadable': ' (file content could not be parsed; name only)',
    'attach.filePrefix': '[Attachment] {name}',
    'attach.fold': 'Attachment content · {chars} chars · tap to expand',
    'attach.imagePath': 'Image file: {path}',
    'attach.imageHint': ' (the active model cannot view images directly; a vision tool can read this file)',
    'attach.fallbackFailed': 'Image fallback failed: {error}',
    'jobs.title': 'Background jobs',
    'jobs.countLive': '{count} running',
    'jobs.count': '{count}',
    'jobs.status.running': 'running',
    'jobs.status.stopping': 'stopping',
    'jobs.status.completed': 'completed',
    'jobs.status.killed': 'killed',
    'jobs.status.failed': 'failed',
    'jobs.duration.seconds': '{seconds}s',
    'jobs.duration.minutes': '{minutes}m {seconds}s',
    'jobs.duration.hours': '{hours}h {minutes}m',
    'ctx.other': 'Other (cache traffic etc.) ~{tokens}',
    'github.title': 'GitHub Token',
};
/**
 * Chinese descriptions for host-registered slash commands shown in the
 * composer command menu. The host catalog carries English-only descriptions
 * (no host-side i18n), so the mobile shell translates them client-side,
 * keyed by command name (stable across versions), gated on the active
 * locale being Chinese. Unknown commands keep their original description.
 */
exports.commandDescriptionsZh = {
    'compact': '压缩较早的对话历史',
    'export': '将本会话日志导出为 ZIP 压缩包',
    'feedback': '记录对本会话的反馈',
    'goal': '查看或设置长期运行任务的目标',
    'permission': '切换权限预设（沙箱模式 + 审批策略）',
    'plan': '进入或退出规划模式',
};
};
__modules["index.js"] = function (require, module, exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = void 0;
exports.apply = apply;
const MobileNavToggle_tsx_1 = require("./MobileNavToggle.js");
const MobileNavOverlay_tsx_1 = require("./MobileNavOverlay.js");
const MobileStatusView_tsx_1 = require("./MobileStatusView.js");
const MarketplaceView_tsx_1 = require("./MarketplaceView.js");
const GithubKeyView_tsx_1 = require("./GithubKeyView.js");
const ComposerAttach_tsx_1 = require("./ComposerAttach.js");
const attachmentStore_ts_1 = require("./attachmentStore.js");
const mobile_css_ts_1 = require("./mobile.css.js");
const locales_ts_1 = require("./locales.js");
/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
exports.inject = ['slots', 'layout', 'locale', 'sessionLogDownload', 'conversation', 'sessions'];
/**
 * Serialize pending file attachments into the prompt text appended at send
 * time. The model receives one labelled block per file; unreadable parses
 * degrade to a filename-only marker instead of dropping the attachment.
 */
function buildAttachmentText(files, t) {
    return files
        .map((file) => {
        let body = file.text;
        if (body === '')
            body = t('attach.unreadable');
        else if (file.truncated)
            body = `${body}${t('attach.truncated')}`;
        // Hard paragraph break (\n\n) so the "[附件] name" line renders as its
        // own block; the fold pass below then has clean blocks to collapse.
        return `${t('attach.filePrefix', { name: file.name })}\n\n${body}`;
    })
        .join('\n\n');
}
/**
 * Mobile-adaptive shell, browser half: injects the mobile stylesheet, then
 * contributes the directory toggle to the session header and the backdrop +
 * floating button to the shell overlay.
 * @param ctx - client root context.
 */
function apply(ctx) {
    ctx.effect(() => ctx.locale.register(locales_ts_1.NS, { zh: locales_ts_1.zh, en: locales_ts_1.en }), 'dsh-mobile-shell: dictionaries');
    const t = ctx.locale.bind(locales_ts_1.NS);
    // Structural composer detection, independent of our data-mobile-nav-composer
    // stamp. The official composer textarea lives inside the grow wrapper
    // ([class$="_grow"], the only _grow class in the whole client graph) as a
    // sibling of the hidden mirror ([data-input-mirror]) — a stable, hashed-name
    // and attribute based fingerprint that works even in the microtask window
    // before the MutationObserver stamps our marker after a React commit.
    // The card is the closest [class$="_card"] ancestor of the textarea.
    const composerCardOf = (node) => {
        if (!(node instanceof Element))
            return null;
        const textarea = node instanceof HTMLTextAreaElement ? node : node.closest('textarea');
        if (textarea === null)
            return null;
        const card = textarea.closest('[class$="_card"]');
        if (card === null)
            return null;
        if (!card.hasAttribute('data-mobile-nav-composer')) {
            const parent = textarea.parentElement;
            if (parent === null || parent.querySelector('[data-input-mirror]') === null)
                return null;
        }
        return card;
    };
    /** (Re-)stamp a composer card's markers; idempotent, safe on any pass. */
    const stampComposerCard = (card, textarea) => {
        card.setAttribute('data-mobile-nav-composer', '');
        const heroEmpty = card.closest('[data-phase="hero"]') !== null && textarea.value === '';
        if (heroEmpty)
            card.setAttribute('data-mobile-nav-hero-empty', '');
        else
            card.removeAttribute('data-mobile-nav-hero-empty');
    };
    // One-shot update notice: after a plugin update the page must be reloaded
    // to pick up the new client bundle, and stale tabs are hard to tell apart
    // from updated ones. Show a brief toast exactly once per version (tracked
    // in localStorage) so the user can confirm which bundle is running.
    ctx.effect(() => {
        const VERSION = '0.1.7';
        const KEY = 'dsh-mobile-shell:last-seen-version';
        try {
            if (localStorage.getItem(KEY) === VERSION)
                return () => { };
            localStorage.setItem(KEY, VERSION);
        }
        catch {
            return () => { };
        }
        const el = document.createElement('div');
        el.setAttribute('data-mobile-nav', 'update-toast');
        el.textContent = `手机UI插件已更新 v${VERSION}，本页已是新界面`;
        document.body.appendChild(el);
        window.setTimeout(() => el.remove(), 3200);
        return () => {
            el.remove();
        };
    }, 'dsh-mobile-shell: update notice');
    // Host slash-command descriptions are English-only (no host-side i18n);
    // translate them for the composer command menu when the UI locale is
    // Chinese. Patch the session-keyed directory's fetch (read at pull time),
    // so every catalog refresh — including `commands/change` repulls — flows
    // through the translation; contributions (e.g. /model) are already
    // localized by their own namespaces.
    ctx.effect(() => {
        const commandUi = ctx.get('commandUi');
        if (commandUi?.directory === undefined)
            return () => { };
        const originalFetch = commandUi.directory.fetchCommands;
        commandUi.directory.fetchCommands = async (sessionId) => {
            const rows = await originalFetch(sessionId);
            if (ctx.locale.getLocale().active !== 'zh')
                return rows;
            return rows.map((row) => {
                const translated = locales_ts_1.commandDescriptionsZh[row.name];
                return translated !== undefined && translated !== row.description ? { ...row, description: translated } : row;
            });
        };
        // The directory caches one snapshot per session; drop the stale
        // snapshots whenever the locale (or any dictionary) changes so the next
        // pull re-translates with the active locale.
        const unsubscribe = ctx.locale.subscribe(() => commandUi.directory.invalidateAll());
        return () => {
            unsubscribe();
            commandUi.directory.fetchCommands = originalFetch;
        };
    }, 'dsh-mobile-shell: command descriptions');
    // File attachments: images ride the core draft pipeline; text-ish files
    // (txt/md/code/docx) sit in the pending store and their extracted text is
    // appended to the message at send time. The official primary button stays
    // disabled while the draft is empty, so the dock rail carries its own
    // Send action; both wraps land on instance methods the callers read at
    // call time, which is tracker-safe (the cordis Service proxy forwards
    // property reads/writes to the raw instance).
    ctx.effect(() => {
        const conversation = ctx.conversation;
        if (conversation?.input?.shell === undefined)
            return () => { };
        // The cordis Service tracker rebinds ctx per property access, and an
        // assignment THROUGH the proxy lands on a shadow, invisible to other
        // callers' proxies. Reach the raw instance via the tracker's escape
        // hatch (Symbol.for('cordis.original')) so the wrapped methods are
        // visible to every proxy that reads them.
        const raw = conversation[Symbol.for('cordis.original')];
        const target = (raw ?? conversation);
        // The machine refuses an empty-draft submit (onEnter returns []), so
        // files-only sends route directly into the sink — the same path the
        // wrapped sink takes for typed sends. The sessions service is tracker-
        // wrapped too, so bind through the raw instance (same escape hatch).
        const rawSessions = ctx.sessions[Symbol.for('cordis.original')] ?? ctx.sessions;
        const binding = rawSessions.binding.bind(rawSessions);
        target.submitFiles = (sessionId) => {
            const entry = binding(sessionId);
            if (entry === undefined)
                return;
            input.sink(entry.session, '', [], 'queue');
        };
        (0, ComposerAttach_tsx_1.initComposerAttach)(target, t);
        const input = conversation.input;
        const originalSink = input.sink.bind(input);
        // Same tracker caveat as input.sink: method reads through the Service
        // proxy need an explicit receiver, or `this` is undefined in the
        // original implementation (strict mode) and the vision fallback below
        // would throw inside its try/catch and silently re-surface the host
        // error instead of degrading the image to a file reference.
        const originalDraftImages = conversation.draftImages.bind(conversation);
        input.sink = (session, text, imageIds, mode) => {
            try {
                const sessionId = session?.sessionId;
                if (typeof sessionId === 'string' && sessionId !== '') {
                    const files = (0, attachmentStore_ts_1.pendingAttachmentsOf)(sessionId);
                    if (files.length > 0) {
                        appendedOriginal = text;
                        const appended = buildAttachmentText(files, t);
                        text = text === '' ? appended : `${text}\n\n${appended}`;
                    }
                }
            }
            catch {
                // Attachment wrapping must never block a send.
            }
            // CRITICAL: the original sink returns the admission Promise that the
            // input machine's settleSubmit() awaits to emit "submit-settled" (which
            // flips the phase back from "submitting" → "plain"). Without `return`,
            // the machine receives undefined, crashes on `undefined.then(...)`
            // BEFORE publishing the phase change, and the composer is left
            // readOnly/"submitting" forever — a dead input box after every send.
            return originalSink(session, text, imageIds, mode);
        };
        // Original draft text while files are being appended (see sink wrap):
        // the core restores the SUBMITTED text on failure, which would leave the
        // raw [附件] block in the input — put the user's own draft back.
        let appendedOriginal = null;
        const originalSendSession = target.sendSession;
        target.sendSession = async (session, text, imageIds, mode) => {
            const original = appendedOriginal;
            appendedOriginal = null;
            try {
                // The original prototype method needs `this` = the service instance
                // (it reads this.draftImages / this.serializeImages / this.releaseDraftImages);
                // invoke it with the raw instance as receiver.
                const result = await originalSendSession.call(target, session, text, imageIds, mode);
                (0, attachmentStore_ts_1.clearAttachments)(session.sessionId);
                return result;
            }
            catch (error) {
                if (original !== null) {
                    // Run after the core sink's own restore (which writes the appended
                    // text back into the empty draft) and put the user's text back.
                    const shell = conversation.input.shell(session.sessionId);
                    queueMicrotask(() => {
                        shell.setDraft(original);
                    });
                }
                // Vision fallback: the active model may reject image input outright
                // (attachment-error), yet the harness ships vision tools the model
                // CAN call — they just need a file path inside the session workspace.
                // Store each draft image there and resend the message as a text
                // reference ([附件] card); the model then reads the file via tools.
                if (imageIds.length > 0) {
                    try {
                        const shell = conversation.input.shell(session.sessionId);
                        const drafts = originalDraftImages(imageIds);
                        const parts = [];
                        for (const draft of drafts) {
                            // The browser RPC interceptor only accepts JSON bodies, so the
                            // image rides as base64 (chunked to avoid stack overflow on
                            // large files).
                            const buf = await draft.file.arrayBuffer();
                            const bytes = new Uint8Array(buf);
                            let binary = '';
                            for (let i = 0; i < bytes.length; i += 0x8000) {
                                binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
                            }
                            const res = await fetch('/api/mobile-nav/store-image', {
                                method: 'POST',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                    name: draft.file.name,
                                    sessionId: session.sessionId,
                                    data: btoa(binary),
                                }),
                            });
                            const payload = (await res.json().catch(() => null));
                            if (payload?.ok !== true || typeof payload.path !== 'string')
                                throw new Error('store-image failed');
                            parts.push(`${t('attach.filePrefix', { name: draft.file.name })}\n\n${t('attach.imagePath', { path: payload.path })}\n${t('attach.imageHint')}`);
                        }
                        if (parts.length > 0) {
                            for (const id of imageIds)
                                shell.removeImage(id);
                            const fallback = text === '' ? parts.join('\n\n') : `${text}\n\n${parts.join('\n\n')}`;
                            const result = await originalSendSession.call(target, session, fallback, [], mode);
                            (0, attachmentStore_ts_1.clearAttachments)(session.sessionId);
                            return result;
                        }
                    }
                    catch (fallbackError) {
                        // fallback failed too — surface WHY so the failure is not silent
                        (0, ComposerAttach_tsx_1.toast)('attach.fallbackFailed', {
                            error: fallbackError instanceof Error ? fallbackError.message.slice(0, 120) : String(fallbackError),
                        });
                    }
                }
                throw error;
            }
        };
        return () => {
            input.sink = originalSink;
            target.sendSession = originalSendSession;
        };
    }, 'dsh-mobile-shell: file attachment send');
    ctx.effect(() => {
        const tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-mobile-shell';
        tag.dataset.pluginCss = 'dsh-mobile-shell/mobile.css';
        tag.textContent = mobile_css_ts_1.MOBILE_CSS;
        document.head.appendChild(tag);
        return () => {
            tag.remove();
        };
    }, 'dsh-mobile-shell: styles');
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
        const narrow = window.matchMedia('(max-width: 1023px)');
        const viewport = document.querySelector('meta[name="viewport"]');
        const originalViewport = viewport?.content ?? '';
        const themeMeta = document.createElement('meta');
        themeMeta.name = 'theme-color';
        const bodyBg = () => getComputedStyle(document.body).backgroundColor;
        const sync = () => {
            if (viewport !== null) {
                // interactive-widget=resizes-content (Chrome 108+): when the soft
                // keyboard opens, the layout viewport shrinks so the bottom-pinned
                // composer sits flush against the keyboard. Without it Chrome
                // defaults to resizes-visual — the layout viewport stays tall and
                // the composer floats above a dead blank strip between it and the
                // keyboard. Older browsers ignore the unknown token.
                viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content';
            }
            themeMeta.content = bodyBg();
            if (themeMeta.parentElement === null)
                document.head.appendChild(themeMeta);
        };
        const restore = () => {
            if (viewport !== null)
                viewport.content = originalViewport;
            themeMeta.remove();
        };
        const onGestureStart = (event) => event.preventDefault();
        if (narrow.matches)
            sync();
        const onChange = (event) => (event.matches ? sync() : restore());
        narrow.addEventListener('change', onChange);
        const observer = new MutationObserver(() => {
            if (narrow.matches)
                themeMeta.content = bodyBg();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
        document.addEventListener('gesturestart', onGestureStart);
        return () => {
            narrow.removeEventListener('change', onChange);
            observer.disconnect();
            document.removeEventListener('gesturestart', onGestureStart);
            restore();
        };
    }, 'dsh-mobile-shell: status bar theme + viewport + zoom guard');
    // Unified structural markup on narrow screens. The stylesheet used to
    // express these with :has() selectors (32 of them, several nested) — on a
    // phone every DOM change (tab switches re-mount the whole chat tree) made
    // the browser re-evaluate all of them, which is exactly the jank felt when
    // switching Chat / Trajectory / Status. Replace them with one merged
    // MutationObserver that stamps stable data attributes; the style rules now
    // key off those attributes only.
    ctx.effect(() => {
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        let scheduled = false;
        // Drawer switch gate. Opening/closing the drawer mounts/unmounts the whole
        // session list: the React commit (a ~60ms main-thread task on desktop,
        // more on a phone) runs BEFORE the CSS transition even starts, so a
        // getAnimations()-based gate misses exactly the busiest window — and
        // getAnimations() itself forces a style flush per call. Instead the gate
        // is a defer flag armed by the frame's collapsed-attribute mutation and
        // the transition events, and a 420ms timer flushes one consolidated sync
        // after the switch settles. Zero style queries.
        let deferred = false;
        let switchTimer = 0;
        const armSwitch = () => {
            deferred = true;
            if (switchTimer !== 0)
                window.clearTimeout(switchTimer);
            switchTimer = window.setTimeout(() => {
                switchTimer = 0;
                if (deferred) {
                    deferred = false;
                    sync();
                }
            }, 420);
        };
        const sync = () => {
            scheduled = false;
            // Composer markers first, BEFORE the drawer-switch gate: after a send /
            // session switch the whole chat tree re-mounts, and if this stamp lags
            // behind the React commit the official textarea can be focused with the
            // IME closed while our CSS (and the tap recovery handlers) key off the
            // stamp. The stamp is cheap and idempotent — never let the gate delay it.
            for (const card of document.querySelectorAll('[data-phase] [class*="_card"]')) {
                const textarea = card.querySelector('textarea');
                if (textarea !== null)
                    stampComposerCard(card, textarea);
                else {
                    card.removeAttribute('data-mobile-nav-composer');
                    card.removeAttribute('data-mobile-nav-hero-empty');
                }
            }
            if (deferred)
                return;
            // 1) Modal structure. The official settings panel is uniquely
            //    `dialog > nav + content` (the <nav> is implicit role=navigation
            //    and holds the section buttons). Every other modal — export,
            //    delete confirm, model picker — is a primitives Modal whose first
            //    child is a content/header block, never a <nav>. An earlier check
            //    required `[role=navigation] === null`, which inverted the match:
            //    real settings never got the full-page sheet, and delete/export
            //    were stretched to cover the viewport.
            let anyModal = false;
            for (const modal of document.querySelectorAll('[aria-modal="true"]')) {
                anyModal = true;
                const first = modal.firstElementChild;
                const isSettings = first instanceof HTMLElement &&
                    first.tagName === 'NAV' &&
                    first.querySelectorAll('button').length >= 2;
                if (isSettings)
                    modal.setAttribute('data-mobile-nav', 'settings-sheet');
                else if (modal.getAttribute('data-mobile-nav') === 'settings-sheet')
                    modal.removeAttribute('data-mobile-nav');
                const overlay = modal.parentElement;
                if (overlay !== null && isSettings)
                    overlay.setAttribute('data-mobile-nav', 'sheet-overlay');
                else if (overlay?.getAttribute('data-mobile-nav') === 'sheet-overlay')
                    overlay.removeAttribute('data-mobile-nav');
                // The "Open configuration file" action opens the settings document in
                // a native desktop editor (xdg-open / macOS open). A phone has no
                // such opener — the call can only ever fail — so hide the button.
                if (isSettings) {
                    for (const btn of modal.querySelectorAll('button')) {
                        if (/Open configuration file|打开配置文件/.test(btn.textContent ?? '')) {
                            btn.setAttribute('hidden', '');
                        }
                    }
                }
            }
            // 2) Body-level modal marker: hides the floating pet while any modal
            //    owns the screen (was body:has([aria-modal])).
            if (anyModal)
                document.body.setAttribute('data-mobile-nav', 'modal-open');
            else
                document.body.removeAttribute('data-mobile-nav');
            // 3) Message scroll area: user-message markdown typography (was
            //    [class$="_scroll"]:has(p)).
            for (const scroll of document.querySelectorAll('[data-phase] [class$="_scroll"]')) {
                if (scroll.querySelector('p, li, [class*="_text_"]') !== null)
                    scroll.setAttribute('data-mobile-nav', 'markdown');
                else
                    scroll.removeAttribute('data-mobile-nav');
            }
            // (Composer card markers — step 4 — now run at the top of sync(),
            //  before the drawer-switch gate, so the stamp never lags a React
            //  re-mount after send.)
            // 5) The Files header button is an entry for the dsh-web-ui explorer
            //    sheet; without the suite installed it is a dead control — hide it.
            const hasExplorer = document.querySelector('[data-aionui-explorer-col], .aionui-explorer-handle') !== null;
            for (const btn of document.querySelectorAll('[data-mobile-nav="files"]')) {
                if (hasExplorer)
                    btn.removeAttribute('hidden');
                else
                    btn.setAttribute('hidden', '');
            }
            // 6) Floating pet marker (was body > [class$="_float"]:has(...)).
            for (const el of Array.from(document.body.children)) {
                if (!(el instanceof HTMLElement))
                    continue;
                const sprite = el.querySelector('[class$="_sprite"][role="button"]');
                const isPet = /_float$/.test(el.className) && sprite !== null;
                if (isPet)
                    el.setAttribute('data-mobile-nav', 'pet');
                else if (el.getAttribute('data-mobile-nav') === 'pet')
                    el.removeAttribute('data-mobile-nav');
            }
            // 7) Native title tooltips ("black box, white text") are a desktop
            //    hover affordance; on touch they only surface on long-press and
            //    cover the UI. Drop every title attribute on narrow screens —
            //    aria-label (where present) keeps the accessibility name, and
            //    desktop is untouched (this effect only runs below 1024px).
            //    The attribute observer below also catches live updates (e.g. the
            //    header's token-usage label re-renders its title every turn).
            for (const el of document.querySelectorAll('[title]')) {
                el.removeAttribute('title');
            }
            // 6) Official session-status row (hidden on mobile; the Status tab
            //    shows the figures instead). The row has a hashed class, so mark
            //    it by text: a [class$=_root] carrying metrics text with no
            //    textarea (the composer card also ends in _root).
            for (const root of document.querySelectorAll('[data-phase] [class$="_root"]')) {
                if (root.closest('[class$="_composerStack"]') === null)
                    continue;
                const text = root.textContent ?? '';
                if (!/(turns|steps|\bLLM\b|轮|步)/.test(text))
                    continue;
                if (root.querySelector('textarea') !== null)
                    continue;
                root.setAttribute('data-mobile-nav', 'stats');
            }
        };
        const schedule = () => {
            if (scheduled)
                return;
            scheduled = true;
            // Microtask: coalesce every mutation of the current task into one
            // pass, still before the browser paints (no one-frame style flash).
            queueMicrotask(sync);
        };
        const observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
        const onInput = (event) => {
            const target = event.target;
            if (target === null || target.tagName !== 'TEXTAREA')
                return;
            const card = target.closest('[data-phase="hero"] [class$="_card"]');
            if (card === null) {
                target.closest('[class$="_card"]')?.removeAttribute('data-mobile-nav-hero-empty');
                return;
            }
            if (target.value === '')
                card.setAttribute('data-mobile-nav-hero-empty', '');
            else
                card.removeAttribute('data-mobile-nav-hero-empty');
        };
        document.addEventListener('input', onInput, true);
        // Arm the gate on the drawer's transform transition and on the frame's
        // collapsed-attribute flip (the latter covers the pre-transition React
        // commit, which mutates the tree before the transition starts). The end
        // event flushes early; the 420ms timer in armSwitch() is the backstop.
        const isDrawerSlide = (event) => {
            const target = event.target;
            if (target === null)
                return false;
            return (document.querySelector('[data-mobile-nav="frame"] > :first-child') === target &&
                event.propertyName === 'transform');
        };
        const onTransitionStart = (event) => {
            if (isDrawerSlide(event))
                armSwitch();
        };
        const onTransitionEnd = (event) => {
            if (!isDrawerSlide(event))
                return;
            if (switchTimer !== 0) {
                window.clearTimeout(switchTimer);
                switchTimer = 0;
            }
            if (deferred) {
                deferred = false;
                sync();
            }
        };
        document.addEventListener('transitionstart', onTransitionStart, true);
        document.addEventListener('transitionend', onTransitionEnd, true);
        const onCollapsedChange = () => {
            if (narrow.matches)
                armSwitch();
        };
        const collapsedObserver = new MutationObserver(onCollapsedChange);
        collapsedObserver.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ['data-sidebar-collapsed'],
        });
        // Live title updates (React re-renders set the attribute directly, which
        // the childList observer never sees). Strip on any title mutation; the
        // removal itself cannot re-trigger (the element no longer matches).
        const titleObserver = new MutationObserver(() => {
            if (!narrow.matches)
                return;
            for (const el of document.querySelectorAll('[title]')) {
                el.removeAttribute('title');
            }
        });
        titleObserver.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ['title'],
        });
        sync();
        return () => {
            observer.disconnect();
            collapsedObserver.disconnect();
            titleObserver.disconnect();
            document.removeEventListener('input', onInput, true);
            document.removeEventListener('transitionstart', onTransitionStart, true);
            document.removeEventListener('transitionend', onTransitionEnd, true);
            if (switchTimer !== 0)
                window.clearTimeout(switchTimer);
        };
    }, 'dsh-mobile-shell: markup markers');
    // File attachments must reach the model verbatim, but the official
    // renderer has no attachment channel for text files — the extracted body
    // rides the user-message text and would flood the transcript (a whole
    // novel, say, pushing earlier messages off-screen). After render, fold
    // everything below the "[附件] name" line into a native <details>
    // (inserted directly into the DOM we own — the renderer's no-HTML policy
    // does not apply). The message data is untouched, so the model still sees
    // the full content. Runs on narrow screens only.
    ctx.effect(() => {
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        // Per-extension file icon for the attachment card.
        const FILE_ICONS = {
            md: '📝', txt: '📄', docx: '📘', pdf: '📕', json: '🧾', yml: '🧾', yaml: '🧾',
            js: '💻', ts: '💻', py: '💻', sh: '💻', bash: '💻', sql: '🗄️', csv: '📊',
        };
        const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
        const fold = () => {
            for (const row of document.querySelectorAll('[data-phase] [class$="_userRow"]')) {
                const bubble = row.querySelector('[class$="_bubble"]');
                if (bubble === null || bubble.hasAttribute('data-mobile-nav-attach-folded'))
                    continue;
                const container = bubble.children.length === 1 ? bubble.firstElementChild : bubble;
                if (container === null)
                    continue;
                const text = (container.textContent ?? '').trim();
                const segments = text.split(/\n(?=(?:\[附件\]|\[Attachment\]) )/);
                let prefix = '';
                const blocks = segments.filter((segment, index) => {
                    const isBlock = /^(?:\[附件\]|\[Attachment\]) /.test(segment);
                    if (index === 0 && !isBlock) {
                        prefix = segment;
                        return false;
                    }
                    return isBlock;
                });
                if (blocks.length === 0)
                    continue;
                container.textContent = '';
                // Modern messenger layout: text stays in the bubble, attachments
                // render OUTSIDE it as media blocks (image thumbnails / file chips).
                // The full body (paths, hints) is for the model only — never shown.
                const host = bubble.parentElement;
                const media = document.createElement('div');
                media.setAttribute('data-mobile-nav', 'attach-media');
                // GalleyGrid rules (LobeChat): 1 image -> single column; 2-4 ->
                // two columns (4 = 2+2); more -> first row 3 columns + the rest.
                // Images first in one square-cropped grid, then text files as a
                // vertical chip list (WeChat/Telegram style).
                const images = [];
                const files = [];
                for (const block of blocks) {
                    const nl = block.indexOf('\n');
                    const nameLine = (nl === -1 ? block : block.slice(0, nl)).trim();
                    const body = (nl === -1 ? '' : block.slice(nl + 1)).trim();
                    if (body === '')
                        continue;
                    const name = nameLine.replace(/^(?:\[附件\]|\[Attachment\]) /, '');
                    const dot = name.lastIndexOf('.');
                    const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
                    if (IMAGE_EXTS.has(ext)) {
                        const pathMatch = body.match(/(?:图片文件|Image file)[:：]\s*(\S+)/);
                        const path = pathMatch?.[1];
                        if (path !== undefined) {
                            images.push({ name, src: `/api/mobile-nav/image?path=${encodeURIComponent(path)}` });
                        }
                    }
                    else {
                        files.push({ name, ext });
                    }
                }
                if (images.length > 0) {
                    // Horizontal thumbnail strip — the same mental model as the
                    // picker rail: small squares, swipe left/right, tap to zoom.
                    const strip = document.createElement('div');
                    strip.className = 'media-strip';
                    strip.setAttribute('data-mobile-nav', 'attach-strip');
                    for (const image of images) {
                        const img = document.createElement('img');
                        img.src = image.src;
                        img.alt = image.name;
                        img.loading = 'lazy';
                        img.setAttribute('data-mobile-nav', 'attach-thumb');
                        strip.append(img);
                    }
                    media.append(strip);
                }
                for (const file of files) {
                    const chip = document.createElement('div');
                    chip.className = 'attach-file-chip';
                    const icon = document.createElement('span');
                    icon.textContent = FILE_ICONS[file.ext] ?? '📄';
                    const nm = document.createElement('span');
                    nm.className = 'attach-chip-name';
                    nm.textContent = file.name;
                    chip.append(icon, nm);
                    media.append(chip);
                }
                if (media.childNodes.length > 0) {
                    if (host !== null)
                        host.append(media);
                    else
                        container.append(media);
                }
                if (prefix.trim() !== '') {
                    const lead = document.createElement('div');
                    lead.textContent = prefix.trim();
                    lead.style.whiteSpace = 'pre-wrap';
                    container.append(lead);
                }
                else {
                    // Pure-attachment message: hide the empty text bubble entirely.
                    bubble.setAttribute('data-mobile-nav', 'attach-only');
                }
                bubble.setAttribute('data-mobile-nav-attach-folded', '');
            }
        };
        // Lightbox: tap a thumbnail to view it full-screen; tap anywhere to
        // close, arrow buttons (or swipe) to move through the strip.
        let lightbox = null;
        const openLightbox = (thumbs, index) => {
            lightbox?.remove();
            const overlay = document.createElement('div');
            overlay.setAttribute('data-mobile-nav', 'lightbox');
            const image = document.createElement('img');
            let current = index;
            const show = (i) => {
                current = (i + thumbs.length) % thumbs.length;
                const thumb = thumbs[current];
                if (thumb === undefined)
                    return;
                image.src = thumb.src;
                image.alt = thumb.alt ?? '';
                prevBtn.style.display = thumbs.length > 1 ? '' : 'none';
                nextBtn.style.display = thumbs.length > 1 ? '' : 'none';
            };
            const prevBtn = document.createElement('button');
            prevBtn.className = 'lb-btn lb-prev';
            prevBtn.setAttribute('aria-label', 'previous');
            prevBtn.textContent = '‹';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'lb-btn lb-next';
            nextBtn.setAttribute('aria-label', 'next');
            nextBtn.textContent = '›';
            prevBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                show(current - 1);
            });
            nextBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                show(current + 1);
            });
            // Swipe to switch (touch).
            let startX = 0;
            overlay.addEventListener('touchstart', (event) => {
                startX = event.touches[0]?.clientX ?? 0;
            }, { passive: true });
            overlay.addEventListener('touchend', (event) => {
                const dx = (event.changedTouches[0]?.clientX ?? startX) - startX;
                if (Math.abs(dx) > 40) {
                    event.preventDefault();
                    show(current + (dx < 0 ? 1 : -1));
                }
            }, { passive: false });
            overlay.addEventListener('click', () => {
                overlay.remove();
                lightbox = null;
            });
            overlay.append(image, prevBtn, nextBtn);
            document.body.append(overlay);
            lightbox = overlay;
            show(index);
        };
        const onMediaTap = (event) => {
            const target = event.target;
            if (target === null || !(target instanceof HTMLImageElement))
                return;
            const strip = target.closest('[data-mobile-nav="attach-strip"]');
            if (strip === null)
                return;
            const thumbs = [...strip.querySelectorAll('img')];
            openLightbox(thumbs, thumbs.indexOf(target));
        };
        document.addEventListener('click', onMediaTap, true);
        fold();
        let raf = 0;
        const observer = new MutationObserver(() => {
            if (raf !== 0)
                return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                fold();
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            document.removeEventListener('click', onMediaTap, true);
            lightbox?.remove();
            if (raf !== 0)
                cancelAnimationFrame(raf);
        };
    }, 'dsh-mobile-shell: attachment fold');
    // On phones the soft-keyboard return key should insert a line break, not
    // send (sending goes through the send button). Desktop keeps Enter-to-send.
    // IME composition (Chinese pinyin confirm) and Shift+Enter are untouched.
    ctx.effect(() => {
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const onKeyDown = (event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.isComposing)
                return;
            const target = event.target;
            if (target === null || !(target instanceof HTMLTextAreaElement))
                return;
            if (composerCardOf(target) === null)
                return;
            event.preventDefault();
            event.stopPropagation();
            const start = target.selectionStart ?? target.value.length;
            const end = target.selectionEnd ?? start;
            target.setRangeText('\n', start, end, 'end');
            target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak' }));
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, 'dsh-mobile-shell: enter-to-newline');
    // Tapping "/" or "+" must NOT open the IME: official keepFocus on those
    // buttons refocuses the textarea. preventDefault only on those two —
    // NEVER on Send/Stop. Pointerdown preventDefault on the send button
    // suppresses the compatibility click on Android WebView, so new chats
    // cannot send at all.
    ctx.effect(() => {
        const onPointerDown = (event) => {
            if (!(event.target instanceof Element))
                return;
            if (composerCardOf(event.target) === null)
                return;
            const el = event.target.closest('button[aria-haspopup="listbox"], [data-mobile-nav="attach"]');
            if (el === null)
                return;
            event.preventDefault();
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
        };
    }, 'dsh-mobile-shell: no-keyboard command/attach taps');
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
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        // Conservative keyboard probe. With `interactive-widget=resizes-content`
        // the layout viewport itself shrinks when the IME opens, so the naive
        // innerHeight - visualViewport.height gap is ~0 while typing; a big gap
        // (>20% of the screen AND >120px) is the only case we trust as
        // "keyboard definitely open". False here only ever costs a redundant
        // blur+refocus on an EMPTY draft (see the value check in onPointerDown).
        const keyboardOpen = () => {
            const viewport = window.visualViewport;
            if (viewport === null)
                return false;
            const gap = window.innerHeight - viewport.height;
            return gap > 120 && gap > window.innerHeight * 0.2;
        };
        // A real user gesture on the textarea itself (IME intent). Taps on the
        // surrounding buttons do NOT count — keepFocus there must stay droppable.
        let userTappedTextarea = false;
        let tapTimer = 0;
        const markUserTap = () => {
            userTappedTextarea = true;
            if (tapTimer !== 0)
                window.clearTimeout(tapTimer);
            tapTimer = window.setTimeout(() => {
                tapTimer = 0;
                userTappedTextarea = false;
            }, 1500);
        };
        // Watch the submit cycle's readOnly/disabled flip on every composer
        // textarea we meet. readOnly makes the browser drop the IME; when it
        // flips back the field is still activeElement, and blurring there is the
        // only way the next tap counts as a fresh gesture.
        const observedTextareas = new WeakSet();
        const flipObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                const el = mutation.target;
                if (!(el instanceof HTMLTextAreaElement))
                    continue;
                if (el.readOnly || el.disabled)
                    continue;
                if (document.activeElement !== el)
                    continue;
                if (composerCardOf(el) === null)
                    continue;
                el.blur();
            }
        });
        const watchReadOnlyFlips = (textarea) => {
            if (textarea === null || observedTextareas.has(textarea))
                return;
            observedTextareas.add(textarea);
            flipObserver.observe(textarea, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
        };
        const onPointerDown = (event) => {
            if (!(event.target instanceof Element))
                return;
            const card = composerCardOf(event.target);
            if (card === null)
                return;
            const textarea = card.querySelector('textarea');
            if (textarea === null)
                return;
            stampComposerCard(card, textarea);
            watchReadOnlyFlips(textarea);
            if (event.target !== textarea)
                return;
            markUserTap();
            // Already focused from a programmatic send-focus / readOnly flip-back,
            // keyboard closed, draft empty (i.e. nothing to place a caret into):
            // blur so THIS tap re-focuses as a real gesture and the IME opens.
            if (document.activeElement === textarea && !keyboardOpen() && textarea.value === '')
                textarea.blur();
        };
        // Legacy-touch fallback (older WebViews without PointerEvent coverage):
        // the flag is what lets onFocusIn tell a user tap from programmatic focus.
        const onTouchStart = (event) => {
            if (!(event.target instanceof Element))
                return;
            if (event.target === composerCardOf(event.target)?.querySelector('textarea'))
                markUserTap();
        };
        const onFocusIn = (event) => {
            const focused = event.target;
            if (!(focused instanceof HTMLTextAreaElement))
                return;
            const card = composerCardOf(focused);
            if (card === null)
                return;
            stampComposerCard(card, focused);
            watchReadOnlyFlips(focused);
            if (userTappedTextarea)
                return;
            // Programmatic focus (send / session re-mount / keepFocus): drop it,
            // and keep dropping while React's focus effects re-run, so no
            // programmatic focus survives with the IME closed. Cap the rAF loop —
            // an unbounded blur/focus fight with React freezes the composer.
            let frames = 0;
            const drop = () => {
                if (userTappedTextarea)
                    return;
                if (document.activeElement !== focused)
                    return;
                if (frames++ > 12)
                    return;
                focused.blur();
                requestAnimationFrame(drop);
            };
            drop();
        };
        // Rescue: a tap on the textarea that did NOT end up focused (native
        // focus-on-tap suppressed after our pointerdown blur) is re-focused here,
        // inside the tap gesture, so the IME opens. readOnly (busy) / disabled
        // (workspace trigger) composers are left to their own handlers.
        const onPointerUp = (event) => {
            if (!(event.target instanceof HTMLTextAreaElement))
                return;
            const card = composerCardOf(event.target);
            if (card === null)
                return;
            const textarea = card.querySelector('textarea');
            if (textarea === null || textarea !== event.target)
                return;
            if (textarea.disabled || textarea.readOnly)
                return;
            if (document.activeElement === textarea)
                return;
            markUserTap();
            textarea.focus({ preventScroll: true });
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('touchstart', onTouchStart, true);
        document.addEventListener('pointerup', onPointerUp, true);
        document.addEventListener('focusin', onFocusIn, true);
        return () => {
            flipObserver.disconnect();
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('touchstart', onTouchStart, true);
            document.removeEventListener('pointerup', onPointerUp, true);
            document.removeEventListener('focusin', onFocusIn, true);
            if (tapTimer !== 0)
                window.clearTimeout(tapTimer);
        };
    }, 'dsh-mobile-shell: restore IME after send');
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
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const composerTextareas = () => [
            ...document.querySelectorAll('[data-input-mirror]'),
        ]
            .map((mirror) => mirror.parentElement?.querySelector('textarea'))
            .filter((ta) => ta instanceof HTMLTextAreaElement);
        // A stuck "submitting"/"adjudicating" phase (input machine dead-locked)
        // must be force-unlocked after a grace period: submitting settles in
        // milliseconds, so a phase that lingers means the settlement was lost.
        const BUSY_LINGER_MS = 30000;
        const busySince = new WeakMap();
        const diagnose = () => {
            for (const textarea of composerTextareas()) {
                const card = textarea.closest('[class$="_card"]');
                const phase = textarea.getAttribute('data-phase') ?? '?';
                const busy = phase === 'submitting' || phase === 'adjudicating';
                const heroTrigger = textarea.closest('[data-phase="hero"]') !== null &&
                    textarea.disabled &&
                    textarea.getAttribute('aria-haspopup') !== null;
                const rect = textarea.getBoundingClientRect();
                const cx = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
                const cy = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
                const top = document.elementFromPoint(cx, cy);
                const hitTextarea = top === textarea || (top !== null && textarea.contains(top));
                // Busy-phase emergency unlock: the phase is authoritative only while
                // it settles quickly; a lingering busy phase is a dead machine.
                if (busy) {
                    const since = busySince.get(textarea) ?? Date.now();
                    busySince.set(textarea, since);
                    if (Date.now() - since > BUSY_LINGER_MS) {
                        textarea.readOnly = false;
                    }
                }
                else {
                    busySince.delete(textarea);
                }
                // Self-heal: locked while the machine is idle and NOT the hero
                // workspace trigger → force re-enable (React re-locks only on state
                // changes; no re-render is coming). Also drop a leftover HTML
                // `inert` attribute on the card (distinct from data-phase="inert"),
                // which paints normally but swallows every tap.
                if (!busy && !heroTrigger) {
                    if (textarea.disabled || textarea.readOnly) {
                        textarea.disabled = false;
                        textarea.readOnly = false;
                    }
                    if (textarea.hasAttribute('inert'))
                        textarea.removeAttribute('inert');
                    if (card?.hasAttribute('inert'))
                        card.removeAttribute('inert');
                }
                // Covering layer inside the card: neutralize ONLY highlight/backdrop
                // overlays. Hitting the tool row / grow / send wrapper and setting
                // pointer-events:none is what made "/" "+" and send untappable.
                if (rect.width >= 8 &&
                    rect.height >= 8 &&
                    !hitTextarea &&
                    top instanceof HTMLElement &&
                    card !== null &&
                    card.contains(top) &&
                    top !== textarea &&
                    !top.closest('button, a, textarea, input, select, [role="button"], [data-mobile-nav]')) {
                    const cls = typeof top.className === 'string' ? top.className : '';
                    if (/overlay|backdrop|highlight|mirror/i.test(cls) || top.hasAttribute('data-input-backdrop')) {
                        if (getComputedStyle(top).pointerEvents !== 'none')
                            top.style.pointerEvents = 'none';
                    }
                }
                // The card's own scroll (uV2eYG_scroll) can swallow taps when the
                // textarea sits at zero height — guarantee a floor inline.
                if (rect.height < 30) {
                    const grow = textarea.parentElement;
                    if (grow !== null)
                        grow.style.minHeight = '44px';
                    textarea.style.minHeight = '44px';
                }
            }
        };
        // After a send: the readOnly/disabled flip marks the submit settle.
        const flipObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                const el = mutation.target;
                if (!(el instanceof HTMLTextAreaElement))
                    continue;
                if (el.readOnly || el.disabled)
                    continue;
                window.setTimeout(diagnose, 700);
                break;
            }
        });
        const watched = new WeakSet();
        const watchFlips = (textarea) => {
            if (watched.has(textarea))
                return;
            watched.add(textarea);
            flipObserver.observe(textarea, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
        };
        // Every composer tap reports the live state (and heals a stuck lock).
        const onPointerDown = (event) => {
            if (!(event.target instanceof Element))
                return;
            const textarea = event.target.closest('textarea');
            if (textarea === null)
                return;
            if (composerCardOf(textarea) === null)
                return;
            watchFlips(textarea);
            window.setTimeout(diagnose, 120);
        };
        const onFocusIn = (event) => {
            if (!(event.target instanceof HTMLTextAreaElement))
                return;
            if (composerCardOf(event.target) === null)
                return;
            watchFlips(event.target);
        };
        const scanObserver = new MutationObserver(() => {
            for (const textarea of composerTextareas())
                watchFlips(textarea);
        });
        scanObserver.observe(document.body, { childList: true, subtree: true });
        for (const textarea of composerTextareas())
            watchFlips(textarea);
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('focusin', onFocusIn, true);
        // Periodic sweep: catches a busy phase that lingers with NO events
        // (the stuck-submitting case produces no mutations or taps), so the
        // 30s emergency unlock actually fires. Cheap — attribute scan only;
        // diagnose() itself is skipped while the composer is healthy.
        const sweepTimer = window.setInterval(() => {
            for (const textarea of composerTextareas()) {
                const phase = textarea.getAttribute('data-phase') ?? '';
                if (phase === 'submitting' || phase === 'adjudicating' || textarea.disabled || textarea.readOnly) {
                    diagnose();
                    break;
                }
            }
        }, 5000);
        return () => {
            flipObserver.disconnect();
            scanObserver.disconnect();
            window.clearInterval(sweepTimer);
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('focusin', onFocusIn, true);
        };
    }, 'dsh-mobile-shell: composer self-heal');
    // Chat font size rail: two stepper buttons (A- / A+) plus a px readout
    // at the FAR RIGHT of the conversation tab bar. The value persists in
    // localStorage and is applied as --mobile-nav-font-scale on the chat
    // scroll container, so ONLY the chat view's message typography scales
    // (the markdown rules read the variable); Trajectory and Status are
    // untouched. The tab bar re-mounts on session switches, so injection is
    // idempotent and re-runs on every structural pass.
    ctx.effect(() => {
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const FONT_KEY = 'dsh-mobile-shell:chat-font-size';
        const FONT_BASE = 15;
        const FONT_MIN = 13;
        const FONT_MAX = 21;
        const loadSize = () => {
            const raw = Number(localStorage.getItem(FONT_KEY));
            return Number.isFinite(raw) && raw >= FONT_MIN && raw <= FONT_MAX ? raw : FONT_BASE;
        };
        const applySize = (px) => {
            localStorage.setItem(FONT_KEY, String(px));
            const scale = px / FONT_BASE;
            for (const el of document.querySelectorAll('[class$="_scroll"]')) {
                el.style.setProperty('--mobile-nav-font-scale', String(scale));
            }
            for (const out of document.querySelectorAll('[data-mobile-nav="font-size"]')) {
                out.textContent = `${px}px`;
            }
        };
        const inject = (tabs) => {
            const group = document.createElement('div');
            group.setAttribute('data-mobile-nav', 'font-controls');
            const smaller = document.createElement('button');
            smaller.type = 'button';
            smaller.setAttribute('data-mobile-nav', 'font-smaller');
            smaller.setAttribute('aria-label', t('font.smaller'));
            smaller.textContent = 'A−';
            const readout = document.createElement('span');
            readout.setAttribute('data-mobile-nav', 'font-size');
            readout.textContent = `${loadSize()}px`;
            const larger = document.createElement('button');
            larger.type = 'button';
            larger.setAttribute('data-mobile-nav', 'font-larger');
            larger.setAttribute('aria-label', t('font.larger'));
            larger.textContent = 'A+';
            smaller.addEventListener('click', () => applySize(Math.max(FONT_MIN, loadSize() - 1)));
            larger.addEventListener('click', () => applySize(Math.min(FONT_MAX, loadSize() + 1)));
            group.append(smaller, readout, larger);
            tabs.appendChild(group);
        };
        let scheduled = false;
        const sync = () => {
            scheduled = false;
            // The readout must track the stored size across re-mounts.
            const px = loadSize();
            const scale = px / FONT_BASE;
            for (const el of document.querySelectorAll('[class$="_scroll"]')) {
                el.style.setProperty('--mobile-nav-font-scale', String(scale));
            }
            const tabs = document.querySelector('[data-phase] [class$="_tabs"]');
            if (tabs !== null) {
                let rail = tabs.querySelector('[data-mobile-nav="font-controls"]');
                if (rail === null) {
                    inject(tabs);
                    rail = tabs.querySelector('[data-mobile-nav="font-controls"]');
                }
                // The conversation.view entry set can change AFTER the tab bar first
                // renders (plugin hot reload re-registers the Status entry), and the
                // core appends the newly arrived tab to the end of the flex row —
                // which would land AFTER our rail (对话 / 轨迹 / A− 15px A+ / 状态).
                // Re-append the rail to the end on every structural pass so it stays
                // at the FAR RIGHT no matter what React reorders.
                if (rail !== null && tabs.lastElementChild !== rail)
                    tabs.appendChild(rail);
            }
        };
        const observer = new MutationObserver(() => {
            if (scheduled)
                return;
            scheduled = true;
            queueMicrotask(sync);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        sync();
        return () => observer.disconnect();
    }, 'dsh-mobile-shell: chat font size rail');
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
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const RING_R = 5.5;
        const RING_C = 2 * Math.PI * RING_R;
        const ARIA_RE = /(\d+)%/;
        const parseTokenFigure = (text) => {
            const m = /([\d.]+)\s*([KM]?)/.exec(text);
            if (m === null)
                return null;
            const n = Number(m[1]);
            if (!Number.isFinite(n))
                return null;
            if (m[2] === 'K')
                return n * 1e3;
            if (m[2] === 'M')
                return n * 1e6;
            return n;
        };
        const formatTokenFigure = (n) => n >= 1e6 ? `${Math.round((n / 1e6) * 10) / 10}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);
        const ringSvg = () => `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">` +
            `<circle cx="7" cy="7" r="${RING_R}" stroke="var(--dsw-alias-border-l3, rgba(0,0,0,.2))" stroke-width="2"/>` +
            `<circle data-mobile-nav="ctx-fill" cx="7" cy="7" r="${RING_R}" stroke="var(--dsw-alias-label-tertiary, rgba(0,0,0,.45))" stroke-width="2" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="0" transform="rotate(-90 7 7)"/>` +
            `</svg>`;
        const original = () => 
        // button-only: the INJECTED ring also mirrors the aria-label and sits
        // earlier in the DOM — without the tag constraint this selector would
        // match the ring itself (broken sync + self-recursive taps).
        document.querySelector('button[aria-label*="上下文已用"], button[aria-label*="context used"]');
        // Mini breakdown panel (non-React), anchored under the injected ring.
        let miniPanel = null;
        const closeMiniPanel = () => {
            miniPanel?.remove();
            miniPanel = null;
        };
        const onDocPointerDown = (event) => {
            if (miniPanel === null)
                return;
            if (event.target instanceof Node && miniPanel.contains(event.target))
                return;
            closeMiniPanel();
        };
        const onDocKeyDown = (event) => {
            if (event.key === 'Escape')
                closeMiniPanel();
        };
        const showMiniPanel = (label, figures, detail) => {
            closeMiniPanel();
            const ringEl = document.querySelector('[data-mobile-nav="ctx-ring"]');
            if (ringEl === null)
                return;
            const rr = ringEl.getBoundingClientRect();
            const panel = document.createElement('div');
            panel.setAttribute('data-mobile-nav', 'ctx-panel');
            const headRow = document.createElement('div');
            headRow.setAttribute('data-mobile-nav', 'ctx-panel-head');
            const head = document.createElement('span');
            head.textContent = label;
            headRow.append(head);
            if (figures !== '') {
                const fig = document.createElement('span');
                fig.setAttribute('data-mobile-nav', 'ctx-panel-figures');
                fig.textContent = figures;
                headRow.append(fig);
            }
            const bar = document.createElement('div');
            bar.setAttribute('data-mobile-nav', 'ctx-panel-bar');
            const fill = document.createElement('div');
            fill.setAttribute('data-mobile-nav', 'ctx-panel-fill');
            const m = ARIA_RE.exec(label);
            const pct = m === null ? 0 : Math.max(0, Math.min(100, Number(m[1])));
            fill.style.width = `${Math.max(2, pct)}%`;
            bar.append(fill);
            panel.append(headRow, bar);
            if (detail !== '') {
                const body = document.createElement('div');
                body.setAttribute('data-mobile-nav', 'ctx-panel-body');
                body.textContent = detail;
                panel.append(body);
            }
            document.body.appendChild(panel);
            const width = 272;
            const left = Math.max(8, Math.min(window.innerWidth - width - 8, rr.right - width));
            panel.style.left = `${left}px`;
            panel.style.top = `${Math.max(8, rr.bottom + 6)}px`;
            miniPanel = panel;
        };
        let scheduled = false;
        const sync = () => {
            // Reset FIRST: sync() can bail early (tab bar or source ring not
            // mounted yet), and a stale `scheduled` would swallow every later
            // schedule() and leave the ring uninjected forever.
            scheduled = false;
            const tabs = document.querySelector('[data-phase] [class$="_tabs"]');
            const src = original();
            let ring = tabs?.querySelector('[data-mobile-nav="ctx-ring"]') ?? null;
            if (tabs !== null && src !== null && ring === null) {
                ring = document.createElement('span');
                ring.setAttribute('data-mobile-nav', 'ctx-ring');
                ring.innerHTML = ringSvg();
                const rail = tabs.querySelector('[data-mobile-nav="font-controls"]');
                if (rail !== null)
                    tabs.insertBefore(ring, rail);
                else
                    tabs.appendChild(ring);
            }
            if (ring === null)
                return;
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
            const rail = tabs?.querySelector('[data-mobile-nav="font-controls"]') ?? null;
            let effortEl = tabs?.querySelector('[data-mobile-nav="ctx-effort"]') ?? null;
            if (effortEl === null) {
                effortEl = document.createElement('span');
                effortEl.setAttribute('data-mobile-nav', 'ctx-effort');
            }
            const pinChain = () => {
                if (tabs === null)
                    return;
                if (rail !== null && tabs.lastElementChild !== rail)
                    tabs.appendChild(rail);
                const effortNext = effortEl.nextElementSibling;
                const chainOk = ring.nextElementSibling === effortEl && (rail === null ? effortNext === null || tabs.lastElementChild === effortEl : effortNext === rail);
                if (chainOk)
                    return;
                if (effortNext !== rail)
                    tabs.insertBefore(effortEl, rail);
                if (ring.nextElementSibling !== effortEl)
                    tabs.insertBefore(ring, effortEl);
            };
            pinChain();
            if (src === null) {
                if (!ring.hasAttribute('hidden'))
                    ring.setAttribute('hidden', '');
                if (!effortEl.hasAttribute('hidden'))
                    effortEl.setAttribute('hidden', '');
                return;
            }
            if (ring.hasAttribute('hidden'))
                ring.removeAttribute('hidden');
            // Mirror the composer trigger's effort label ("Max" etc.) after the
            // ring. The composer span is hidden on mobile (long model names must
            // not push the input row); the tab bar is its new home. The span
            // itself is display:none, so judge visibility by its trigger parent.
            const srcEffort = [...document.querySelectorAll('[class$="_trigger"] [class$="_triggerEffort"]')]
                .find((el) => el.parentElement !== null && el.parentElement.offsetParent !== null) ?? null;
            const effortText = srcEffort?.textContent?.trim() ?? '';
            if (effortText === '') {
                if (!effortEl.hasAttribute('hidden'))
                    effortEl.setAttribute('hidden', '');
            }
            else {
                if (effortEl.hasAttribute('hidden'))
                    effortEl.removeAttribute('hidden');
                if (effortEl.textContent !== effortText)
                    effortEl.textContent = effortText;
                if (effortEl.getAttribute('title') !== effortText)
                    effortEl.setAttribute('title', effortText);
            }
            pinChain();
            const label = src.getAttribute('aria-label') ?? '';
            const match = ARIA_RE.exec(label);
            const percent = match === null ? null : Math.max(0, Math.min(100, Number(match[1])));
            const fill = ring.querySelector('[data-mobile-nav="ctx-fill"]');
            if (percent !== null && fill !== null) {
                const offset = String(RING_C * (1 - percent / 100));
                if (fill.getAttribute('stroke-dashoffset') !== offset)
                    fill.setAttribute('stroke-dashoffset', offset);
                if (ring.getAttribute('title') !== label)
                    ring.setAttribute('title', label);
                if (ring.getAttribute('aria-label') !== label)
                    ring.setAttribute('aria-label', label);
                ring.onclick = () => {
                    if (miniPanel !== null) {
                        closeMiniPanel();
                        return;
                    }
                    // Open the hidden original trigger, read its rendered panel text,
                    // close it, then show the mirrored mini panel under the ring.
                    src.click();
                    requestAnimationFrame(() => {
                        const root = src.closest('[class$="_root"]');
                        const panel = root?.querySelector('[class$="_panel"]') ?? null;
                        // The percent comes from the contextPressure projection (which
                        // prices cache read/write traffic too), while the breakdown rows
                        // come from contextBreakdown (surface content only) — two
                        // independent meters. The core panel bridges them with a
                        // "used / window" figures line; mirror it so the numbers add up.
                        const figures = root?.querySelector('[class$="_figures"]')?.textContent?.trim() ?? '';
                        // Rebuild the breakdown lines from the panel's row structure
                        // (dt + dd per row) instead of raw textContent, which glues
                        // figures and labels together ("1.6KTools").
                        const rows = panel === null ? [] : [...panel.querySelectorAll('[class$="_row"]')];
                        const detail = rows.length === 0
                            ? ''
                            : rows
                                .map((row) => {
                                const dt = row.querySelector('dt')?.textContent ?? '';
                                const dd = row.querySelector('dd')?.textContent ?? '';
                                return `${dt} ${dd}`.trim();
                            })
                                .filter((line) => line !== '')
                                .join('\n');
                        // The percent's numerator (contextPressure: input + cache
                        // read/write traffic) is larger than the content breakdown; add
                        // an explicit "other" delta row so the columns add up exactly.
                        const used = parseTokenFigure(figures);
                        const listed = rows.reduce((sum, row) => sum + (parseTokenFigure(row.querySelector('dd')?.textContent ?? '') ?? 0), 0);
                        const otherTokens = used !== null && listed > 0 && used > listed ? used - listed : null;
                        const detailWithOther = otherTokens === null
                            ? detail
                            : detail === ''
                                ? t('ctx.other', { tokens: formatTokenFigure(otherTokens) })
                                : `${detail}\n${t('ctx.other', { tokens: formatTokenFigure(otherTokens) })}`;
                        if (panel !== null)
                            src.click();
                        const labelNow = src.getAttribute('aria-label') ?? '';
                        showMiniPanel(labelNow, figures, detailWithOther);
                    });
                };
            }
        };
        const schedule = () => {
            if (scheduled)
                return;
            scheduled = true;
            queueMicrotask(sync);
        };
        // Structural observer: mounts/re-mounts only. sync() writes attributes on
        // the INJECTED ring, which must never be observed — an attributes observer
        // on the whole tree would re-fire on those writes and loop forever.
        const observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
        // Scoped attribute observer on the ORIGINAL button only: the source of
        // truth for the percentage. The injected ring is outside its scope, so
        // writing the mirrored aria-label can never re-trigger it.
        let watched = null;
        const sourceObserver = new MutationObserver(schedule);
        const watchSource = () => {
            const src = original();
            if (src === watched)
                return;
            watched = src;
            sourceObserver.disconnect();
            if (src !== null)
                sourceObserver.observe(src, { attributes: true, attributeFilter: ['aria-label'] });
        };
        const outerSchedule = () => {
            watchSource();
            schedule();
        };
        // Re-attach the source observer whenever the tree changes (the button is
        // re-created on every ContextMeter render).
        const observer2 = new MutationObserver(outerSchedule);
        observer2.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('pointerdown', onDocPointerDown);
        document.addEventListener('keydown', onDocKeyDown);
        watchSource();
        sync();
        return () => {
            observer.disconnect();
            observer2.disconnect();
            sourceObserver.disconnect();
            document.removeEventListener('pointerdown', onDocPointerDown);
            document.removeEventListener('keydown', onDocKeyDown);
            closeMiniPanel();
        };
    }, 'dsh-mobile-shell: context ring relocation');
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
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const viewArea = () => document.querySelector('[data-phase] [class$="_viewArea"]');
        const scrollerIn = (area) => area.querySelector('[class$="_scroll"], [class$="_tablePane"]');
        const activeTabLabel = () => document.querySelector('[data-phase] [class$="_tabActive"]')?.textContent?.trim() ?? null;
        // label -> scroll ratio (0..1) per tab; cleared when the session changes
        // (the view area element is rebuilt on session switches).
        const positions = new Map();
        let pending = null;
        let lastArea = null;
        let restoreRaf = 0;
        let restoreTimer = 0;
        let retries = 0;
        const tryRestore = () => {
            restoreRaf = 0;
            if (pending === null)
                return;
            const area = viewArea();
            if (area === null)
                return;
            const scroller = scrollerIn(area);
            if (scroller === null || scroller.scrollHeight <= scroller.clientHeight) {
                // The incoming tree is not mounted (or has no scrollable content)
                // yet — retry briefly; give up after ~0.6s.
                retries += 1;
                if (retries < 8) {
                    restoreTimer = window.setTimeout(() => {
                        if (restoreRaf === 0)
                            restoreRaf = requestAnimationFrame(tryRestore);
                    }, 80);
                }
                else {
                    pending = null;
                }
                return;
            }
            scroller.scrollTop = pending.ratio * (scroller.scrollHeight - scroller.clientHeight);
            pending = null;
            retries = 0;
        };
        const onTabClick = (event) => {
            const target = event.target;
            if (target === null)
                return;
            const tab = target.closest('[data-phase] [class$="_tab"]');
            if (tab === null)
                return;
            const label = tab.textContent?.trim() ?? '';
            if (label === '')
                return;
            const area = viewArea();
            const scroller = area !== null ? scrollerIn(area) : null;
            // Remember the outgoing tab's ratio.
            const current = activeTabLabel();
            if (scroller !== null && scroller.scrollHeight > scroller.clientHeight && current !== null) {
                positions.set(current, scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight));
            }
            // Arm the restore for the incoming tab.
            const ratio = positions.get(label);
            pending = ratio === undefined ? null : { label, ratio };
            retries = 0;
            // Fade the incoming view in (the marker lives on the view area, which
            // survives the tab swap; one rAF is enough — React 18 commits
            // synchronously inside the click handler).
            if (area !== null) {
                area.removeAttribute('data-mobile-nav');
                requestAnimationFrame(() => {
                    if (viewArea() === area)
                        area.setAttribute('data-mobile-nav', 'view-fade');
                });
            }
            if (restoreRaf === 0)
                restoreRaf = requestAnimationFrame(tryRestore);
        };
        const onAnimationEnd = (event) => {
            const target = event.target;
            if (target === null || target.getAttribute('data-mobile-nav') !== 'view-fade')
                return;
            target.removeAttribute('data-mobile-nav');
        };
        // Watch the view area: restore once the incoming tree mounts, and reset
        // the per-tab memory when the session changes (area element replaced).
        let scheduled = false;
        const onDomChange = () => {
            if (scheduled)
                return;
            scheduled = true;
            queueMicrotask(() => {
                scheduled = false;
                const area = viewArea();
                if (area !== null && area !== lastArea) {
                    lastArea = area;
                    positions.clear();
                    pending = null;
                }
                if (pending !== null && restoreRaf === 0)
                    restoreRaf = requestAnimationFrame(tryRestore);
            });
        };
        const observer = new MutationObserver(onDomChange);
        observer.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('click', onTabClick, true);
        document.addEventListener('animationend', onAnimationEnd, true);
        return () => {
            observer.disconnect();
            document.removeEventListener('click', onTabClick, true);
            document.removeEventListener('animationend', onAnimationEnd, true);
            if (restoreRaf !== 0)
                cancelAnimationFrame(restoreRaf);
            if (restoreTimer !== 0)
                window.clearTimeout(restoreTimer);
        };
    }, 'dsh-mobile-shell: view switch keep-position + fade');
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
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const onChevronClick = (event) => {
            const target = event.target;
            if (target === null || !target.closest('.aionui-collapse-chevron'))
                return;
            document.querySelector('[data-mobile-nav="frame"]')?.removeAttribute('data-aionui-explorer-open');
        };
        document.addEventListener('click', onChevronClick, true);
        return () => document.removeEventListener('click', onChevronClick, true);
    }, 'dsh-mobile-shell: aionui explorer close marker');
    // dsh-web-ui compatibility: the aionui preview column persists its open
    // tabs in localStorage and restores them on load, which would pop the
    // preview sheet over the fresh UI after a reload. Gate it like the
    // explorer: the stylesheet keeps the column hidden unless the frame
    // carries `data-aionui-preview-open`; this effect sets that marker when
    // the user actually taps a file row in the explorer sheet, and clears it
    // whenever the suite hides the column again (collapse chevron / tab
    // close), so a restored-but-unwanted sheet never appears.
    ctx.effect(() => {
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const frame = () => document.querySelector('[data-mobile-nav="frame"]');
        const onTap = (event) => {
            const target = event.target;
            if (target === null)
                return;
            if (target.closest('[data-aionui-explorer-col] [class$="_treeRow"]') === null)
                return;
            frame()?.setAttribute('data-aionui-preview-open', '');
        };
        const sync = () => {
            const pv = document.querySelector('[data-aionui-preview-col]');
            if (pv === null)
                return;
            if (getComputedStyle(pv).visibility === 'hidden')
                frame()?.removeAttribute('data-aionui-preview-open');
        };
        document.addEventListener('click', onTap, true);
        const observer = new MutationObserver(sync);
        observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });
        sync();
        return () => {
            document.removeEventListener('click', onTap, true);
            observer.disconnect();
        };
    }, 'dsh-mobile-shell: preview sheet open marker');
    // The dsh-web-ui explorer / preview columns toggle via `visibility`
    // (their inline style), which never restarts a CSS animation — so the
    // sheets would only animate on first mount. Replay the rise animation
    // with the Web Animations API each time a column turns visible, then
    // leave the resting state to the stylesheet.
    ctx.effect(() => {
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const cols = ['[data-aionui-explorer-col]', '[data-aionui-preview-col]'];
        const seen = new Map();
        const play = (el) => {
            el.animate([
                { opacity: 0, transform: 'translateY(28px)' },
                { opacity: 1, transform: 'none' },
            ], { duration: 280, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' });
        };
        const check = () => {
            for (const sel of cols) {
                const el = document.querySelector(sel);
                if (el === null)
                    continue;
                const visible = getComputedStyle(el).visibility === 'visible';
                const prev = seen.get(sel) ?? false;
                if (visible && !prev)
                    play(el);
                seen.set(sel, visible);
            }
        };
        const observer = new MutationObserver(check);
        // Visibility flips come through inline style mutations (suite) or the
        // explorer-open marker on the frame; class changes are watched too.
        observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'class', 'data-aionui-explorer-open'] });
        check();
        return () => {
            observer.disconnect();
        };
    }, 'dsh-mobile-shell: sheet rise animation replay');
    ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'mobile-nav-toggle',
        order: 10,
        locale: locales_ts_1.NS,
        inject: () => ({
            toggleSidebar: () => ctx.layout.toggleSidebar(),
        }),
    }, MobileNavToggle_tsx_1.MobileNavToggle));
    // Status view tab: a conversation.view entry renders a session-scope tab
    // in the official header ring ("对话 / 轨迹 / 状态"). Order 20 keeps it
    // after the chat tab (order 0) and the trajectory tab (order 10). The
    // view reads the framework standard kit (useSession + useProjection), so
    // no inject face is needed.
    ctx.slots.inject('conversation.view', () => ctx.slots.register({
        name: 'conversation.view',
        id: 'status',
        order: 20,
        locale: locales_ts_1.NS,
        label: () => t('view.status'),
        inject: () => ({
            // Session log export, relocated from the drawer footer to the top of
            // the Status tab (the drawer's official foot keeps Settings only).
            downloadSessionLog: (sessionId) => ctx.sessionLogDownload.download(sessionId),
        }),
    }, MobileStatusView_tsx_1.MobileStatusView));
    // Plugin marketplace: a Settings section (Settings → 插件市场) rendering
    // the community catalog with category filters, star/time sorting, a card
    // grid (author avatar, tags, bilingual intro, stars, one-click install,
    // AI translation) and a repo window per plugin.
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'mobile-market',
        order: 60,
        locale: locales_ts_1.NS,
        label: () => t('market.title'),
    }, MarketplaceView_tsx_1.MarketplaceView));
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'mobile-github',
        order: 61,
        locale: locales_ts_1.NS,
        label: () => t('github.title'),
    }, GithubKeyView_tsx_1.GithubKeyView));
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
        const narrow = window.matchMedia('(max-width: 1023px)');
        if (!narrow.matches)
            return () => { };
        const LEVELS = ['off', 'low', 'high', 'xhigh', 'max'];
        const LABELS = {
            off: 'Off', low: 'Low', high: 'High', xhigh: 'Xhigh', max: 'Max',
        };
        let providers = [];
        let revision = 0;
        let card = null;
        const fetchState = async () => {
            try {
                const res = await fetch('/api/mobile-nav/reasoning');
                const text = await res.text();
                const payload = text === '' ? null : JSON.parse(text);
                if (payload?.ok !== true || payload.providers === undefined)
                    return false;
                providers = payload.providers;
                revision = payload.revision ?? 0;
                return true;
            }
            catch {
                return false;
            }
        };
        const saveProvider = async (provider, drafts, draftDefault, save, status) => {
            save.disabled = true;
            status.textContent = '保存中…';
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
                });
                const text = await res.text();
                const payload = text === '' ? null : JSON.parse(text);
                if (res.status === 409 || payload?.conflict === true) {
                    status.textContent = '配置已变化，已重新加载';
                    const ok = await fetchState();
                    if (ok)
                        render();
                }
                else if (res.ok && payload?.ok === true) {
                    status.textContent = '已保存';
                    const ok = await fetchState();
                    if (ok)
                        render();
                }
                else {
                    status.textContent = payload?.error ?? `保存失败 HTTP ${res.status}`;
                }
            }
            catch {
                status.textContent = '网络错误';
            }
            finally {
                save.disabled = false;
            }
        };
        const modelRow = (model, drafts) => {
            const row = document.createElement('div');
            row.setAttribute('data-mobile-nav', 'reasoning-model');
            const nameEl = document.createElement('div');
            nameEl.setAttribute('data-mobile-nav', 'reasoning-model-name');
            nameEl.textContent = model.name !== undefined && model.name !== '' && model.name !== model.id ? `${model.name} · ${model.id}` : model.id;
            row.append(nameEl);
            const chips = document.createElement('div');
            chips.setAttribute('data-mobile-nav', 'reasoning-chips');
            for (const level of LEVELS) {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.setAttribute('data-mobile-nav', 'reasoning-chip');
                chip.setAttribute('data-level', level);
                chip.textContent = LABELS[level];
                const sync = () => {
                    chip.classList.toggle('on', (drafts[model.id] ?? []).includes(level));
                };
                sync();
                chip.onclick = () => {
                    const set = new Set(drafts[model.id] ?? []);
                    if (set.has(level))
                        set.delete(level);
                    else
                        set.add(level);
                    drafts[model.id] = [...set];
                    sync();
                };
                chips.append(chip);
            }
            row.append(chips);
            return row;
        };
        const providerBlock = (provider) => {
            const block = document.createElement('div');
            block.setAttribute('data-mobile-nav', 'reasoning-provider');
            const head = document.createElement('div');
            head.setAttribute('data-mobile-nav', 'reasoning-provider-name');
            const name = document.createElement('span');
            name.textContent = provider.displayName;
            const route = document.createElement('span');
            route.setAttribute('data-mobile-nav', 'reasoning-provider-route');
            route.textContent = provider.route;
            head.append(name, route);
            block.append(head);
            const drafts = {};
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
                        : [...LEVELS];
            }
            let draftDefault = provider.defaultLevel ?? 'max';
            for (const model of provider.models)
                block.append(modelRow(model, drafts));
            const defaultRow = document.createElement('div');
            defaultRow.setAttribute('data-mobile-nav', 'reasoning-default');
            const label = document.createElement('span');
            label.textContent = '默认等级';
            const select = document.createElement('select');
            select.setAttribute('data-mobile-nav', 'reasoning-default-select');
            for (const level of LEVELS) {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = LABELS[level];
                select.append(option);
            }
            select.value = draftDefault ?? 'max';
            select.onchange = () => {
                draftDefault = select.value;
            };
            defaultRow.append(label, select);
            block.append(defaultRow);
            const saveRow = document.createElement('div');
            saveRow.setAttribute('data-mobile-nav', 'reasoning-save-row');
            const save = document.createElement('button');
            save.type = 'button';
            save.setAttribute('data-mobile-nav', 'reasoning-save');
            save.textContent = '保存';
            const status = document.createElement('span');
            status.setAttribute('data-mobile-nav', 'reasoning-status');
            save.onclick = () => void saveProvider(provider, drafts, draftDefault, save, status);
            saveRow.append(save, status);
            block.append(saveRow);
            return block;
        };
        const render = () => {
            if (card === null || !card.isConnected)
                return;
            card.replaceChildren();
            const title = document.createElement('div');
            title.setAttribute('data-mobile-nav', 'reasoning-title');
            title.textContent = '推理等级 · 自定义模型';
            const desc = document.createElement('div');
            desc.setAttribute('data-mobile-nav', 'reasoning-desc');
            desc.textContent = '为第三方自定义提供方的模型声明支持的推理强度；模型选择器（输入框）只显示已声明的等级。';
            card.append(title, desc);
            if (providers.length === 0) {
                const empty = document.createElement('div');
                empty.setAttribute('data-mobile-nav', 'reasoning-empty');
                empty.textContent = '未配置自定义提供方（Models → Add a custom provider）';
                card.append(empty);
                return;
            }
            for (const provider of providers)
                card.append(providerBlock(provider));
        };
        const inject = () => {
            if (injecting !== null)
                return injecting;
            injecting = (async () => {
                const modal = document.querySelector('[aria-modal="true"][data-mobile-nav="settings-sheet"]');
                if (modal === null)
                    return;
                const sections = [...modal.querySelectorAll('[class$="_section"]')];
                const section = sections.find((entry) => (entry.querySelector('[class$="_title"]')?.textContent ?? '').trim() === 'Models');
                const rows = section?.querySelector('[class$="_rows"]');
                if (rows === null || rows === undefined)
                    return;
                if (rows.querySelector('[data-mobile-nav="reasoning-card"]') !== null)
                    return;
                // Fetch FIRST, then create the card: concurrent observer passes must
                // never render a card from stale (empty) state while a fetch is in
                // flight — the fetch result is what the card renders.
                await fetchState();
                if (!rows.isConnected)
                    return;
                if (rows.querySelector('[data-mobile-nav="reasoning-card"]') !== null)
                    return;
                card = document.createElement('li');
                card.setAttribute('data-mobile-nav', 'reasoning-card');
                rows.appendChild(card);
                render();
            })().finally(() => {
                injecting = null;
            });
            return injecting;
        };
        let injecting = null;
        const observer = new MutationObserver(() => void inject());
        observer.observe(document.body, { childList: true, subtree: true });
        void inject();
        return () => observer.disconnect();
    }, 'dsh-mobile-shell: reasoning levels card');
    ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
        name: 'conversation.input.left',
        id: 'mobile-nav-attach',
        order: 10,
        locale: locales_ts_1.NS,
    }, ComposerAttach_tsx_1.ComposerAttachButton));
    ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'mobile-nav-files',
        order: 15,
        locale: locales_ts_1.NS,
    }, ComposerAttach_tsx_1.FileRailDock));
    // Files-only send activator: an invisible tap target over the official
    // primary send button (which is disabled while the draft is empty), so
    // attachments submit through the input bar's own send arrow.
    ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
        name: 'conversation.input.right',
        id: 'mobile-nav-send-overlay',
        order: 10,
        locale: locales_ts_1.NS,
    }, ComposerAttach_tsx_1.SendOverlay));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'mobile-nav-overlay',
        order: 10,
        locale: locales_ts_1.NS,
        inject: () => ({
            toggleSidebar: () => ctx.layout.toggleSidebar(),
            // Session deletion is a host-side operation: the browser RPC surface
            // has no delete method (sessions are append-only by design), so the
            // plugin's node half exposes a dedicated route that removes the
            // durable log and the workspace accounting.
            deleteSession: async (sessionId) => {
                try {
                    const res = await fetch('/api/mobile-nav/delete-session', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                    });
                    // The host webserver answers unknown routes / crashed handlers with
                    // an EMPTY body (404/400), which res.json() would reject — read the
                    // text and surface the concrete status so failures are diagnosable.
                    const text = await res.text();
                    let payload = null;
                    try {
                        payload = text === '' ? null : JSON.parse(text);
                    }
                    catch {
                        payload = null;
                    }
                    const error = payload?.error ?? (res.ok ? undefined : `HTTP ${res.status}`);
                    return { ok: res.ok && payload?.ok === true, status: res.status, error };
                }
                catch (error) {
                    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
                }
            },
            refreshList: () => ctx.sessions.refresh(),
            clearSelection: () => ctx.sessions.clear(),
        }),
    }, MobileNavOverlay_tsx_1.MobileNavOverlay));
}
};
var __cache = {};
function __localRequire(id) {
  if (id.charCodeAt(0) !== 46) return require(id);
  id = id.slice(2);
  var cached = __cache[id];
  if (cached) return cached.exports;
  var module = { exports: {} };
  __cache[id] = module;
  __modules[id](__localRequire, module, module.exports);
  return module.exports;
}
var module = { exports: {} };
__modules["index.js"](__localRequire, module, module.exports);
return module.exports; } });
