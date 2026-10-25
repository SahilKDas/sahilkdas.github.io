import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ACTIVITY_CACHE_TTL_MS,
  mergeActivityItems,
  normalizeGitHubEvents,
  parseActivityCache,
  selectActivityState,
  splitVisibleActivity,
  type ActivityCache,
  type ActivityItem
} from '../app/utils/github-activity.ts'

const pushEvent = (overrides: Record<string, unknown> = {}) => ({
  id: 'push-1',
  type: 'PushEvent',
  created_at: '2026-10-25T04:00:00Z',
  repo: { name: 'SahilKDas/Skallagrim' },
  payload: {
    ref: 'refs/heads/codex/neural-eval',
    head: 'a'.repeat(40)
  },
  ...overrides
})

const item = (id: string, timestamp: string, isOpenShobu = false): ActivityItem => ({
  id,
  repo: isOpenShobu ? 'OpenShobu/Sekigahara' : `SahilKDas/repo-${id}`,
  kind: 'push',
  title: 'Pushed code',
  detail: 'main',
  timestamp,
  href: isOpenShobu
    ? 'https://github.com/OpenShobu/Sekigahara'
    : `https://github.com/SahilKDas/repo-${id}`,
  isOpenShobu
})

test('normalizes supported GitHub events and keeps safe branch/tag details', () => {
  const events = [
    pushEvent(),
    {
      id: 'release-1', type: 'ReleaseEvent', created_at: '2026-10-25T03:00:00Z',
      repo: { name: 'OpenShobu/cani' },
      payload: { release: { tag_name: 'v0.2.0', name: 'cani v0.2.0', html_url: 'https://github.com/OpenShobu/cani/releases/tag/v0.2.0' } }
    },
    {
      id: 'create-1', type: 'CreateEvent', created_at: '2026-10-25T02:00:00Z',
      repo: { name: 'SahilKDas/new-lab' }, payload: { ref_type: 'branch', ref: 'feature/a b' }
    },
    {
      id: 'pr-1', type: 'PullRequestEvent', created_at: '2026-10-25T01:00:00Z',
      repo: { name: 'OpenShobu/Sekigahara' },
      payload: { action: 'opened', pull_request: { number: 42, title: 'Tune the evaluator', html_url: 'https://github.com/OpenShobu/Sekigahara/pull/42' } }
    }
  ]

  const result = normalizeGitHubEvents(events)
  assert.deepEqual(result.map(entry => entry.kind), ['push', 'release', 'create', 'pull-request'])
  assert.equal(result[0]?.detail, 'codex/neural-eval')
  assert.equal(result[0]?.href, `https://github.com/SahilKDas/Skallagrim/commit/${'a'.repeat(40)}`)
  assert.equal(result[1]?.isOpenShobu, true)
  assert.equal(result[2]?.href, 'https://github.com/SahilKDas/new-lab/tree/feature/a%20b')
  assert.equal(result[3]?.title, 'Opened pull request #42')
})

test('filters unsupported event types and malformed response shapes', () => {
  const unsupported = [
    pushEvent({ id: 'watch', type: 'WatchEvent' }),
    pushEvent({ id: 'delete', type: 'DeleteEvent' }),
    pushEvent({ id: '', repo: { name: '../bad' } }),
    null
  ]
  assert.deepEqual(normalizeGitHubEvents(unsupported), [])
  assert.deepEqual(normalizeGitHubEvents({ message: 'rate limited' }), [])
  assert.deepEqual(normalizeGitHubEvents(null), [])
})

test('rejects non-GitHub event links and falls back to a safe repository page', () => {
  const [release] = normalizeGitHubEvents([{
    id: 'hostile-release', type: 'ReleaseEvent', created_at: '2026-10-25T03:00:00Z',
    repo: { name: 'SahilKDas/Eloi' },
    payload: { release: { tag_name: 'v4.0.0', html_url: 'https://example.com/phish' } }
  }])
  assert.equal(release?.href, 'https://github.com/SahilKDas/Eloi/releases')
})

test('deduplicates overlapping feeds and sorts newest first', () => {
  const older = item('same', '2026-10-24T00:00:00Z', true)
  const newer = item('newer', '2026-10-25T00:00:00Z')
  const merged = mergeActivityItems([older, newer], [older])
  assert.deepEqual(merged.map(entry => entry.id), ['newer', 'same'])
})

test('keeps OpenShobu in the first lane while honoring 8 and 16 entry limits', () => {
  const open = Array.from({ length: 7 }, (_, index) => item(`open-${index}`, `2026-10-${String(20 - index).padStart(2, '0')}T00:00:00Z`, true))
  const other = Array.from({ length: 12 }, (_, index) => item(`other-${index}`, `2026-09-${String(20 - index).padStart(2, '0')}T00:00:00Z`))

  const compact = splitVisibleActivity(mergeActivityItems(open, other), 8)
  assert.equal(compact.openShobu.length, 4)
  assert.equal(compact.other.length, 4)
  assert.ok(compact.openShobu.every(entry => entry.isOpenShobu))

  const expanded = splitVisibleActivity(mergeActivityItems(open, other), 16)
  assert.equal(expanded.openShobu.length + expanded.other.length, 16)
  assert.equal(expanded.openShobu.length, 7)
})

test('parses fresh and stale cache entries and rejects malformed cache', () => {
  const now = Date.parse('2026-10-25T05:00:00Z')
  const cache: ActivityCache = {
    version: 1,
    fetchedAt: new Date(now - 1_000).toISOString(),
    items: [item('cached', '2026-10-25T04:00:00Z')],
    publicRepoCount: 50
  }
  assert.equal(parseActivityCache(JSON.stringify(cache), now)?.fresh, true)

  cache.fetchedAt = new Date(now - ACTIVITY_CACHE_TTL_MS - 1).toISOString()
  assert.equal(parseActivityCache(JSON.stringify(cache), now)?.fresh, false)
  assert.equal(parseActivityCache('{broken', now), null)
  assert.equal(parseActivityCache(JSON.stringify({ ...cache, items: [{ href: 'javascript:alert(1)' }] }), now), null)
  assert.equal(parseActivityCache(JSON.stringify({ ...cache, publicRepoCount: -1 }), now), null)
})

test('selects live, then stale cache, then audited snapshot for failures and empty feeds', () => {
  const live = item('live', '2026-10-25T05:00:00Z')
  const cached = item('cached', '2026-10-25T04:00:00Z')
  const fallback = item('fallback', '2026-10-25T03:00:00Z')
  const parsed = parseActivityCache(JSON.stringify({
    version: 1,
    fetchedAt: '2026-10-20T00:00:00Z',
    items: [cached],
    publicRepoCount: 50
  }), Date.parse('2026-10-25T05:00:00Z'))

  assert.equal(selectActivityState([live], parsed, [fallback]).source, 'live')
  assert.equal(selectActivityState([], parsed, [fallback]).source, 'cached')
  assert.equal(selectActivityState(null, null, [fallback]).source, 'snapshot')
})
