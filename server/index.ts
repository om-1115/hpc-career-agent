/**
 * The server: the API (server/app.ts), plus the built app when dist/ exists, so
 * a deployment is one process on one origin. In development Vite serves the app
 * and proxies /api here.
 */

import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createApp } from './app.ts'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const port = Number(process.env.PORT ?? 8787)
const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex')
if (!process.env.SESSION_SECRET) {
  console.warn('[server] SESSION_SECRET is unset — using a random one, so a restart signs everyone out.')
}

const { app } = createApp({ dataFile: process.env.DATA_FILE || '.data/db.json', sessionSecret })

const dist = fileURLToPath(new URL('../dist', import.meta.url))
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false }))
  // Client-side routes (/login, /student, …) all load the one page.
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(`${dist}/index.html`)
  })
}

app.listen(port, () => {
  console.log(`[server] listening on :${port}${existsSync(dist) ? ' — serving dist/' : ''}`)
})
