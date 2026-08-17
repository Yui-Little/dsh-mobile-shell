/**
 * Browser-side attachment text extraction. Only the formats the model can
 * actually read are supported: plain-text-ish files are read verbatim
 * (capped), .docx is deflated (DecompressionStream) and its XML runs are
 * unwrapped into paragraphs. Anything else is rejected at pick time by the
 * caller's accept filter; a failed parse yields an unreadable marker.
 */
/** Per-file character cap for the appended prompt text. */
export declare const MAX_FILE_CHARS = 100000;
/** Lower-case extension without the dot ('' when none). */
export declare function extensionOf(name: string): string;
/** MIME types the core draft-image pipeline accepts. */
export declare function isCoreImageType(mime: string): boolean;
/** A selectable non-image file? (text-ish or docx). */
export declare function isSupportedFile(name: string): boolean;
/**
 * Read one selected file for sending. Throws when the file is unreadable
 * (the caller surfaces the failure toast).
 */
export declare function extractFileText(file: File): Promise<{
    text: string;
    truncated: boolean;
}>;
//# sourceMappingURL=fileText.d.ts.map