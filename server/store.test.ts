/**
 * The Redis backend against a stand-in for Upstash's REST API, the queue that
 * keeps changes in one process from overwriting each other, and the lock that
 * does the same across server instances.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { seedDemo } from './lib/demo.ts'
import { RedisBackend, Store } from './lib/store.ts'

/**
 * Enough of Upstash's REST API for the store: GET, SET (with NX for the lock)
 * and the lock's compare-and-delete EVAL. Each reply waits a few random
 * milliseconds, so concurrent changes really do interleave.
 */
async function fakeUpstash(token: string) {
  const values = new Map<string, string>()
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', async () => {
      res.setHeader('content-type', 'application/json')
      if (req.headers.authorization !== `Bearer ${token}`) {
        res.statusCode = 401
        return res.end(JSON.stringify({ error: 'Unauthorized' }))
      }
      const [command, ...args] = JSON.parse(body) as string[]
      const reply = (result: unknown) => setTimeout(() => res.end(JSON.stringify({ result })), Math.random() * 4)
      if (command === 'GET') return reply(values.get(args[0]) ?? null)
      if (command === 'SET') {
        const [key, value, ...options] = args
        if (options.includes('NX') && values.has(key)) return reply(null)
        values.set(key, value)
        return reply('OK')
      }
      if (command === 'EVAL') {
        const [, , key, expected] = args
        const owned = values.get(key) === expected
        if (owned) values.delete(key)
        return reply(owned ? 1 : 0)
      }
      res.statusCode = 400
      res.end(JSON.stringify({ error: `unknown command ${command}` }))
    })
  })
  server.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  return { server, values, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` }
}

test('the store works the same on Redis: seed the demo school, read it back', async (t) => {
  const { server, values, url } = await fakeUpstash('secret')
  t.after(() => server.close())
  const store = new Store(new RedisBackend(url, 'secret'))

  assert.deepEqual(await store.profiles(), [])
  await seedDemo(store)
  assert.deepEqual((await store.profiles()).map((profile) => profile.code), ['S001', 'S002', 'S003', 'S004', 'S005', 'T001'])
  assert.equal((await store.resultHistory('S002')).length, 2)
  assert.equal((await store.reflections('S002')).length, 3)
  assert.deepEqual(Object.keys(await store.surveyResponses('S002')), ['goal-academic'])
  assert.ok(values.has('hpc-career:data'))

  // A fresh store on the same database sees the same school.
  assert.equal((await new Store(new RedisBackend(url, 'secret')).students()).length, 5)
})

test('a wrong Redis token fails loudly instead of looking empty', async (t) => {
  const { server, url } = await fakeUpstash('secret')
  t.after(() => server.close())
  await assert.rejects(new Store(new RedisBackend(url, 'wrong')).profiles(), /Redis GET failed/)
})

test('two server instances writing to one Redis at once keep every change', async (t) => {
  const { server, values, url } = await fakeUpstash('secret')
  t.after(() => server.close())
  const first = new Store(new RedisBackend(url, 'secret', 'pilot'))
  const second = new Store(new RedisBackend(url, 'secret', 'pilot'))

  await Promise.all(Array.from({ length: 8 }, (_, index) => [first.addReflection('P01', `a ${index}`), second.addReflection('P02', `b ${index}`)]).flat())
  assert.equal((await first.reflections('P01')).length, 8)
  assert.equal((await first.reflections('P02')).length, 8)
  assert.deepEqual([...values.keys()], ['pilot'], 'the lock is gone once the changes are done')
})

test('changes made at the same time are all kept', async () => {
  const store = new Store(join(mkdtempSync(join(tmpdir(), 'hpc-store-')), 'db.json'))
  await Promise.all(Array.from({ length: 10 }, (_, index) => store.addReflection('S001', `note ${index}`)))
  assert.equal((await store.reflections('S001')).length, 10)
})
