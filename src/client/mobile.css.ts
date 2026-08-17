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
export const MOBILE_CSS = `
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
  transition: filter 0.12s ease-out, background-color 0.12s ease-out, opacity 0.12s ease-out !important;
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
    margin: 8px 0 0 !important;
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
  [class$="_menu"] [class$="_viewport"] {
    max-height: min(60dvh, 480px) !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    padding: 6px 6px 14px !important;
  }
  [class$="_menu"] [class$="_groupTitle"] {
    padding: 8px 14px 2px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    letter-spacing: 0.05em;
    color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, .5)) !important;
    text-transform: uppercase;
  }
  [class$="_menu"] [role="option"] {
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
  [class$="_menu"] [role="option"]:hover,
  [class$="_menu"] [role="option"]:active {
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .05)) !important;
  }
  [class$="_menu"] [role="option"][class*="_active"] {
    background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f6ef7) 12%, transparent) !important;
  }
  [class$="_menu"] [class$="_itemName"] {
    font-size: 14px !important;
    font-weight: 600 !important;
    color: var(--dsw-alias-label-primary, inherit) !important;
    line-height: 20px !important;
  }
  [class$="_menu"] [class$="_itemDescription"] {
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
  /* The official composer autosizes the textarea and writes an inline
     height (2 lines on the hero empty state) on the textarea's scroll/grow
     wrappers. :placeholder-shown lets us collapse the EMPTY state to one
     line with !important; as soon as the user types, the pseudo-class no
     longer matches and the autosizer's inline height takes over again — so
     multi-line growth keeps working. */
  [data-phase="hero"] textarea:placeholder-shown {
    height: 48px !important;
  }
  [data-phase="hero"] [class$="_card"][data-mobile-nav-hero-empty] > [class$="_scroll"],
  [data-phase="hero"] [class$="_card"][data-mobile-nav-hero-empty] [class$="_grow"] {
    height: 48px !important;
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
html [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_row"],
html [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_rowCard"],
html [aria-modal="true"][data-mobile-nav="settings-sheet"] [class$="_card"] {
  background: var(--dsw-specific-menu, #fff) !important;
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

`
