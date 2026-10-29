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

const codes = await seedDemo(new Store(backendFromEnv(process.env.DATA_FILE || '.data/db.json')))

console.log(
  `Seeded teacher T001 and students ${codes.join(', ')} ` +
    `(${INTEREST_ITEMS.length} interest items; profiles open from the list, no password).`,
)
