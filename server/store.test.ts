/**
 * The Redis backend against a stand-in for Upstash's REST API, and the queue
 * that keeps changes in one process from overwriting each other.
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

/** Enough of Upstash's REST API for the store: POST ["GET", key] / ["SET", key, value]. */
async function fakeUpstash(token: string) {
  const values = new Map<string, string>()
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      if (req.headers.authorization !== `Bearer ${token}`) {
        res.statusCode = 401
        return res.end(JSON.stringify({ error: 'Unauthorized' }))
      }
      const [command, key, value] = JSON.parse(body) as string[]
      if (command === 'GET') return res.end(JSON.stringify({ result: values.get(key) ?? null }))
      if (command === 'SET') {
        values.set(key, value)
        return res.end(JSON.stringify({ result: 'OK' }))
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
  assert.equal((await store.reflections('S002')).length, 2)
  assert.ok(values.has('hpc-career:data'))

  // A fresh store on the same database sees the same school.
  assert.equal((await new Store(new RedisBackend(url, 'secret')).students()).length, 5)
})

test('a wrong Redis token fails loudly instead of looking empty', async (t) => {
  const { server, url } = await fakeUpstash('secret')
  t.after(() => server.close())
  await assert.rejects(new Store(new RedisBackend(url, 'wrong')).profiles(), /Redis GET failed/)
})

test('changes made at the same time are all kept', async () => {
  const store = new Store(join(mkdtempSync(join(tmpdir(), 'hpc-store-')), 'db.json'))
  await Promise.all(Array.from({ length: 10 }, (_, index) => store.addReflection('S001', `note ${index}`)))
  assert.equal((await store.reflections('S001')).length, 10)
})
