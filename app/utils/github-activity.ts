export type ActivityKind = 'push' | 'release' | 'create' | 'pull-request'
export type ActivitySource = 'live' | 'cached' | 'snapshot'

export type ActivityItem = {
  id: string
  repo: string
  kind: ActivityKind
  title: string
  detail: string
  timestamp: string
  href: string
  isOpenShobu: boolean
}

export type ActivityCache = {
  version: 1
  fetchedAt: string
  items: ActivityItem[]
  publicRepoCount: number
}

export type ParsedActivityCache = {
  value: ActivityCache
  fresh: boolean
}

export const ACTIVITY_CACHE_TTL_MS = 15 * 60 * 1000
export const ACTIVITY_CACHE_KEY = 'skd-github-activity-v1'

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const asRecord = (value: unknown): Record<string, unknown> => isRecord(value) ? value : {}
const asString = (value: unknown): string => typeof value === 'string' ? value : ''
const asNumber = (value: unknown): number | undefined => (
  typeof value === 'number' && Number.isFinite(value) ? value : undefined
)

const isRepositoryName = (value: string) => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)
const isIsoDate = (value: string) => Boolean(value) && Number.isFinite(Date.parse(value))

const cleanRef = (value: string) => value
  .replace(/^refs\/heads\//, '')
  .replace(/^refs\/tags\//, '')

const repoUrl = (repo: string) => `https://github.com/${repo}`

const isSafeGitHubHref = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'github.com'
  } catch {
    return false
  }
}

const encodeGitRef = (value: string) => value.split('/').map(encodeURIComponent).join('/')

export const safeGitHubUrl = (value: unknown, fallback: string): string => {
  const candidate = asString(value)
  if (!candidate) return fallback
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' && url.hostname === 'github.com' ? url.toString() : fallback
  } catch {
    return fallback
  }
}

const normalizeEvent = (value: unknown): ActivityItem | null => {
  if (!isRecord(value)) return null
  const id = asString(value.id)
  const type = asString(value.type)
  const timestamp = asString(value.created_at)
  const repo = asString(asRecord(value.repo).name)
  const payload = asRecord(value.payload)

  if (!id || !isRepositoryName(repo) || !isIsoDate(timestamp)) return null

  const baseHref = repoUrl(repo)
  const isOpenShobu = repo.startsWith('OpenShobu/')

  if (type === 'PushEvent') {
    const ref = cleanRef(asString(payload.ref)) || 'default branch'
    const head = asString(payload.head)
    const href = /^[a-f0-9]{40}$/i.test(head)
      ? `${baseHref}/commit/${head}`
      : baseHref
    return { id, repo, kind: 'push', title: 'Pushed code', detail: ref, timestamp, href, isOpenShobu }
  }

  if (type === 'ReleaseEvent') {
    const release = asRecord(payload.release)
    const tag = asString(release.tag_name) || 'a new release'
    const name = asString(release.name)
    return {
      id,
      repo,
      kind: 'release',
      title: `Published ${tag}`,
      detail: name && name !== tag ? name : 'Release available on GitHub',
      timestamp,
      href: safeGitHubUrl(release.html_url, `${baseHref}/releases`),
      isOpenShobu
    }
  }

  if (type === 'CreateEvent') {
    const refType = asString(payload.ref_type) || 'repository'
    const ref = cleanRef(asString(payload.ref))
    const href = ref && refType === 'branch'
      ? `${baseHref}/tree/${encodeGitRef(ref)}`
      : ref && refType === 'tag'
        ? `${baseHref}/releases/tag/${encodeGitRef(ref)}`
        : baseHref
    return {
      id,
      repo,
      kind: 'create',
      title: `Created ${refType}`,
      detail: ref || repo.split('/')[1] || repo,
      timestamp,
      href,
      isOpenShobu
    }
  }

  if (type === 'PullRequestEvent') {
    const pullRequest = asRecord(payload.pull_request)
    const number = asNumber(pullRequest.number)
    const action = asString(payload.action) || 'updated'
    const title = asString(pullRequest.title)
    return {
      id,
      repo,
      kind: 'pull-request',
      title: `${action.charAt(0).toUpperCase()}${action.slice(1)} pull request${number ? ` #${number}` : ''}`,
      detail: title || 'Pull request activity',
      timestamp,
      href: safeGitHubUrl(pullRequest.html_url, `${baseHref}/pulls`),
      isOpenShobu
    }
  }

  return null
}

export const normalizeGitHubEvents = (value: unknown): ActivityItem[] => {
  if (!Array.isArray(value)) return []
  return value.map(normalizeEvent).filter((item): item is ActivityItem => item !== null)
}

export const mergeActivityItems = (...groups: ActivityItem[][]): ActivityItem[] => {
  const unique = new Map<string, ActivityItem>()
  for (const item of groups.flat()) {
    if (!unique.has(item.id)) unique.set(item.id, item)
  }
  return [...unique.values()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}

export const splitVisibleActivity = (items: ActivityItem[], limit: number) => {
  const openShobu = items.filter(item => item.isOpenShobu)
  const other = items.filter(item => !item.isOpenShobu)
  const preferredOpenCount = Math.ceil(limit / 2)
  let openCount = Math.min(preferredOpenCount, openShobu.length)
  const otherCount = Math.min(limit - openCount, other.length)
  openCount = Math.min(openShobu.length, limit - otherCount)
  return {
    openShobu: openShobu.slice(0, openCount),
    other: other.slice(0, limit - openCount)
  }
}

const isActivityItem = (value: unknown): value is ActivityItem => {
  if (!isRecord(value)) return false
  const kind = asString(value.kind)
  const href = asString(value.href)
  return (
    Boolean(asString(value.id)) &&
    isRepositoryName(asString(value.repo)) &&
    ['push', 'release', 'create', 'pull-request'].includes(kind) &&
    Boolean(asString(value.title)) &&
    isIsoDate(asString(value.timestamp)) &&
    isSafeGitHubHref(href) &&
    typeof value.isOpenShobu === 'boolean'
  )
}

export const parseActivityCache = (
  raw: string | null,
  now = Date.now(),
  ttl = ACTIVITY_CACHE_TTL_MS
): ParsedActivityCache | null => {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) return null
    const fetchedAt = asString(parsed.fetchedAt)
    const publicRepoCount = asNumber(parsed.publicRepoCount)
    if (!isIsoDate(fetchedAt) || publicRepoCount === undefined || publicRepoCount < 0) return null
    if (!parsed.items.every(isActivityItem)) return null
    const value: ActivityCache = {
      version: 1,
      fetchedAt,
      items: mergeActivityItems(parsed.items),
      publicRepoCount
    }
    const age = Math.max(0, now - Date.parse(fetchedAt))
    return { value, fresh: age <= ttl }
  } catch {
    return null
  }
}

export const selectActivityState = (
  liveItems: ActivityItem[] | null,
  cache: ParsedActivityCache | null,
  fallbackItems: ActivityItem[]
): { source: ActivitySource, items: ActivityItem[] } => {
  if (liveItems?.length) return { source: 'live', items: mergeActivityItems(liveItems) }
  if (cache?.value.items.length) return { source: 'cached', items: cache.value.items }
  return { source: 'snapshot', items: mergeActivityItems(fallbackItems) }
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Los_Angeles',
  timeZoneName: 'short'
})

export const formatActivityDate = (value: string) => (
  isIsoDate(value) ? dateTimeFormatter.format(new Date(value)) : 'Unknown date'
)
