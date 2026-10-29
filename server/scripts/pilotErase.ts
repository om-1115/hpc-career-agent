/**
 * Delete everything the pilot stored: accounts, results, answers, reflections.
 * Run it by the date the consent note promises (docs/pilot/consent-note.md).
 *
 *   ENV_FILE=.env.pilot.local npm run pilot:erase -- --yes
 */

import { pilotStore, whereData } from './pilotEnv.ts'

if (!process.argv.includes('--yes')) {
  console.error(`This deletes every account and answer in ${whereData()}. Run it again with --yes to go ahead.`)
  process.exit(1)
}

const store = pilotStore()
const before = (await store.profiles()).length
await store.eraseAll()
console.log(`Erased ${whereData()}: ${before} account${before === 1 ? '' : 's'} and everything they saved.`)
