import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** Full props of the status view tab entry. */
export type MobileStatusViewProps = PropsRuntime<'conversation.view'> & PropsLocale<typeof NS> & {
    /** Bound ctx.sessionLogDownload.download() for the current session. */
    downloadSessionLog?: (sessionId: string) => void;
};
export declare function MobileStatusView({ useSession, useSessions, useProjection, sessionId, downloadSessionLog, t }: MobileStatusViewProps): import("react").JSX.Element;
//# sourceMappingURL=MobileStatusView.d.ts.map