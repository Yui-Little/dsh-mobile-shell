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
export interface PendingAttachment {
    /** Stable React key / removal identity. */
    id: string;
    /** Original filename (bubble label). */
    name: string;
    /** Lower-case extension without the dot (format badge). */
    ext: string;
    /** Extracted text, sent with the next message; '' when unreadable. */
    text: string;
    /** Text was truncated at the size cap. */
    truncated: boolean;
}
/** Current pending attachments for one session (stable reference while unchanged). */
export declare function pendingAttachmentsOf(sessionId: string): readonly PendingAttachment[];
export declare function addAttachment(sessionId: string, attachment: PendingAttachment): void;
export declare function removeAttachment(sessionId: string, id: string): void;
/** Drop all pending attachments after a successful send. */
export declare function clearAttachments(sessionId: string): void;
export declare function subscribeAttachments(listener: () => void): () => void;
//# sourceMappingURL=attachmentStore.d.ts.map