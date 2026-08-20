/**
 * Minimal ambient declarations for the node builtins this plugin's host half
 * uses. The plugin build intentionally declares no @types/node dependency
 * (offline-friendly), so the exact members consumed are typed here.
 */
declare module 'node:fs/promises' {
  export function readdir(path: string): Promise<string[]>
  export function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>
  export function appendFile(path: string, data: string): Promise<void>
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<string | undefined>
  export function writeFile(path: string, data: Uint8Array, options?: { flag?: string }): Promise<void>
  export function readFile(path: string): Promise<Uint8Array>
  export function chmod(path: string, mode: number): Promise<void>
}

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string
  export function appendFileSync(path: string, data: string, encoding?: string): void
}

declare module 'node:path' {
  export function join(...paths: string[]): string
  export function resolve(...paths: string[]): string
  export function dirname(path: string): string
}

declare module 'node:os' {
  export function homedir(): string
}

declare module 'node:crypto' {
  export function createHash(algorithm: string): {
    update(data: Uint8Array): { digest(encoding: 'hex'): string }
  }
}

declare module 'node:child_process' {
  export function spawn(
    command: string,
    args: readonly string[],
    options?: { stdio?: readonly ('ignore' | 'pipe' | 'inherit')[] },
  ): {
    stdout?: { on(event: 'data', listener: (chunk: Uint8Array) => void): unknown }
    stderr?: { on(event: 'data', listener: (chunk: Uint8Array) => void): unknown }
    on(event: 'error', listener: (error: unknown) => void): unknown
    on(event: 'close', listener: (code: number | null) => void): unknown
    kill(signal: string): unknown
  }
}

declare module 'node:zlib' {
  export function gunzipSync(input: Uint8Array): Uint8Array
}

declare class TextDecoder {
  decode(input?: Uint8Array): string
}

declare class TextEncoder {
  encode(input?: string): Uint8Array
}

declare const process: {
  env: Record<string, string | undefined>
  cwd(): string
  execPath: string
}

declare const Buffer: {
  from(data: string, encoding: 'base64'): Uint8Array
  from(data: Uint8Array): Uint8Array
  concat(list: Uint8Array[]): Uint8Array
}
