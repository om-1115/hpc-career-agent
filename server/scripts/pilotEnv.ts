/**
 * The pilot scripts' settings: ENV_FILE (default .env.local) if it exists, such
 * as the pilot deployment's variables from `npx vercel env pull .env.pilot.local`.
 * The data goes to Redis when those variables are there, otherwise to DATA_FILE.
 * On Redis, DATA_KEY must be set, so a pilot script never touches the demo.
 */

import { existsSync } from 'node:fs'
import { backendFromEnv, Store } from '../lib/store.ts'

const envFile = process.env.ENV_FILE || '.env.local'
if (existsSync(envFile)) process.loadEnvFile(envFile)

if ((process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) && !process.env.DATA_KEY) {
  console.error('Set DATA_KEY (e.g. hpc-career:pilot) so the pilot’s data stays apart from the demo’s.')
  process.exit(1)
}

export const pilotStore = () => new Store(backendFromEnv(process.env.DATA_FILE || '.data/db.json'))

/** Where the data is, said without any secret in it. */
export const whereData = () =>
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
    ? `Redis key ${process.env.DATA_KEY || 'hpc-career:data'}`
    : process.env.DATA_FILE || '.data/db.json'
