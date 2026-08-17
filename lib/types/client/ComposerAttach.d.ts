import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
import type { MobileNavKey } from './locales.ts';
/** Structural face of the services this chrome needs (tracker-safe casts). */
export interface ComposerAttachServices {
    createDraftImages(files: readonly File[]): readonly {
        id: string;
    }[];
    releaseDraftImages(attachments: readonly {
        id: string;
    }[]): void;
    draftImages(ids: readonly string[]): readonly {
        id: string;
        previewUrl: string;
        file: File;
    }[];
    /** Files-only submission: bypasses the empty-draft machine refusal and
     * routes straight into the (wrapped) sink, which appends the file text. */
    submitFiles(sessionId: string): void;
    input: {
        shell(sessionId: string): {
            addImages(ids: readonly string[]): boolean;
            removeImage(id: string): void;
            submit(mode?: unknown): void;
            setDraft(text: string): void;
            snapshot: {
                imageIds: readonly string[];
            };
        };
    };
}
/** Translator signature narrowed to the mobileNav namespace (matches the slot-bound t). */
type Tfn = (key: MobileNavKey, params?: Record<string, string | number>) => string;
/** Bind the services and the bound NS translator (called once from apply). */
export declare function initComposerAttach(conversation: ComposerAttachServices, t: Tfn): void;
/** Structural face of the client sessions service (binding lookup). */
export interface SessionBindingLookup {
    binding(sessionId: string): {
        session: {
            sessionId: string;
        };
    } | undefined;
}
export declare function toast(key: MobileNavKey, params?: Record<string, string | number>): void;
/** Open the picker for one session (attaches to that session's drafts). */
export declare function openFilePicker(sessionId: string): void;
/** The "+" button next to the "/" command button (tool row). */
export type ComposerAttachButtonProps = PropsRuntime<'conversation.input.left'> & PropsLocale<typeof NS>;
export declare function ComposerAttachButton({ session, t }: ComposerAttachButtonProps): React.JSX.Element;
/**
 * The unified pending-attachment rail above the composer card (dock slot):
 * image preview thumbnails first (core draft pipeline), then file chips
 * (pending store). Removes go through the respective pipeline so drafts
 * stay consistent with the core input state.
 */
export type FileRailDockProps = PropsRuntime<'conversation.input.dock'> & PropsLocale<typeof NS>;
export declare function FileRailDock({ session, input, t }: FileRailDockProps): React.JSX.Element | null;
/**
 * Files-only send activator (conversation.input.right slot): an invisible
 * tap target covering the official primary send button, rendered ONLY while
 * the draft is empty, no image drafts exist, and files are pending — the
 * exact state where the official button is disabled. Tapping it submits
 * through the input hub; the sink wrapper appends the file text, so the
 * input bar's own send arrow "just works" with attachments.
 */
export type SendOverlayProps = PropsRuntime<'conversation.input.right'> & PropsLocale<typeof NS>;
export declare function SendOverlay({ session, input, t }: SendOverlayProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=ComposerAttach.d.ts.map