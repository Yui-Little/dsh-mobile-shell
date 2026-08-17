import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { DeleteSessionResult } from './SessionDeleteController.tsx';
import { NS } from './locales.ts';
/** Full props for the shell overlay entry. */
export interface MobileNavOverlayProps extends PropsRuntime<'shell.overlay'>, PropsLocale<typeof NS> {
    /** Bound ctx.layout.toggleSidebar(). */
    toggleSidebar: () => void;
    /** POST the session id to the host delete route. */
    deleteSession: (sessionId: string) => Promise<DeleteSessionResult>;
    /** Pull a fresh session list after a successful delete. */
    refreshList: () => Promise<unknown>;
    /** Drop the current selection when the deleted session was the current one. */
    clearSelection: () => void;
}
/**
 * Mobile shell overlay: owns the `data-mobile-nav` marker on the AppFrame
 * element (the CSS restructure keys off it), mirrors the frame's collapsed
 * state into React state, and renders the dimmed backdrop plus a floating
 * directory button for the hero/blank phases that have no session header.
 * Also hosts the mobile-only "delete session" kebab-menu addition.
 */
export declare function MobileNavOverlay({ useSessions, toggleSidebar, deleteSession, refreshList, clearSelection, t }: MobileNavOverlayProps): import("react").JSX.Element | null;
//# sourceMappingURL=MobileNavOverlay.d.ts.map