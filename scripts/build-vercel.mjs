// Builds the Vercel deployment in Vercel's Build Output API format: the built
// app as static files, and the API bundled with esbuild into one Node function.
// Run after `vite build` (npm run build:vercel does both).
import { build } from 'esbuild'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'

const out = '.vercel/output'
rmSync(out, { recursive: true, force: true })
mkdirSync(`${out}/functions/api.func`, { recursive: true })

cpSync('dist', `${out}/static`, { recursive: true })

await build({
  entryPoints: ['server/vercel.ts'],
  outfile: `${out}/functions/api.func/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Express is CommonJS; give the ESM bundle a require() for Node's own modules.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
})

writeFileSync(
  `${out}/functions/api.func/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', supportsResponseStreaming: true }, null, 2),
)

// /api/* goes to the function; files are served as they are; every other path
// is a page of the single-page app.
writeFileSync(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '/api/(.*)', dest: '/api' },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
)

console.log(`Built ${out}: static app + api function`)
