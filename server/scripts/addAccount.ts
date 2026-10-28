/**
 * Add an account, or reset one.
 *
 *   npm run account:add -- student S001 "Asha Kumari" "Class 10 · A"
 *   npm run account:add -- teacher T001 "Meera Sharma"
 *
 * The password comes from ACCOUNT_PASSWORD if set, otherwise it is asked for.
 * Only its scrypt hash is stored (DATA_FILE, default .data/db.json).
 */

import { createInterface } from 'node:readline/promises'
import { existsSync } from 'node:fs'
import { Store } from '../lib/store.ts'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const [role, code, name, classLine] = process.argv.slice(2)
if ((role !== 'student' && role !== 'teacher') || !code || !name) {
  console.error('usage: npm run account:add -- <student|teacher> <code> "<name>" ["<class line>"]')
  process.exit(1)
}

let password = process.env.ACCOUNT_PASSWORD ?? ''
if (!password) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  password = await prompt.question('Password (8+ characters): ')
  prompt.close()
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.')
  process.exit(1)
}

const file = process.env.DATA_FILE || '.data/db.json'
new Store(file).upsert({ role, code, name, ...(classLine ? { classLine } : {}) }, password)
console.log(`Saved ${role} ${code.trim().toUpperCase()} (${name.trim()}) to ${file}`)
