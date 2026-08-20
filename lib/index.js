import { appendFile, chmod, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { appendFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
/** Session ids minted by the harness have this exact shape. */
const SESSION_ID_RE = /^session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ROUTE_PATH = '/api/mobile-nav/delete-session';
const STORE_IMAGE_PATH = '/api/mobile-nav/store-image';
const IMAGE_GET_PATH = '/api/mobile-nav/image';
const REASONING_GET_PATH = '/api/mobile-nav/reasoning';
const GITHUB_TOKEN_PATH = '/api/mobile-nav/github-token';
const GITHUB_TOKEN_REF = 'GITHUB_TOKEN';
const MAX_BODY_BYTES = 1_000_000;
/** The pi-ai settings namespace that owns hand-declared custom providers. */
const PI_AI_NS = 'llm-pi-ai';
/**
 * The reasoning tiers offered for hand-declared custom models: the set the
 * user chose — off / low / high / xhigh / max. A route-level `reasoning`
 * default is always written so the composer picker never offers the
 * "provider default" option either. Every tier is real on the wire: `off`
 * stores null (selecting it falls back to `reasoning_effort: "off"`), the
 * rest send their own spelling, and the pre-selected default applies when
 * the user does not open the effort pane.
 */
const UI_LEVELS = ['off', 'low', 'high', 'xhigh', 'max'];
const isUiLevel = (value) => typeof value === 'string' && UI_LEVELS.includes(value);
/** Stored pi-ai dict key for each offered tier (identity, kept for clarity). */
const KEY_FOR = {
    off: 'off', low: 'low', high: 'high', xhigh: 'xhigh', max: 'max',
};
/** Wire spelling dispatched for each offered tier. `off` stores null (the
 * adapter then falls back to sending `reasoning_effort: "off"` when selected). */
const WIRE_FOR = {
    off: null, low: 'low', high: 'high', xhigh: 'xhigh', max: 'max',
};
/** Map a stored pi-ai key back to the UI tier it represents. */
const STORED_KEY_TO_UI = {
    off: 'off', low: 'low', high: 'high', xhigh: 'xhigh', max: 'max',
};
/** Base64 image uploads for the vision fallback; larger than the JSON cap. */
const MAX_IMAGE_BODY_BYTES = 16_000_000;
class DeleteSessionError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function readBody(req, limit = MAX_BODY_BYTES) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > limit)
                reject(new DeleteSessionError(413, 'request body too large'));
            else
                chunks.push(chunk);
        });
        req.on('end', () => {
            const merged = new Uint8Array(size);
            let offset = 0;
            for (const chunk of chunks) {
                merged.set(chunk, offset);
                offset += chunk.length;
            }
            resolve(new TextDecoder().decode(merged));
        });
    });
}
/** Serve one stored upload back to the browser so thumbnails can render
 * after a page reload (blob URLs die with the session). Path must live under
 * the session workspace's .dsh-uploads directory and be an image extension. */
async function handleGetImage(scoped, req, res) {
    try {
        const raw = req.url ?? '';
        const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
        const params = new URLSearchParams(query);
        const path = params.get('path') ?? '';
        if (path === '')
            throw new DeleteSessionError(400, 'missing path');
        if (!/^\/[^\0]+$/.test(path))
            throw new DeleteSessionError(400, 'invalid path');
        const ext = path.toLowerCase().slice(path.lastIndexOf('.') + 1);
        if (!['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext))
            throw new DeleteSessionError(400, 'not an image');
        const root = process.env.HOME ? join(process.env.HOME, 'dsh') : process.cwd();
        const uploadsDir = join(root, '.dsh-uploads');
        const resolved = resolve(path);
        if (!resolved.startsWith(uploadsDir + '/'))
            throw new DeleteSessionError(403, 'outside uploads');
        const data = await readFile(resolved);
        const type = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=3600' });
        res.end(Buffer.from(data));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendJson(res, error instanceof DeleteSessionError ? error.status : 500, { ok: false, error: message });
    }
}
/** Store one uploaded image under the session's workspace so harness tools
 * (vision_glance & friends) can read it: tool paths are restricted to the
 * session workspace / allowedDirs, while DSH_HOME/attachments is not.
 * The browser RPC interceptor only accepts JSON bodies, so the image rides
 * as base64. Returns the absolute path for the fallback message.
 * Dedupes by content: identical retries of the same image reuse one file
 * instead of stacking timestamped copies forever. */
async function handleStoreImage(scoped, req, res) {
    try {
        const raw = await readBody(req, MAX_IMAGE_BODY_BYTES);
        const payload = JSON.parse(raw);
        if (typeof payload.data !== 'string' || payload.data === '')
            throw new DeleteSessionError(400, 'empty body');
        const bytes = Buffer.from(payload.data, 'base64');
        if (bytes.length === 0)
            throw new DeleteSessionError(400, 'empty body');
        const name = String(payload.name ?? 'image.png').replace(/[^\w.\-]/g, '_').slice(0, 120);
        const sessionId = String(payload.sessionId ?? '');
        const workspace = scoped.workspaceRegistry?.list().find((w) => sessionId !== '' && w.sessionIds.includes(sessionId));
        const root = workspace?.path ?? (process.env.HOME ? join(process.env.HOME, 'dsh') : process.cwd());
        const dir = join(root, '.dsh-uploads');
        await mkdir(dir, { recursive: true });
        const hash = createHash('md5').update(bytes).digest('hex');
        const target = join(dir, `${hash}-${name}`);
        try {
            await writeFile(target, bytes, { flag: 'wx' });
        }
        catch (error) {
            if (error.code !== 'EEXIST')
                throw error;
            // identical content already stored — reuse the existing path
        }
        sendJson(res, 200, { ok: true, path: target });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendJson(res, error instanceof DeleteSessionError ? error.status : 500, { ok: false, error: message });
    }
}
/**
 * Read the `llm-pi-ai` settings namespace and project the hand-declared
 * providers (routes with an explicit `models` list — the installed catalog
 * routes carry none). The composer picker shows reasoning levels only for
 * models whose profile declares `reasoningEfforts`, so this route returns the
 * current declaration state plus the namespace revision the UI must send back
 * with a write (stale revisions are refused by the settings service).
 */
async function handleReasoningGet(scoped, res) {
    const settings = scoped.settings;
    if (settings === undefined) {
        sendJson(res, 501, { ok: false, error: 'settings service is absent' });
        return;
    }
    const descriptor = settings.describe({ redactSecrets: true }).find((entry) => entry.ns === PI_AI_NS);
    if (descriptor === undefined) {
        sendJson(res, 200, { ok: true, revision: 0, providers: [] });
        return;
    }
    const section = (descriptor.value ?? {});
    const providersRaw = typeof section.providers === 'object' && section.providers !== null ? section.providers : {};
    const providers = Object.entries(providersRaw)
        .filter(([, entry]) => Array.isArray(entry.models) && entry.models.length > 0)
        .map(([route, entry]) => {
        const models = entry.models
            .map((model, index) => ({
            index,
            id: typeof model.id === 'string' ? model.id : String(model.id ?? ''),
            name: typeof model.name === 'string' ? model.name : undefined,
            levels: readReasoningEfforts(model.reasoningEfforts),
            disabled: model.reasoningEfforts === false,
        }));
        return {
            route,
            displayName: typeof entry.displayName === 'string' ? entry.displayName : route,
            models,
            defaultLevel: projectDefault(entry.reasoning),
        };
    });
    sendJson(res, 200, { ok: true, revision: descriptor.revision, providers });
}
/**
 * Project a stored `reasoningEfforts` dict (or `false`) into the UI tier
 * list. Only canonical entries count: `off` with a null wire, and keys whose
 * wire equals their own spelling. Legacy `minimal`/`medium`/`auto`-slot
 * declarations are dropped — they are not offered tiers, and the next save
 * writes the canonical set.
 */
function readReasoningEfforts(stored) {
    if (typeof stored !== 'object' || stored === null)
        return [];
    const dict = stored;
    const result = [];
    for (const level of UI_LEVELS) {
        const wire = dict[KEY_FOR[level]];
        if (wire === undefined)
            continue;
        const canonical = WIRE_FOR[level];
        if (canonical === null ? wire === null : wire === canonical)
            result.push(level);
    }
    return result;
}
/** Map a stored route-level `reasoning` key to the UI tier (`medium` = auto slot). */
function projectDefault(stored) {
    if (typeof stored !== 'string')
        return null;
    return STORED_KEY_TO_UI[stored] ?? null;
}
/** Canonical per-model reasoning dict injected for hand-declared models. */
const DEFAULT_EFFORTS = {
    off: null, low: 'low', high: 'high', xhigh: 'xhigh', max: 'max',
};
/** Route-level default applied when a hand-declared provider lacks one. */
const DEFAULT_ROUTE_LEVEL = 'max';
/**
 * Backfill reasoning defaults for hand-declared custom providers: every model
 * that carries no `reasoningEfforts` declaration gets the canonical five-tier
 * set, and a route without a `reasoning` default gets `max`. Runs after every
 * `llm-pi-ai` settings change — so a provider added through the official
 * settings UI picks everything up automatically, no per-model manual setup —
 * and once at plugin load to cover anything added while the plugin was
 * absent. A model that explicitly declares `reasoningEfforts: false` is left
 * alone: that is the user's "no reasoning control" choice, which the settings
 * card writes when every tier is unchecked.
 *
 * Note: the wire compat switches `thinkingFormat`/`supportsReasoningEffort`
 * used to be auto-written for completions-protocol models, but llm-pi-ai
 * rejects them on any other protocol (openai-responses etc.) at save time, so
 * a provider switched to responses would fail validation. They are no longer
 * written, and any leftovers are stripped from every model below so protocol
 * switches never error out. (For the same reason the settings card offers
 * tiers only — reasoningEfforts is protocol-neutral.)
 */
async function backfillReasoningDefaults(scoped, attempt = 0) {
    const settings = scoped.settings;
    if (settings === undefined || attempt > 3)
        return 0;
    const descriptor = settings.describe({ redactSecrets: true }).find((entry) => entry.ns === PI_AI_NS);
    if (descriptor === undefined)
        return 0;
    const section = (descriptor.value ?? {});
    const providersRaw = typeof section.providers === 'object' && section.providers !== null
        ? section.providers
        : {};
    const userSection = (descriptor.user ?? {});
    const userProviders = typeof userSection?.providers === 'object' && userSection.providers !== null
        ? userSection.providers
        : {};
    const changes = [];
    for (const [route, entry] of Object.entries(providersRaw)) {
        if (!Array.isArray(entry.models) || entry.models.length === 0)
            continue;
        const base = userProviders[route] ?? entry;
        const rebuilt = structuredClone(base);
        const models = Array.isArray(rebuilt.models) ? rebuilt.models : null;
        if (models === null)
            continue;
        let dirty = false;
        for (const model of models) {
            if (model.reasoningEfforts === undefined) {
                model.reasoningEfforts = { ...DEFAULT_EFFORTS };
                dirty = true;
            }
            // Strip any leftover wire compat switches. They are only valid on
            // openai-completions models, and llm-pi-ai rejects them at save time on
            // every other protocol — a provider switched to openai-responses must
            // not carry them. Removing them from every model (not just
            // non-completions ones) keeps api switches from ever failing.
            const compat = (model.compat ?? {});
            if (compat.thinkingFormat !== undefined || compat.supportsReasoningEffort !== undefined) {
                if (model.compat === undefined)
                    model.compat = {};
                const target = model.compat;
                delete target.thinkingFormat;
                delete target.supportsReasoningEffort;
                dirty = true;
            }
        }
        if (typeof rebuilt.reasoning !== 'string') {
            rebuilt.reasoning = DEFAULT_ROUTE_LEVEL;
            dirty = true;
        }
        if (dirty)
            changes.push({ route, rebuilt });
    }
    if (changes.length === 0)
        return 0;
    try {
        await settings.mutate(PI_AI_NS, changes.map((change) => ({ op: 'set', path: ['providers', change.route], value: change.rebuilt })), descriptor.revision);
        return changes.length;
    }
    catch (error) {
        // A concurrent settings write moved the revision between our read and
        // write; re-read and retry against the fresh revision (bounded).
        if (error instanceof Error && error.name === 'SettingsConflictError') {
            return backfillReasoningDefaults(scoped, attempt + 1);
        }
        throw error;
    }
}
/* ---------- plugin marketplace ----------
 * Catalog source: the DSH-Plugin Hub (dsh-plugin.org) — the same curated
 * directory the community "Plugin Hub" plugin uses: ~2,500 human-verified
 * plugins with category, topics, stars, added/updated dates and the source
 * repo, refreshed daily. The zh and en API files are fetched and merged so
 * every card can carry a bilingual description. The old community registry
 * (awesome-dsh-plugin.com/plugins.json) stays as a fallback when the hub is
 * unreachable. Install runs the official `dsh plugin --profile web add
 * <target>` (persists across restarts); translation uses the default model
 * through the llm service; the README route feeds the repo "window" in the UI.
 */
const HUB_CATALOG_URLS = {
    zh: 'https://dsh-plugin.org/api/plugins.zh.json',
    en: 'https://dsh-plugin.org/api/plugins.en.json',
};
const MARKET_CATALOG_URL = 'https://awesome-dsh-plugin.com/plugins.json';
const MARKET_TTL_MS = 6 * 3600_000;
const MARKET_INSTALL_TIMEOUT_MS = 180_000;
/** The 11 hub categories with bilingual labels — emitted as the catalog's
 * category map so the client's category chip list renders without changes. */
const HUB_CATEGORIES = {
    interface: { zh: '界面与体验', en: 'UI & Experience' },
    session: { zh: '会话与消息', en: 'Sessions & Messages' },
    memory: { zh: '记忆与上下文', en: 'Memory & Context' },
    tools: { zh: '工具与能力', en: 'Tools & Capabilities' },
    agent: { zh: '技能与智能体', en: 'Skills & Agents' },
    workflow: { zh: '工作流与自动化', en: 'Workflow & Automation' },
    integration: { zh: '集成与连接', en: 'Integrations & Connections' },
    model: { zh: '模型与推理', en: 'Models & Reasoning' },
    dev: { zh: '开发与运维', en: 'Development & Operations' },
    knowledge: { zh: '数据与知识', en: 'Data & Knowledge' },
    fun: { zh: '娱乐', en: 'Entertainment' },
};
/** Stable identity of a hub entry across the zh/en files. */
function hubKey(entry) {
    const o = typeof entry.o === 'string' ? entry.o : '';
    const s = typeof entry.s === 'string' ? entry.s : '';
    return o !== '' && s !== '' ? `${o}/${s}` : s;
}
/** Normalize the hub's repo string ("owner/repo", possibly a full GitHub URL)
 * to the bare "owner/repo" the rest of the market speaks. */
function hubRepo(entry) {
    const raw = typeof entry.r === 'string' ? entry.r.trim() : '';
    if (raw === '')
        return '';
    const cleaned = raw.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
    const parts = cleaned.split('/').filter(Boolean);
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : cleaned;
}
let marketCache = null;
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`catalog HTTP ${res.status}`);
    return res.json();
}
/** Load the hub catalog: both language files fetched in parallel and merged
 * by entry key, so each plugin carries a {zh, en} description pair. Returns
 * null when the hub is completely unreachable. */
async function hubCatalog() {
    const [zhRes, enRes] = await Promise.allSettled([
        fetchJson(HUB_CATALOG_URLS.zh),
        fetchJson(HUB_CATALOG_URLS.en),
    ]);
    const zhList = zhRes.status === 'fulfilled' && Array.isArray(zhRes.value) ? zhRes.value : [];
    const enList = enRes.status === 'fulfilled' && Array.isArray(enRes.value) ? enRes.value : [];
    if (zhList.length === 0 && enList.length === 0)
        return null;
    const enByKey = new Map();
    for (const entry of enList) {
        const key = hubKey(entry);
        if (key !== '')
            enByKey.set(key, entry);
    }
    const seen = new Set();
    const plugins = [];
    for (const entry of [...zhList, ...enList]) {
        const key = hubKey(entry);
        if (key === '' || seen.has(key))
            continue;
        seen.add(key);
        const en = enByKey.get(key);
        const repo = hubRepo(entry);
        const category = typeof entry.c === 'string' && entry.c in HUB_CATEGORIES ? entry.c : 'tools';
        plugins.push({
            name: typeof entry.n === 'string' && entry.n !== '' ? entry.n : (typeof entry.s === 'string' ? entry.s : repo),
            owner: typeof entry.o === 'string' && entry.o !== '' ? entry.o : repo.split('/')[0] ?? '',
            url: repo !== '' ? `https://github.com/${repo}` : '',
            category,
            description: {
                zh: typeof entry.d === 'string' ? entry.d : undefined,
                en: typeof en?.d === 'string' ? en.d : undefined,
            },
            stars: typeof entry.sg === 'number' ? entry.sg : 0,
            added: typeof entry.a === 'string' ? entry.a : '',
            updatedAt: typeof entry.u === 'string' ? entry.u : undefined,
            install: repo !== '' ? `dsh plugin --profile web add github:${repo}` : '',
        });
    }
    return {
        updated: new Date().toISOString().slice(0, 10),
        count: plugins.length,
        categories: HUB_CATEGORIES,
        plugins,
    };
}
/** Load the catalog, preferring the cache and falling back to a stale copy.
 * Primary source is the hub; the legacy registry is the fallback. */
async function marketCatalog() {
    if (marketCache !== null && Date.now() - marketCache.at < MARKET_TTL_MS) {
        return { ok: true, data: marketCache.data };
    }
    let data = null;
    let error = '';
    try {
        data = await hubCatalog();
    }
    catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
    }
    if (data === null) {
        try {
            const res = await fetch(MARKET_CATALOG_URL);
            if (!res.ok)
                throw new Error(`catalog HTTP ${res.status}`);
            data = (await res.json());
        }
        catch (caught) {
            if (error === '')
                error = caught instanceof Error ? caught.message : String(caught);
        }
    }
    if (data !== null) {
        marketCache = { at: Date.now(), data };
        return { ok: true, data };
    }
    if (marketCache !== null)
        return { ok: true, data: marketCache.data };
    return { ok: false, error: error !== '' ? error : 'catalog unavailable' };
}
/** Project the catalog into the payload the client renders (trimmed fields).
 * Includes the set of currently-installed profile bundle names (plus the raw
 * dependency specs) so the client can mark already-installed plugins without
 * a separate round-trip. */
function marketPayload(scoped, catalog) {
    const plugins = Array.isArray(catalog.plugins) ? catalog.plugins : [];
    const { installed, installedSpecs } = readInstalledState(scoped);
    return {
        updated: catalog.updated ?? null,
        count: plugins.length,
        categories: catalog.categories ?? {},
        installed,
        installedSpecs,
        plugins: plugins.map((entry) => {
            const e = entry;
            return {
                name: typeof e.name === 'string' ? e.name : '',
                owner: typeof e.owner === 'string' ? e.owner : '',
                url: typeof e.url === 'string' ? e.url : '',
                category: typeof e.category === 'string' ? e.category : 'tools',
                description: e.description ?? {},
                stars: typeof e.stars === 'number' ? e.stars : 0,
                added: typeof e.added === 'string' ? e.added : '',
                updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : undefined,
                install: typeof e.install === 'string' ? e.install : '',
            };
        }),
    };
}
/** Read the web profile's installed state: the bundle/dependency NAMES (for
 * name-based matching) plus the raw dependency SPECS (for repo-based matching
 * like `github:owner/repo` — the form pnpm stores for GitHub installs). */
function readInstalledState(scoped) {
    const pkg = readProfilePackageJson();
    if (pkg === null)
        return { installed: [], installedSpecs: [] };
    const installed = [...new Set([...pkg.bundles, ...Object.keys(pkg.dependencies)])];
    const installedSpecs = Object.values(pkg.dependencies).filter((spec) => typeof spec === 'string' && spec !== '');
    return { installed, installedSpecs };
}
/** Parse the web profile's package.json (dependencies + bundle list). Returns
 * null when unreadable so callers can degrade gracefully. */
function readProfilePackageJson() {
    try {
        const home = process.env.HOME ?? '/data/data/com.termux/files/home';
        const pkgPath = `${home}/.dsh/profiles/web/package.json`;
        const raw = readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(raw);
        return { dependencies: pkg.dependencies ?? {}, bundles: pkg.dsh?.profile?.bundles ?? [] };
    }
    catch {
        return null;
    }
}
/** True when the installed package declares `dsh.bundle` metadata — the official
 * marker that makes `dsh plugin add` register it as a profile layer (mounts at
 * boot). Packages without it are plain dependencies and need a patch entry. */
function hasBundleMetadata(pkgName) {
    try {
        const home = process.env.HOME ?? '/data/data/com.termux/files/home';
        const parts = pkgName.startsWith('@') ? pkgName.split('/') : [pkgName];
        const pkgPath = join(home, '.dsh', 'profiles', 'web', 'node_modules', ...parts, 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        return pkg.dsh !== null && typeof pkg.dsh === 'object' && 'bundle' in pkg.dsh;
    }
    catch {
        return false;
    }
}
/** Read a bundle's `dsh.bundle.patch` file and return the loader row entry
 * names it declares — THE authoritative module specifiers the official
 * composition mounts at boot (a package may ship a dedicated `/dsh` subpath
 * entry, like some multi-harness packages do). Rows marked `disabled: true`
 * are skipped. Returns [] when the package has no bundle metadata. */
function bundleRowNames(pkgName) {
    const home = process.env.HOME ?? '/data/data/com.termux/files/home';
    const parts = pkgName.startsWith('@') ? pkgName.split('/') : [pkgName];
    const pkgRoot = join(home, '.dsh', 'profiles', 'web', 'node_modules', ...parts);
    try {
        const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
        const patchRel = pkg.dsh?.bundle?.patch;
        if (typeof patchRel !== 'string' || patchRel === '')
            return [];
        const patch = readFileSync(join(pkgRoot, patchRel), 'utf8');
        const names = new Set();
        for (const block of patch.split(/^\s*-\s/m).slice(1)) {
            if (/\bdisabled\s*:\s*true\b/.test(block))
                continue;
            const match = block.match(/^\s*name\s*:\s*["']?([^"'\s]+)["']?\s*$/m);
            if (match !== null)
                names.add(match[1]);
        }
        return [...names];
    }
    catch {
        return [];
    }
}
/** Persist a metadata-less package as a plain loader entry in the profile
 * patch, so the hot-loaded plugin also mounts on the NEXT boot (without this
 * row a plain dependency is never assembled). Mirrors the super-injector's
 * patch write: handles the initial `[]` form and skips when a row with the
 * same id already exists (including intentional `disabled` rows). */
function persistPlainEntry(pkgName) {
    try {
        const home = process.env.HOME ?? '/data/data/com.termux/files/home';
        const patchPath = `${home}/.dsh/profiles/web/cordis.patch.yml`;
        const idShort = pkgName.split('/').pop() ?? pkgName;
        const content = readFileSync(patchPath, 'utf8');
        if (content.includes(`id: ${idShort}`))
            return { ok: true, detail: 'patch 已有同名条目，跳过' };
        const line = `\n# 由 dsh-mobile-shell 市场安装持久化（${pkgName}，无 dsh.bundle 元数据）\n- id: ${idShort}\n  name: ${pkgName}\n`;
        const cleaned = /^\s*\[\s*\]\s*$/.test(content) ? content.replace(/\s*\[\s*\]\s*$/, '') : content;
        const body = cleaned.endsWith('\n') ? line : `\n${line}`;
        appendFileSync(patchPath, body, 'utf8');
        return { ok: true };
    }
    catch (error) {
        return { ok: false, detail: error instanceof Error ? error.message : String(error) };
    }
}
/** Read the web profile's installed bundle names from its package.json, so the
 * marketplace can mark already-installed plugins. Returns a Set of names. */
function readInstalledBundleNames(scoped) {
    const pkg = readProfilePackageJson();
    if (pkg === null)
        return [];
    return [...new Set([...pkg.bundles, ...Object.keys(pkg.dependencies)])];
}
async function handleMarketplaceGet(scoped, res) {
    const result = await marketCatalog();
    if (!result.ok || result.data === undefined) {
        sendJson(res, 502, { ok: false, error: result.error ?? 'catalog unavailable' });
        return;
    }
    sendJson(res, 200, { ok: true, ...marketPayload(scoped, result.data) });
}
async function handleMarketplaceInstall(scoped, req, res) {
    let body;
    try {
        body = JSON.parse(await readBody(req));
    }
    catch {
        sendJson(res, 400, { ok: false, error: 'invalid JSON body' });
        return;
    }
    const target = typeof body.target === 'string' && body.target.trim() !== '' ? body.target.trim() : null;
    if (target === null) {
        sendJson(res, 400, { ok: false, error: 'target (e.g. github:owner/repo) is required' });
        return;
    }
    const beforePkg = readProfilePackageJson();
    const { spawn } = await import('node:child_process');
    const output = [];
    const decoder = new TextDecoder();
    try {
        const result = await new Promise((resolve, reject) => {
            const child = spawn(process.execPath, ['--expose-internals', '/data/data/com.termux/files/usr/lib/node_modules/dsh-termux/lib/bin.js', 'plugin', '--profile', 'web', 'add', target], { stdio: ['ignore', 'pipe', 'pipe'] });
            const timer = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error('安装超时（180s）'));
            }, MARKET_INSTALL_TIMEOUT_MS);
            const collect = (chunk) => {
                const text = decoder.decode(chunk).trim();
                if (text !== '')
                    output.push(text);
            };
            child.stdout?.on('data', collect);
            child.stderr?.on('data', collect);
            child.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                if (code === 0)
                    resolve(output.join('\n'));
                else
                    reject(new Error(`dsh plugin add 退出码 ${code ?? 'unknown'}\n${output.join('\n')}`));
            });
        });
        // Detect the packages `dsh plugin add` actually added, then hot-mount them
        // through the Cordis loader so the install takes effect WITHOUT a restart.
        const afterPkg = readProfilePackageJson();
        const candidates = new Set();
        if (beforePkg !== null && afterPkg !== null) {
            for (const name of Object.keys(afterPkg.dependencies)) {
                if (!(name in beforePkg.dependencies))
                    candidates.add(name);
            }
            for (const name of afterPkg.bundles) {
                if (!beforePkg.bundles.includes(name))
                    candidates.add(name);
            }
        }
        // Reinstall of an already-present dependency adds nothing new; try to
        // guess the package name from the target itself — a bare npm spec, the
        // package.json of a local file: target, or a github:owner/repo pair that
        // matches an existing dependency (the dependency keys are ground truth).
        if (candidates.size === 0) {
            const depKeys = Object.keys(afterPkg?.dependencies ?? {});
            if (depKeys.includes(target)) {
                // The target names an already-installed dependency — re-mount it.
                candidates.add(target);
            }
            else if (/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(target)) {
                candidates.add(target);
            }
            else if (/^@[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(target)) {
                candidates.add(target);
            }
            else if (target.startsWith('file:')) {
                try {
                    const localPkg = JSON.parse(readFileSync(`${target.slice(5).replace(/\/+$/, '')}/package.json`, 'utf8'));
                    if (typeof localPkg.name === 'string' && localPkg.name !== '')
                        candidates.add(localPkg.name);
                }
                catch {
                    // unreadable local target — no candidates
                }
            }
            else {
                const github = target.match(/^github:([^/]+)\/([^/]+)/);
                if (github !== null) {
                    for (const guess of [`@${github[1]}/${github[2]}`, github[2]]) {
                        if (depKeys.includes(guess))
                            candidates.add(guess);
                    }
                }
            }
        }
        // A bundle's dsh.bundle.patch rows are the authoritative loader entries —
        // mount THOSE names (e.g. a package may ship a `/dsh` subpath entry),
        // falling back to the bare package name for metadata-less dependencies.
        const hotNames = new Set();
        for (const name of candidates) {
            const rows = bundleRowNames(name);
            if (rows.length > 0)
                rows.forEach((row) => hotNames.add(row));
            else
                hotNames.add(name);
        }
        const hot = await hotLoadInstalled(scoped, [...hotNames]);
        // Packages without dsh.bundle metadata are plain dependencies: hot-load
        // mounts them now, but a patch row is needed for them to survive a restart.
        const persisted = [];
        let persistFailed = false;
        for (const name of [...candidates]) {
            if (afterPkg !== null && afterPkg.bundles.includes(name))
                continue; // official layer already
            if (hasBundleMetadata(name))
                continue;
            const outcome = persistPlainEntry(name);
            if (outcome.ok)
                persisted.push(name);
            else
                persistFailed = true;
        }
        sendJson(res, 200, {
            ok: true,
            output: result,
            installed: readInstalledBundleNames(scoped),
            hotLoaded: hot.hotLoaded,
            hotName: hot.hotName,
            hotLoadError: hot.hotLoadError,
            persisted,
            persistFailed,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const tail = output.join('\n');
        sendJson(res, 200, { ok: false, error: message + (tail !== '' ? `\n${tail}` : '') });
    }
}
/** Hot-mount freshly installed profile packages via the Cordis loader. The
 * loader resolves the package from the profile directory's node_modules, so a
 * package just written there by `dsh plugin add` mounts immediately — no DSH
 * restart needed. Entries already ACTIVE are skipped (the running instance is
 * already the official one). */
async function hotLoadInstalled(scoped, names) {
    const loader = scoped.loader;
    if (loader === undefined)
        return { hotLoaded: false, hotLoadError: 'loader service is absent' };
    if (names.length === 0)
        return { hotLoaded: false, hotLoadError: '没有检测到新增的软件包' };
    const isActiveEntry = (name) => {
        for (const entry of loader.entries()) {
            const opts = entry.options;
            if (opts.group === true)
                continue;
            if (opts.name === name && entry.fiber !== undefined && entry.fiber.state === 2)
                return true;
        }
        return false;
    };
    for (const name of names) {
        if (isActiveEntry(name))
            return { hotLoaded: true, hotName: name };
        try {
            await loader.create({ name });
            // The entry mounts asynchronously; give it a short window to reach
            // ACTIVE so the response reflects reality, not the pending moment.
            for (let i = 0; i < 20; i++) {
                if (isActiveEntry(name))
                    return { hotLoaded: true, hotName: name };
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return { hotLoaded: true, hotName: name };
        }
        catch (error) {
            return {
                hotLoaded: false,
                hotName: name,
                hotLoadError: error instanceof Error ? error.message : String(error),
            };
        }
    }
    return { hotLoaded: false, hotLoadError: 'nothing to load' };
}
async function handleMarketplaceTranslate(scoped, req, res) {
    if (scoped.llm === undefined || scoped.settings === undefined) {
        sendJson(res, 501, { ok: false, error: 'llm service is absent' });
        return;
    }
    let body;
    try {
        body = JSON.parse(await readBody(req));
    }
    catch {
        sendJson(res, 400, { ok: false, error: 'invalid JSON body' });
        return;
    }
    const text = typeof body.text === 'string' && body.text.trim() !== '' ? body.text.trim() : null;
    if (text === null) {
        sendJson(res, 400, { ok: false, error: 'text is required' });
        return;
    }
    const def = scoped.settings.get('agent-default-model');
    const provider = def?.provider ?? 'deepseek-official';
    const model = def?.model ?? 'deepseek-v4-flash';
    try {
        const messages = [{
                role: 'user',
                content: [{ type: 'text', text: `Translate the following plugin description into Simplified Chinese. Output ONLY the translation, no commentary:\n\n${text}` }],
            }];
        let translation = '';
        for await (const chunk of scoped.llm.stream({ provider, model, messages })) {
            if (chunk.type === 'text-delta' && typeof chunk.text === 'string')
                translation += chunk.text;
        }
        translation = translation.trim();
        if (translation === '')
            throw new Error('模型未返回翻译结果');
        sendJson(res, 200, { ok: true, translation });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendJson(res, 200, { ok: false, error: message });
    }
}
async function handleMarketplaceReadme(scoped, req, res) {
    const parsed = new URL(req.url ?? '/', 'http://localhost');
    const owner = parsed.searchParams.get('owner') ?? '';
    const repo = parsed.searchParams.get('repo') ?? '';
    if (owner === '' || repo === '') {
        sendJson(res, 400, { ok: false, error: 'owner and repo are required' });
        return;
    }
    const candidates = [];
    for (const branch of ['main', 'master']) {
        candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.zh.md`);
        candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`);
    }
    for (const candidate of candidates) {
        try {
            const r = await fetch(candidate);
            if (!r.ok)
                continue;
            const readme = await r.text();
            sendJson(res, 200, { ok: true, readme: readme.slice(0, 64_000), url: candidate });
            return;
        }
        catch {
            // try the next candidate
        }
    }
    sendJson(res, 404, { ok: false, error: 'no README found' });
}
/* Fetch an arbitrary markdown file from the repo (used by the README window's
 * in-place language switcher — e.g. a README's `[中文](README_CN.md)` link
 * loads the Chinese doc inside the window instead of a new browser tab). */
async function handleMarketplaceReadmeFile(scoped, req, res) {
    const parsed = new URL(req.url ?? '/', 'http://localhost');
    const owner = parsed.searchParams.get('owner') ?? '';
    const repo = parsed.searchParams.get('repo') ?? '';
    const path = parsed.searchParams.get('path') ?? '';
    if (owner === '' || repo === '' || path === '') {
        sendJson(res, 400, { ok: false, error: 'owner, repo and path are required' });
        return;
    }
    const clean = path
        .split('/')
        .map((seg) => seg.trim())
        .filter((seg) => seg !== '' && seg !== '.' && seg !== '..')
        .join('/');
    if (clean === '' || !/\.(md|markdown|mdx)$/i.test(clean)) {
        sendJson(res, 400, { ok: false, error: 'invalid markdown path' });
        return;
    }
    for (const branch of ['main', 'master']) {
        try {
            const r = await fetch(`https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${branch}/${clean.split('/').map(encodeURIComponent).join('/')}`);
            if (!r.ok)
                continue;
            const readme = await r.text();
            sendJson(res, 200, { ok: true, readme: readme.slice(0, 64_000), path: clean });
            return;
        }
        catch {
            // try the next branch
        }
    }
    sendJson(res, 404, { ok: false, error: 'file not found' });
}
/* ---------- marketplace "last updated" times (GitHub pushed_at, lazily)
 * The hub catalog already carries the real repo updated time per plugin, so
 * the lazy GitHub resolution below is only a fallback for repos the catalog
 * has no date for. For those it resolves the GitHub repo's `pushed_at`
 * lazily for the repos the UI actually renders. Results are cached in memory
 * and on disk (12h TTL); the unauthenticated GitHub API quota (60 req/h) is
 * guarded with a cooldown and a tight concurrency limit, so heavy browsing
 * degrades gracefully back to the catalog date instead of hammering the API.
 */
const MARKET_UPDATED_TTL_MS = 12 * 3600_000;
const MARKET_UPDATED_MAX_BATCH = 40;
const MARKET_UPDATED_CONCURRENCY = 4;
const MARKET_UPDATED_TIMEOUT_MS = 6000;
const MARKET_UPDATED_CACHE_FILE = join(homedir(), '.dsh', 'marketplace-updated.json');
/** "owner/repo" from a https://github.com/… URL (the form the market's plugin
 * entries carry). Returns '' for anything unparseable. */
function githubRepoOfUrl(url) {
    try {
        const parts = new URL(url).pathname.split('/').filter(Boolean);
        if (parts.length >= 2)
            return `${parts[0]}/${parts[1]}`;
    }
    catch {
        // not a URL — fall through
    }
    return '';
}
let updatedCache = null;
let updatedCacheLoaded = false;
let updatedSaveChain = Promise.resolve();
let githubCooldownUntil = 0;
let mtCooldownUntil = 0;
async function loadUpdatedCache() {
    if (updatedCacheLoaded)
        return;
    updatedCacheLoaded = true;
    updatedCache = {};
    try {
        const raw = new TextDecoder().decode(await readFile(MARKET_UPDATED_CACHE_FILE));
        const data = JSON.parse(raw);
        if (data !== null && typeof data === 'object') {
            const now = Date.now();
            for (const key of Object.keys(data)) {
                const entry = data[key];
                if (entry !== null && typeof entry === 'object' && typeof entry.iso === 'string' && now - entry.at < MARKET_UPDATED_TTL_MS) {
                    updatedCache[key] = entry;
                }
            }
        }
    }
    catch {
        // no cache yet — fine
    }
}
function persistUpdatedCache() {
    updatedSaveChain = updatedSaveChain.then(async () => {
        try {
            await mkdir(join(homedir(), '.dsh'), { recursive: true });
            await writeFile(MARKET_UPDATED_CACHE_FILE, new TextEncoder().encode(JSON.stringify(updatedCache ?? {})));
        }
        catch {
            // persistence is best-effort
        }
    });
}
async function ghRepoPushedAt(owner, repo) {
    if (githubCooldownUntil > Date.now())
        return null;
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    try {
        const res = await fetch(url, {
            headers: {
                'user-agent': 'dsh-mobile-shell-marketplace',
                accept: 'application/vnd.github+json',
            },
            signal: AbortSignal.timeout(MARKET_UPDATED_TIMEOUT_MS),
        });
        if (res.status === 403 || res.status === 429) {
            githubCooldownUntil = Date.now() + 3600_000;
            return null;
        }
        if (res.status === 404) {
            // cache the miss briefly so we don't retry bad repos constantly
            updatedCache ??= {};
            updatedCache[`${owner}/${repo}`] = { iso: '', at: Date.now() };
            persistUpdatedCache();
            return null;
        }
        if (!res.ok)
            return null;
        const data = (await res.json());
        const pushed = typeof data.pushed_at === 'string' && data.pushed_at !== '' ? data.pushed_at : '';
        if (pushed === '')
            return null;
        updatedCache ??= {};
        updatedCache[`${owner}/${repo}`] = { iso: pushed, at: Date.now() };
        persistUpdatedCache();
        return pushed;
    }
    catch {
        return null;
    }
}
/* The unauthenticated GitHub API quota (60 req/h, shared IP) is quickly spent,
 * so we also resolve the last update time from the repo tarball: codeload has
 * no API quota and the archive's newest file mtime is the last commit time.
 * Downloads are bounded (small plugin repos fully; large repos abort), so a
 * full visible batch resolves even while the API is in cooldown. */
const CODELOAD_CAP_BYTES = 600_000;
function tarStr(tar, start, end) {
    let s = '';
    for (let i = start; i < end && i < tar.length; i++) {
        const c = tar[i];
        if (c === 0)
            break;
        s += String.fromCharCode(c);
    }
    return s;
}
async function codeloadPushedAt(owner, repo) {
    for (const branch of ['main', 'master']) {
        const url = `https://codeload.github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tar.gz/refs/heads/${branch}`;
        try {
            const res = await fetch(url, {
                headers: { 'user-agent': 'dsh-mobile-shell-marketplace' },
                signal: AbortSignal.timeout(MARKET_UPDATED_TIMEOUT_MS),
            });
            if (!res.ok || res.body === null)
                continue;
            const reader = res.body.getReader();
            const chunks = [];
            let total = 0;
            let aborted = false;
            for (;;) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                total += value.byteLength;
                if (total > CODELOAD_CAP_BYTES) {
                    await reader.cancel().catch(() => undefined);
                    aborted = true;
                    break;
                }
                chunks.push(value);
            }
            if (aborted)
                return null;
            const tar = gunzipSync(Buffer.concat(chunks));
            let max = 0;
            let off = 0;
            while (off + 512 <= tar.length) {
                const name = tarStr(tar, off, off + 100);
                if (name === '')
                    break;
                if (name !== 'pax_global_header' && !name.endsWith('/')) {
                    const mtime = parseInt(tarStr(tar, off + 136, off + 148).trim(), 8) || 0;
                    const size = parseInt(tarStr(tar, off + 124, off + 136).trim(), 8) || 0;
                    if (mtime > max)
                        max = mtime;
                    off += 512 + Math.ceil(size / 512) * 512;
                }
                else {
                    off += 512;
                }
            }
            if (max === 0)
                continue;
            const iso = new Date(max * 1000).toISOString();
            updatedCache ??= {};
            updatedCache[`${owner}/${repo}`] = { iso, at: Date.now() };
            persistUpdatedCache();
            return iso;
        }
        catch {
            // try the next branch
        }
    }
    return null;
}
async function handleMarketplaceUpdated(scoped, req, res) {
    const parsed = new URL(req.url ?? '/', 'http://localhost');
    const reposParam = parsed.searchParams.get('repos') ?? '';
    const keys = reposParam
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part !== '' && part.includes('/'))
        .slice(0, MARKET_UPDATED_MAX_BATCH);
    if (keys.length === 0) {
        sendJson(res, 200, { ok: true, updated: {} });
        return;
    }
    await loadUpdatedCache();
    const result = {};
    const missing = [];
    // The hub catalog already carries the real GitHub pushed_at per repo — serve
    // those straight from the catalog so the unauthenticated GitHub API quota is
    // never spent on hub entries (the lazy resolution below only runs for repos
    // the catalog has no date for, e.g. legacy-registry fallback entries).
    const catalogResult = await marketCatalog();
    const catalogUpdated = new Map();
    if (catalogResult.ok && catalogResult.data !== undefined) {
        for (const raw of (catalogResult.data.plugins ?? [])) {
            const updated = typeof raw.updatedAt === 'string' ? raw.updatedAt : '';
            const url = typeof raw.url === 'string' ? raw.url : '';
            const repo = githubRepoOfUrl(url);
            if (updated !== '' && repo !== '')
                catalogUpdated.set(repo, updated);
        }
    }
    const now = Date.now();
    for (const key of keys) {
        const fromCatalog = catalogUpdated.get(key);
        if (fromCatalog !== undefined) {
            result[key] = fromCatalog;
            continue;
        }
        const entry = updatedCache?.[key];
        if (entry !== undefined && entry.iso !== '' && now - entry.at < MARKET_UPDATED_TTL_MS) {
            result[key] = entry.iso;
        }
        else {
            const [owner, repo] = key.split('/');
            if (owner !== undefined && repo !== undefined && owner !== '' && repo !== '')
                missing.push([owner, repo]);
        }
    }
    if (missing.length > 0) {
        const queue = [...missing];
        const workers = Array.from({ length: Math.min(MARKET_UPDATED_CONCURRENCY, queue.length) }, async () => {
            while (queue.length > 0) {
                const [owner, repo] = queue.shift();
                let iso = null;
                if (githubCooldownUntil <= Date.now()) {
                    iso = await ghRepoPushedAt(owner, repo);
                }
                if (iso === null) {
                    iso = await codeloadPushedAt(owner, repo);
                }
                if (iso !== null)
                    result[`${owner}/${repo}`] = iso;
            }
        });
        await Promise.all(workers);
    }
    sendJson(res, 200, { ok: true, updated: result });
}
/* ---------- fast machine translation (README → English)
 * The modal's README translate button needs to be quick, so it goes through a
 * free MT endpoint (MyMemory) instead of the LLM: the prose is split into
 * ≤480-char chunks (sentence boundaries) and translated concurrently, then
 * stitched back together. The LLM endpoint is the fallback when the MT quota
 * is exhausted or unreachable.
 */
const MT_MAX_CHUNK = 480;
const MT_MAX_PROSE = 6000;
const MT_CONCURRENCY = 3;
const MT_TIMEOUT_MS = 9000;
const LLM_MT_CHUNK = 900;
const LLM_MT_CONCURRENCY = 3;
function stripCodeForTranslation(text) {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/[#>*_~|]/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function splitMtChunks(text) {
    const parts = [];
    const sentences = text.split(/(?<=[。！？!?；;\n])/u);
    let cur = '';
    for (const sentence of sentences) {
        if (cur !== '' && cur.length + sentence.length > MT_MAX_CHUNK) {
            parts.push(cur);
            cur = sentence;
        }
        else {
            cur += sentence;
        }
        while (cur.length > MT_MAX_CHUNK) {
            parts.push(cur.slice(0, MT_MAX_CHUNK));
            cur = cur.slice(MT_MAX_CHUNK);
        }
    }
    if (cur.trim() !== '')
        parts.push(cur);
    return parts;
}
async function mymemoryTranslate(chunk) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|zh-CN`;
        const res = await fetch(url, {
            headers: { 'user-agent': 'dsh-mobile-shell-marketplace' },
            signal: AbortSignal.timeout(MT_TIMEOUT_MS),
        });
        if (res.status === 429) {
            // free daily quota exhausted — don't retry for a while
            mtCooldownUntil = Date.now() + 3600_000;
            return null;
        }
        if (!res.ok)
            return null;
        const data = (await res.json());
        if (data.responseStatus !== 200)
            return null;
        const out = typeof data.responseData?.translatedText === 'string' ? data.responseData.translatedText.trim() : '';
        return out !== '' ? out : null;
    }
    catch {
        return null;
    }
}
/** Clean an LLM/MT translation before the client re-renders it as markdown:
 * unwrap a whole-answer code fence the model sometimes adds, and drop stray
 * fences entirely — an odd fence would make the markdown pass turn the rest of
 * the document into one big code block. */
function sanitizeTranslation(text) {
    let t = text.trim();
    const whole = /^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/.exec(t);
    if (whole !== null)
        return whole[1]?.trim() ?? '';
    if (((t.match(/```/g) ?? []).length % 2) === 1) {
        t = t.replace(/```[^\n]*/g, '');
    }
    return t;
}
/** Long READMEs are split and translated through several parallel LLM streams
 * so the whole thing lands in a few seconds instead of a minute. */
async function translateWithLlmConcurrent(scoped, prose) {
    if (scoped.llm === undefined)
        throw new Error('llm service is absent');
    if (scoped.llm === undefined)
        throw new Error('llm service is absent');
    const llm = scoped.llm;
    const def = scoped.settings?.get('agent-default-model');
    const provider = def?.provider ?? 'deepseek-official';
    const model = def?.model ?? 'deepseek-v4-flash';
    const pieces = [];
    for (let i = 0; i < prose.length; i += LLM_MT_CHUNK)
        pieces.push(prose.slice(i, i + LLM_MT_CHUNK));
    const queue = pieces.map((piece, index) => ({ piece, index }));
    const out = new Array(pieces.length).fill('');
    const workers = Array.from({ length: Math.min(LLM_MT_CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0) {
            const item = queue.shift();
            if (item === undefined)
                return;
            let text = '';
            const messages = [{
                    role: 'user',
                    content: [{ type: 'text', text: `Translate this excerpt of a plugin README into Simplified Chinese (简体中文). Keep any markdown markers intact. Output ONLY the translation:\n\n${item.piece}` }],
                }];
            try {
                for await (const chunk of llm.stream({ provider, model, reasoningEffort: 'off', messages })) {
                    if (chunk.type === 'text-delta' && typeof chunk.text === 'string')
                        text += chunk.text;
                }
            }
            catch {
                text = '';
            }
            out[item.index] = text.trim();
        }
    });
    await Promise.all(workers);
    const joined = out.join('\n\n').trim();
    if (joined === '')
        throw new Error('模型未返回翻译结果');
    return sanitizeTranslation(joined);
}
async function handleMarketplaceTranslateMt(scoped, req, res) {
    let body;
    try {
        body = JSON.parse(await readBody(req));
    }
    catch {
        sendJson(res, 400, { ok: false, error: 'invalid JSON body' });
        return;
    }
    const raw = typeof body.text === 'string' && body.text.trim() !== '' ? body.text.trim() : null;
    if (raw === null) {
        sendJson(res, 400, { ok: false, error: 'text is required' });
        return;
    }
    // Already contains CJK → it's (mostly) Chinese; nothing to translate.
    if (/[\u3400-\u9fff]/.test(raw)) {
        sendJson(res, 200, { ok: true, translation: raw.slice(0, 64_000) });
        return;
    }
    const prose = stripCodeForTranslation(raw).slice(0, MT_MAX_PROSE);
    if (prose === '') {
        sendJson(res, 200, { ok: true, translation: raw.slice(0, 64_000) });
        return;
    }
    const chunks = splitMtChunks(prose);
    let done = false;
    if (mtCooldownUntil <= Date.now()) {
        const out = new Array(chunks.length).fill(null);
        const queue = chunks.map((chunk, index) => ({ chunk, index }));
        const workers = Array.from({ length: Math.min(MT_CONCURRENCY, queue.length) }, async () => {
            while (queue.length > 0) {
                const item = queue.shift();
                if (item === undefined)
                    return;
                const translated = await mymemoryTranslate(item.chunk);
                if (translated !== null)
                    out[item.index] = translated;
            }
        });
        await Promise.all(workers);
        done = out.every((piece) => piece !== null);
        if (done) {
            sendJson(res, 200, { ok: true, translation: sanitizeTranslation(out.join('').replace(/\s{2,}/g, ' ')) });
            return;
        }
    }
    // Fallback: concurrent LLM translation (fast even for long READMEs).
    if (scoped.llm === undefined) {
        sendJson(res, 200, { ok: false, error: '机器翻译不可用' });
        return;
    }
    try {
        const translation = await translateWithLlmConcurrent(scoped, prose);
        sendJson(res, 200, { ok: true, translation });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendJson(res, 200, { ok: false, error: message });
    }
}
/**
 * Declare per-model reasoning levels for one hand-declared custom provider.
 *
 * The pi-ai adapter resolves each declared level to a wire spelling
 * (`thinkingLevelMap`): `off` stores null (selecting it falls back to
 * `reasoning_effort: "off"` on the wire), every other tier sends its own id
 * (the OpenAI `reasoning_effort` convention). A route-level `defaultLevel` is
 * required: it is stored as `providers.<route>.reasoning`, which both
 * pre-selects that effort in the composer picker and suppresses the picker's
 * "provider default" option.
 * Undeclared levels are pinned unsupported, so the composer picker only
 * offers what is declared here. An empty level list removes the declaration,
 * restoring the model's no-reasoning state; the route-level `defaultLevel` is
 * the effort applied when the user does not pick one (stored as
 * `providers.<route>.reasoning`, with `auto` stored as `medium`).
 *
 * The settings path ops cannot address ARRAY elements (intermediate nodes
 * must be plain objects), so the whole `providers.<route>` entry is rebuilt
 * from the raw user section and replaced with one `set` op.
 */
async function handleReasoningWrite(scoped, req, res) {
    const settings = scoped.settings;
    if (settings === undefined) {
        sendJson(res, 501, { ok: false, error: 'settings service is absent' });
        return;
    }
    let body;
    try {
        body = JSON.parse(await readBody(req));
    }
    catch {
        sendJson(res, 400, { ok: false, error: 'invalid JSON body' });
        return;
    }
    const route = typeof body.route === 'string' && body.route !== '' ? body.route : null;
    const revision = typeof body.revision === 'number' ? body.revision : undefined;
    const rawModels = Array.isArray(body.models) ? body.models : null;
    if (route === null || rawModels === null || rawModels.length === 0) {
        sendJson(res, 400, { ok: false, error: 'route and models are required' });
        return;
    }
    // Validate against the CURRENT namespace content before writing. The raw
    // user section is the write-back base: writing the schema-resolved value
    // would bake every default (input arrays, caps, ...) into the document.
    const descriptor = settings.describe({ redactSecrets: true }).find((entry) => entry.ns === PI_AI_NS);
    const section = (descriptor?.value ?? {});
    const providersRaw = typeof section.providers === 'object' && section.providers !== null ? section.providers : {};
    const entry = providersRaw[route];
    if (entry === undefined || !Array.isArray(entry.models)) {
        sendJson(res, 404, { ok: false, error: `provider "${route}" is not a hand-declared custom provider` });
        return;
    }
    const userSection = (descriptor?.user ?? {});
    const userProviders = typeof userSection?.providers === 'object' && userSection.providers !== null ? userSection.providers : {};
    const base = userProviders[route] ?? entry;
    const rebuilt = structuredClone(base);
    const models = Array.isArray(rebuilt.models) ? rebuilt.models : null;
    if (models === null) {
        sendJson(res, 400, { ok: false, error: `provider "${route}" has no models list` });
        return;
    }
    for (const item of rawModels) {
        if (typeof item !== 'object' || item === null)
            continue;
        const raw = item;
        const modelId = typeof raw.id === 'string' ? raw.id : null;
        const levels = Array.isArray(raw.levels) ? raw.levels : [];
        if (modelId === null || !levels.every(isUiLevel)) {
            sendJson(res, 400, { ok: false, error: 'each model needs an id and a level list from the supported vocabulary' });
            return;
        }
        const index = models.findIndex((model) => model.id === modelId);
        if (index === -1) {
            sendJson(res, 400, { ok: false, error: `provider "${route}" has no model "${modelId}"` });
            return;
        }
        const target = models[index];
        if (levels.length === 0) {
            // Explicit `false` (not deletion): the auto-backfill skips `false`
            // models, so "no reasoning control" survives the next settings change.
            target.reasoningEfforts = false;
        }
        else if (!levels.some((level) => level !== 'off')) {
            // pi-ai rejects a dict that declares nothing beyond `off`
            sendJson(res, 400, { ok: false, error: 'at least one thinking tier beyond off is required' });
            return;
        }
        else {
            const dict = {};
            for (const level of levels)
                dict[KEY_FOR[level]] = WIRE_FOR[level];
            target.reasoningEfforts = dict;
        }
    }
    const defaultLevel = isUiLevel(body.defaultLevel) ? body.defaultLevel : null;
    if (defaultLevel === null) {
        // A route default is mandatory: without one the picker falls back to a
        // "provider default" option, which the user explicitly removed.
        sendJson(res, 400, { ok: false, error: 'a default reasoning tier is required' });
        return;
    }
    rebuilt.reasoning = KEY_FOR[defaultLevel];
    try {
        await settings.mutate(PI_AI_NS, [{ op: 'set', path: ['providers', route], value: rebuilt }], revision);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const name = error instanceof Error ? error.name : '';
        sendJson(res, name === 'SettingsConflictError' ? 409 : 400, {
            ok: false,
            error: message,
            conflict: name === 'SettingsConflictError',
        });
        return;
    }
    sendJson(res, 200, { ok: true });
}
function sendJson(res, status, payload) {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(payload));
}
/** Local credentials document used by dsh-credentials-local. */
function credentialsPath() {
    return join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), '.credentials.yaml');
}
function quoteYamlScalar(value) {
    if (value === '' || /[\s:#&*!|>'"@`\\]/.test(value) || value !== value.trim())
        return JSON.stringify(value);
    return value;
}
function parseCredentialsKeys(text) {
    const lines = text.split('\n');
    const keys = new Map();
    for (let i = 0; i < lines.length; i++) {
        const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(lines[i] ?? '');
        if (match !== null && match[1] !== undefined)
            keys.set(match[1], i);
    }
    return { lines, keys };
}
function isGithubPat(value) {
    return /^(ghp_|github_pat_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_]{16,}$/.test(value);
}
async function readGithubTokenStatus() {
    try {
        const text = new TextDecoder().decode(await readFile(credentialsPath()));
        const { lines, keys } = parseCredentialsKeys(text);
        const idx = keys.get(GITHUB_TOKEN_REF);
        if (idx === undefined)
            return { configured: false };
        const line = lines[idx] ?? '';
        const raw = line.slice(line.indexOf(':') + 1).trim().replace(/^['"]|['"]$/g, '');
        if (raw === '')
            return { configured: false };
        return { configured: true, source: 'file' };
    }
    catch {
        return { configured: false };
    }
}
async function writeGithubToken(token) {
    const path = credentialsPath();
    let text = '';
    try {
        text = new TextDecoder().decode(await readFile(path));
    }
    catch {
        text = '';
    }
    const { lines, keys } = parseCredentialsKeys(text);
    const idx = keys.get(GITHUB_TOKEN_REF);
    if (token === null || token === '') {
        if (idx !== undefined)
            lines.splice(idx, 1);
    }
    else {
        const next = `${GITHUB_TOKEN_REF}: ${quoteYamlScalar(token)}`;
        if (idx !== undefined)
            lines[idx] = next;
        else {
            while (lines.length > 0 && lines[lines.length - 1] === '')
                lines.pop();
            lines.push(next);
        }
    }
    let out = lines.join('\n').replace(/\n+$/g, '');
    if (out !== '')
        out += '\n';
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, new TextEncoder().encode(out));
    try {
        await chmod(path, 0o600);
    }
    catch {
        // mode is best-effort on filesystems that ignore chmod
    }
    return token !== null && token !== '' ? { configured: true, source: 'file' } : { configured: false };
}
async function handleGithubTokenGet(res) {
    const status = await readGithubTokenStatus();
    sendJson(res, 200, { ok: true, ...status });
}
async function handleGithubTokenWrite(req, res) {
    const raw = await readBody(req);
    let body;
    try {
        body = JSON.parse(raw);
    }
    catch {
        sendJson(res, 400, { ok: false, error: 'invalid json' });
        return;
    }
    if (body.clear === true) {
        const status = await writeGithubToken(null);
        sendJson(res, 200, { ok: true, ...status });
        return;
    }
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (token === '') {
        sendJson(res, 400, { ok: false, error: 'missing token' });
        return;
    }
    if (token.length > 256 || !isGithubPat(token)) {
        sendJson(res, 400, { ok: false, error: 'not a GitHub personal access token' });
        return;
    }
    const status = await writeGithubToken(token);
    sendJson(res, 200, { ok: true, ...status });
}
/** Diagnostic log for the delete route (host stdout is not reachable from here). */
async function logDelete(message) {
    try {
        const home = process.env.HOME ?? '';
        if (home === '')
            return;
        await appendFile(`${home}/.dsh/super-injector/mobile-nav-delete.log`, `${new Date().toISOString()} ${message}\n`);
    }
    catch {
        // diagnostics must never break the route
    }
}
/** Remove the durable log directory for one session id under any project dir. */
async function removeSessionLog(sessionPersistence, sessionId) {
    const root = sessionPersistence.config?.root;
    if (root === undefined || root === '')
        throw new DeleteSessionError(500, 'session persistence root is unavailable');
    const projects = await readdir(root).catch(() => []);
    for (const project of projects) {
        const sessionDir = join(root, project, sessionId);
        const entries = await readdir(sessionDir).catch(() => null);
        if (entries === null)
            continue;
        await rm(sessionDir, { recursive: true, force: true });
        return;
    }
}
/**
 * Bounded wait for an agent's quiescence: the delete is a force-stop, so a
 * stuck driver must not hold the deletion hostage — after the bound the log
 * is removed anyway and the detached agent has no input source left.
 */
const QUIESCENCE_TIMEOUT_MS = 8_000;
/** Wait after detach before the resurrection guard re-check. */
const RESURRECTION_GUARD_DELAY_MS = 400;
async function deleteSessionDurable(scoped, sessionId) {
    if (!SESSION_ID_RE.test(sessionId))
        throw new DeleteSessionError(400, 'invalid session id');
    // Force-stop the session's agent if it is still live (a "stopped" session
    // stays in the live store until its fiber unloads, so presence here does
    // NOT mean it is running): cancel any active turn or between-turn task,
    // wait for quiescence within a bound, then detach the session from the
    // store — emitting `session/disposed` so clients drop the row — before
    // removing its durable log.
    const agent = scoped.agents?.get?.(sessionId);
    if (agent !== undefined) {
        try {
            agent.cancel({ kind: 'user' });
            await Promise.race([agent.whenIdle(), delay(QUIESCENCE_TIMEOUT_MS)]);
        }
        catch {
            // Best-effort: a failed cancel still proceeds with the removal below.
        }
    }
    const liveSession = scoped.sessions?.get(sessionId);
    if (liveSession !== undefined) {
        try {
            // The persistence backend writes events on a throttled batch delay, so
            // a freshly created / recently written session may still hold its log
            // in memory. Flush first, otherwise the removal below deletes nothing
            // and the delayed flush resurrects the file afterwards.
            const sessionsSvc = scoped.sessions;
            await sessionsSvc.flush(liveSession);
        }
        catch {
            // Best-effort: a failed flush leaves the log partially on disk; the
            // removal below still deletes whatever is there.
        }
        // Remove the durable log BEFORE detaching: detaching emits
        // `session/disposed`, whose listeners may append teardown events — those
        // would land in a log we are about to delete and resurrect it.
        if (scoped.sessionPersistence !== undefined) {
            await removeSessionLog(scoped.sessionPersistence, sessionId);
        }
        try {
            // detachEntered/liveEntryFor are private on the store; the removal is
            // idempotent (a no-op for an already-detached entry), so the fiber's
            // own teardown later re-detaches safely.
            const store = scoped.sessions;
            const entry = store.liveEntryFor(liveSession);
            if (entry !== undefined)
                store.detachEntered(entry);
        }
        catch {
            // Best-effort: a failed detach leaves the (idle) session in the store;
            // the log removal above already succeeded.
        }
        // Defense-in-depth: a teardown listener may still append after detach
        // (e.g. an agent writing its final stop event). Give the teardown a
        // moment to flush, then remove any resurrected log.
        await delay(RESURRECTION_GUARD_DELAY_MS);
        if (scoped.sessionPersistence !== undefined) {
            await removeSessionLog(scoped.sessionPersistence, sessionId);
        }
    }
    else if (scoped.sessionPersistence !== undefined) {
        await removeSessionLog(scoped.sessionPersistence, sessionId);
    }
    const registry = scoped.workspaceRegistry;
    if (registry !== undefined) {
        for (const workspace of registry.list()) {
            if (workspace.sessionIds.includes(sessionId))
                await workspace.detachSession(sessionId);
        }
        // Clear the archived-set membership (best-effort: the archived set only
        // affects list visibility, so a stale id is harmless if this ever fails).
        try {
            const state = registry.requireState();
            const archived = state.global.archivedSessionIds;
            if (archived.includes(sessionId)) {
                await registry.setState({
                    ...state,
                    global: { ...state.global, archivedSessionIds: archived.filter((id) => id !== sessionId) },
                });
            }
        }
        catch {
            // best-effort
        }
    }
}
async function handleDelete(scoped, req, res) {
    let sessionId = null;
    try {
        const raw = await readBody(req);
        const body = JSON.parse(raw);
        sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
        if (sessionId === null)
            return sendJson(res, 400, { ok: false, error: 'missing sessionId' });
        await deleteSessionDurable(scoped, sessionId);
        await logDelete(`ok delete ${sessionId}`);
        sendJson(res, 200, { ok: true, sessionId });
    }
    catch (error) {
        const status = error instanceof DeleteSessionError ? error.status : 500;
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? (error.stack ?? '') : '';
        await logDelete(`FAIL delete ${sessionId ?? '(unknown)'} status=${status} error=${JSON.stringify(message)} stack=${JSON.stringify(stack)}`);
        sendJson(res, status, {
            ok: false,
            error: message,
        });
    }
}
/** The empty apply becomes a real plugin: route registration for the delete service. */
export function apply(ctx) {
    ctx.inject(['webServer', 'agents', 'sessions', 'workspaceRegistry', 'sessionPersistence', 'settings', 'llm', 'loader'], (childCtx) => {
        const scoped = childCtx;
        const unregisterDelete = scoped.webServer.register({
            kind: 'exact',
            path: ROUTE_PATH,
            handler: (req, res) => {
                // Double guard: any escape from handleDelete must still answer
                // JSON — the webserver's own catch would reply with an EMPTY body
                // (400), which the browser client cannot parse and would surface
                // as a generic failure despite the deletion having happened.
                handleDelete(scoped, req, res).catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    void logDelete(`UNCAUGHT ${JSON.stringify(message)}`);
                    try {
                        sendJson(res, 500, { ok: false, error: 'internal error' });
                    }
                    catch {
                        // response already written; nothing left to do
                    }
                });
            },
        });
        const unregisterStore = scoped.webServer.register({
            kind: 'exact',
            path: STORE_IMAGE_PATH,
            handler: (req, res) => {
                handleStoreImage(scoped, req, res).catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    sendJson(res, 500, { ok: false, error: message });
                });
            },
        });
        const unregisterImage = scoped.webServer.register({
            kind: 'exact',
            path: IMAGE_GET_PATH,
            handler: (req, res) => {
                handleGetImage(scoped, req, res).catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    try {
                        sendJson(res, 500, { ok: false, error: message });
                    }
                    catch {
                        // response already written
                    }
                });
            },
        });
        const unregisterReasoning = scoped.webServer.register({
            kind: 'exact',
            path: REASONING_GET_PATH,
            handler: (req, res) => {
                const run = req.method === 'POST'
                    ? () => handleReasoningWrite(scoped, req, res)
                    : () => handleReasoningGet(scoped, res);
                run().catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    try {
                        sendJson(res, 500, { ok: false, error: message });
                    }
                    catch {
                        // response already written
                    }
                });
            },
        });
        // Auto-backfill: keep every hand-declared custom model on the default
        // reasoning set. Models added through the official settings UI carry no
        // `reasoningEfforts`; this listener injects the defaults the moment the
        // namespace changes, so the composer picker offers levels for them
        // without any manual step. The backfill is idempotent (nothing to fill
        // → no write), so it cannot loop.
        const reportBackfillError = (error) => {
            const message = error instanceof Error ? error.message : String(error);
            childCtx.logger?.warn(`dsh-mobile-shell: reasoning backfill failed: ${message}`);
        };
        const offSettings = childCtx.on('settings/updated', (ns) => {
            if (ns !== PI_AI_NS)
                return;
            void backfillReasoningDefaults(scoped).catch(reportBackfillError);
        });
        void backfillReasoningDefaults(scoped).catch(reportBackfillError);
        // Plugin marketplace routes: catalog listing, official install, AI
        // translation and README proxying for the repo window.
        const marketRoutes = [
            { method: 'GET', path: '/api/mobile-nav/marketplace', handler: (_req, res) => handleMarketplaceGet(scoped, res) },
            { method: 'GET', path: '/api/mobile-nav/marketplace/updated', handler: (req, res) => handleMarketplaceUpdated(scoped, req, res) },
            { method: 'GET', path: '/api/mobile-nav/marketplace/readme', handler: (req, res) => handleMarketplaceReadme(scoped, req, res) },
            { method: 'GET', path: '/api/mobile-nav/marketplace/readme-file', handler: (req, res) => handleMarketplaceReadmeFile(scoped, req, res) },
            { method: 'POST', path: '/api/mobile-nav/marketplace/install', handler: (req, res) => handleMarketplaceInstall(scoped, req, res) },
            { method: 'POST', path: '/api/mobile-nav/marketplace/translate', handler: (req, res) => handleMarketplaceTranslate(scoped, req, res) },
            { method: 'POST', path: '/api/mobile-nav/marketplace/translate-mt', handler: (req, res) => handleMarketplaceTranslateMt(scoped, req, res) },
            { method: 'GET', path: GITHUB_TOKEN_PATH, handler: (_req, res) => handleGithubTokenGet(res) },
            { method: 'POST', path: GITHUB_TOKEN_PATH, handler: (req, res) => handleGithubTokenWrite(req, res) },
        ];
        const unregisterMarket = marketRoutes.map((route) => scoped.webServer.register({
            kind: 'exact',
            path: route.path,
            handler: (req, res) => {
                if ((req.method ?? 'GET') !== route.method) {
                    try {
                        sendJson(res, 405, { ok: false, error: `method ${req.method} not allowed` });
                    }
                    catch {
                        // response already written
                    }
                    return;
                }
                Promise.resolve(route.handler(req, res)).catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    try {
                        sendJson(res, 500, { ok: false, error: message });
                    }
                    catch {
                        // response already written
                    }
                });
            },
        }));
        return () => {
            offSettings();
            unregisterDelete();
            unregisterStore();
            unregisterImage();
            unregisterReasoning();
            for (const unregister of unregisterMarket)
                unregister();
        };
    });
}
//# sourceMappingURL=index.js.map