import type { Translate } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client';
import type { MobileNavKey } from './locales.ts';
export interface DeleteSessionResult {
    ok: boolean;
    status: number;
    error?: string | undefined;
}
export interface SessionDeleteControllerProps {
    /** Locale seat (mobileNav namespace). */
    t: Translate<MobileNavKey>;
    /** Session list snapshot (useSessions). */
    list: SessionListState;
    /** POST the session id to the host delete route. */
    deleteSession(sessionId: string): Promise<DeleteSessionResult>;
    /** Pull a fresh session list after a successful delete. */
    refreshList(): Promise<unknown>;
    /** Drop the current selection when the deleted session was the current one. */
    clearSelection(): void;
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
export declare function SessionDeleteController({ t, list, deleteSession, refreshList, clearSelection }: SessionDeleteControllerProps): import("react").JSX.Element;
//# sourceMappingURL=SessionDeleteController.d.ts.map