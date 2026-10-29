/**
 * Demo accounts, so anyone can try the app straight away.
 *
 *   npm run seed:demo
 *
 * Seeds the JSON file (DATA_FILE, default .data/db.json), or Redis when the
 * Upstash variables are set. Never seed a deployment that holds real students'
 * data.
 */

import { existsSync } from 'node:fs'
import { INTEREST_ITEMS } from '../../shared/test.ts'
import { seedDemo } from '../lib/demo.ts'
import { backendFromEnv, Store } from '../lib/store.ts'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (process.env.PILOT_MODE === '1') {
  console.error('PILOT_MODE=1: this is a pilot database, and the demo school never goes into real students’ data.')
  process.exit(1)
}

const codes = await seedDemo(new Store(backendFromEnv(process.env.DATA_FILE || '.data/db.json')))

console.log(
  `Seeded teacher T001 and students ${codes.join(', ')} ` +
    `(${INTEREST_ITEMS.length} interest items; profiles open from the list, no password).`,
)
