/**
 * The API as one Vercel function (bundled by scripts/build-vercel.mjs).
 *
 * Data lives in Upstash Redis when Vercel's integration has set its variables;
 * without them it falls back to a file in /tmp, which lasts only as long as one
 * function instance. The first request on an empty database seeds the demo
 * school, so the public demo always has Asha, Rohan and the rest.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApp } from './app.ts'
import { seedDemo } from './lib/demo.ts'
import { backendFromEnv } from './lib/store.ts'

const sessionSecret = process.env.SESSION_SECRET ?? ''
const { app, store } = createApp({ backend: backendFromEnv('/tmp/hpc-career/db.json'), sessionSecret })

let ready: Promise<unknown> | null = null
const seededOnce = () =>
  (ready ??= store
    .profiles()
    .then((profiles) => (profiles.length ? null : seedDemo(store)))
    .catch((cause) => {
      ready = null
      throw cause
    }))

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!sessionSecret) {
    res.statusCode = 500
    res.setHeader('content-type', 'application/json')
    return res.end(JSON.stringify({ error: 'SESSION_SECRET is not set on this deployment' }))
  }
  await seededOnce()
  app(req, res)
}
