// Wrap the tsc-compiled CommonJS client program into the DSH browser loader
// shape: window.__ModuleLoader__.load({ id, factory: (require) => ... }).
// Relative modules are inlined with a tiny local require; platform modules
// (react, primitives, ...) stay as require() calls and are resolved by the
// host's browser module table.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const buildDir = join(root, '.client-build')
const outputPath = join(root, 'lib', 'client.js')

const sources = new Map()
for (const file of (await readdir(buildDir)).filter((f) => f.endsWith('.js'))) {
  sources.set(
    file,
    (await readFile(join(buildDir, file), 'utf8')).replace(/\n?\/\/# sourceMappingURL=.*$/u, ''),
  )
}

// Dependency-first topological order from the entry.
const visited = new Set()
const order = []
const visit = (file) => {
  if (visited.has(file)) return
  visited.add(file)
  for (const match of sources.get(file).matchAll(/require\("(\.[^"]+\.js)"\)/gu)) {
    visit(match[1].slice(2))
  }
  order.push(file)
}
visit('index.js')

const modules = order
  .map((file) => `__modules[${JSON.stringify(file)}] = function (require, module, exports) {\n${sources.get(file)}\n};`)
  .join('\n')

const wrapped = [
  'window.__ModuleLoader__.load({ id: "dsh-mobile-shell", factory: (require) => {',
  'var __modules = {};',
  modules,
  'var __cache = {};',
  'function __localRequire(id) {',
  '  if (id.charCodeAt(0) !== 46) return require(id);',
  '  id = id.slice(2);',
  '  var cached = __cache[id];',
  '  if (cached) return cached.exports;',
  '  var module = { exports: {} };',
  '  __cache[id] = module;',
  '  __modules[id](__localRequire, module, module.exports);',
  '  return module.exports;',
  '}',
  'var module = { exports: {} };',
  '__modules["index.js"](__localRequire, module, module.exports);',
  'return module.exports; } });',
  '',
].join('\n')

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, wrapped)
await rm(join(root, 'lib', 'client.js.map'), { force: true })
await rm(buildDir, { recursive: true, force: true })
console.log(`client bundle written: ${outputPath} (${order.length} modules inlined)`)
