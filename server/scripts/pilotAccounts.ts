/**
 * Make a pilot class's accounts, each with a random six-digit PIN, and print
 * slips to hand out.
 *
 *   ENV_FILE=.env.pilot.local npm run pilot:accounts -- class.csv \
 *     --url https://<pilot>.vercel.app --teacher "Meera Sharma"
 *
 * class.csv has a header row with a `name` column and, optionally, `class`
 * and `code` columns; one student per row. Codes are P01, P02, … unless the
 * file gives them. Only the PINs' scrypt hashes are stored; the PINs exist in
 * one place, the slips file (.data/pilot-slips.html, git-ignored) — print it,
 * then delete it. Running again refuses to touch existing accounts unless
 * --reset is given, which issues new PINs.
 */

import { randomInt } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { normaliseCode, type Profile } from '../lib/store.ts'
import { pilotStore, whereData } from './pilotEnv.ts'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1] : undefined
}
const csvFile = args.find((arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'))
const url = flag('--url')
const teacherName = flag('--teacher')
const reset = args.includes('--reset')

if (!csvFile || !url) {
  console.error('usage: npm run pilot:accounts -- <class.csv> --url https://<pilot app> [--teacher "Name"] [--reset]')
  process.exit(1)
}

/** Rows of a CSV file, quotes and all. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const endField = () => {
    row.push(field.trim())
    field = ''
  }
  const endRow = () => {
    endField()
    if (row.some(Boolean)) rows.push(row)
    row = []
  }
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') field += text[++index]
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') endField()
    else if (char === '\n') endRow()
    else if (char !== '\r') field += char
  }
  endRow()
  return rows
}

const [header, ...rows] = parseCsv(readFileSync(csvFile, 'utf8').replace(/^﻿/, ''))
const column = (name: string) => header.findIndex((cell) => cell.toLowerCase() === name)
const [nameAt, classAt, codeAt] = [column('name'), column('class'), column('code')]
if (nameAt < 0 || !rows.length) {
  console.error(`${csvFile}: needs a header row with a "name" column, and one student per row.`)
  process.exit(1)
}

const width = Math.max(2, String(rows.length).length)
const students: Profile[] = rows.map((cells, index) => ({
  role: 'student',
  code: normaliseCode(cells[codeAt] || `P${String(index + 1).padStart(width, '0')}`),
  name: cells[nameAt],
  ...(cells[classAt] ? { classLine: cells[classAt] } : {}),
}))
const accounts: Profile[] = [...students, ...(teacherName ? [{ role: 'teacher' as const, code: 'T01', name: teacherName }] : [])]

const missing = accounts.find((account) => !account.name)
if (missing) {
  console.error(`${missing.code} has no name.`)
  process.exit(1)
}
if (new Set(accounts.map((account) => `${account.role}:${account.code}`)).size !== accounts.length) {
  console.error('Two rows have the same code.')
  process.exit(1)
}

const store = pilotStore()
const existing = await store.profiles()
const clash = accounts.filter((account) => existing.some((other) => other.role === account.role && other.code === account.code))
if (clash.length && !reset) {
  console.error(`${clash.map((account) => account.code).join(', ')} already exist in ${whereData()}. Pass --reset to give them new PINs.`)
  process.exit(1)
}

const pin = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
const slips: { account: Profile; pin: string }[] = []
for (const account of accounts) {
  const issued = pin()
  await store.upsert(account, issued)
  slips.push({ account, pin: issued })
}

const escape = (text: string) => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
const slip = ({ account, pin }: { account: Profile; pin: string }) => `
  <section class="slip">
    <p class="app">HPC Career · ${account.role === 'teacher' ? 'teacher' : 'student'} sign-in</p>
    <p class="name">${escape(account.name)}</p>
    ${account.classLine ? `<p class="class">${escape(account.classLine)}</p>` : ''}
    <dl>
      <div><dt>Open</dt><dd class="url">${escape(url)}</dd></div>
      <div><dt>Choose</dt><dd>${account.role === 'teacher' ? 'Teacher' : 'Student'}</dd></div>
      <div><dt>Code</dt><dd class="big">${escape(account.code)}</dd></div>
      <div><dt>PIN</dt><dd class="big">${pin}</dd></div>
    </dl>
    <p class="note">Keep this slip. Don’t show your PIN to anyone. Lost it? Ask your teacher.</p>
  </section>`

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>HPC Career pilot — sign-in slips</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { margin: 0; font: 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; }
  .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .slip { break-inside: avoid; padding: 6mm; border: 1px dashed #888; min-height: 52mm; box-sizing: border-box; }
  .app { margin: 0; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: .04em; }
  .name { margin: 2mm 0 0; font-size: 17px; font-weight: 700; }
  .class { margin: 0; color: #444; }
  dl { margin: 3mm 0 0; }
  dl div { display: flex; gap: 3mm; }
  dt { width: 16mm; color: #555; }
  dd { margin: 0; font-weight: 600; }
  .big { font-size: 20px; letter-spacing: .08em; font-variant-numeric: tabular-nums; }
  .url { word-break: break-all; }
  .note { margin: 2mm 0 0; font-size: 11px; color: #555; }
</style></head>
<body><div class="sheet">${slips.map(slip).join('')}
</div></body></html>
`

mkdirSync('.data', { recursive: true })
writeFileSync('.data/pilot-slips.html', html, { mode: 0o600 })
console.log(`Made ${students.length} student account${students.length === 1 ? '' : 's'}${teacherName ? ' and 1 teacher account (T01)' : ''} in ${whereData()}.`)
console.log('Slips: .data/pilot-slips.html — print it, cut along the dashes, then delete the file: it is the only copy of the PINs.')
