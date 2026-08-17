/**
 * dsh-mobile-shell, node half.
 *
 * Pure client UI plugin plus one host-side service route: `POST
 * /api/mobile-nav/delete-session` performs a REAL session deletion (the
 * browser half has no delete RPC — sessions are append-only by design). The
 * route removes the durable JSONL log directory, detaches the session from
 * its workspace record, and clears it from the archived set. The SQLite
 * search index and the projection cache reconcile themselves from the
 * durable log's absence (fail-soft by design), so no extra cleanup is
 * needed there. Running sessions are refused — a live session must finish
 * before its log can be removed.
 */
import type { Context } from '@deepseek-ai/cordis';
/** The empty apply becomes a real plugin: route registration for the delete service. */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map