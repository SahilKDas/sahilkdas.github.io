import {
  fallbackActivityItems,
  FALLBACK_ACTIVITY_AUDITED_AT,
  FALLBACK_PUBLIC_REPO_COUNT
} from '../data/github-activity-fallback'
import {
  ACTIVITY_CACHE_KEY,
  formatActivityDate,
  mergeActivityItems,
  normalizeGitHubEvents,
  parseActivityCache,
  selectActivityState,
  splitVisibleActivity,
  type ActivityCache,
  type ActivityItem,
  type ParsedActivityCache,
  type ActivitySource
} from '../utils/github-activity'

const USER_EVENTS_URL = 'https://api.github.com/users/SahilKDas/events/public?per_page=30'
const OPENSHOBU_EVENTS_URL = 'https://api.github.com/orgs/OpenShobu/events?per_page=30'
const PROFILE_URL = 'https://api.github.com/users/SahilKDas'

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const fetchJson = async (url: string, signal: AbortSignal): Promise<unknown> => {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
  return response.json()
}

export const useGitHubActivity = () => {
  const items = useState<ActivityItem[]>('github-activity-items', () => [...fallbackActivityItems])
  const source = useState<ActivitySource>('github-activity-source', () => 'snapshot')
  const lastUpdated = useState<string>('github-activity-updated', () => FALLBACK_ACTIVITY_AUDITED_AT)
  const publicRepoCount = useState<number>('github-public-repo-count', () => FALLBACK_PUBLIC_REPO_COUNT)
  const loading = useState<boolean>('github-activity-loading', () => false)
  const started = useState<boolean>('github-activity-started', () => false)
  const expanded = ref(false)

  const visibleLimit = computed(() => expanded.value ? 16 : 8)
  const visibleActivity = computed(() => splitVisibleActivity(items.value, visibleLimit.value))
  const canExpand = computed(() => items.value.length > 8)
  const sourceLabel = computed(() => ({
    live: 'Live GitHub',
    cached: 'Cached',
    snapshot: 'Audited snapshot'
  })[source.value])

  const applyCache = (cache: ActivityCache) => {
    items.value = cache.items
    publicRepoCount.value = cache.publicRepoCount
    lastUpdated.value = cache.fetchedAt
    source.value = 'cached'
  }

  const refresh = async () => {
    if (!import.meta.client || loading.value) return

    let cached: ParsedActivityCache | null = null
    try {
      cached = parseActivityCache(window.localStorage.getItem(ACTIVITY_CACHE_KEY))
    } catch {
      // Reading storage can fail in privacy modes; the audited snapshot remains available.
    }
    if (cached) {
      applyCache(cached.value)
      if (cached.fresh) return
    }

    loading.value = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)

    try {
      const [userResult, openShobuResult, profileResult] = await Promise.allSettled([
        fetchJson(USER_EVENTS_URL, controller.signal),
        fetchJson(OPENSHOBU_EVENTS_URL, controller.signal),
        fetchJson(PROFILE_URL, controller.signal)
      ])

      const userItems = userResult.status === 'fulfilled'
        ? normalizeGitHubEvents(userResult.value)
        : []
      const openShobuItems = openShobuResult.status === 'fulfilled'
        ? normalizeGitHubEvents(openShobuResult.value)
        : []
      const bothFeedsSucceeded = userResult.status === 'fulfilled' && openShobuResult.status === 'fulfilled'
      const liveItems = bothFeedsSucceeded ? mergeActivityItems(userItems, openShobuItems) : []

      if (profileResult.status === 'fulfilled' && isRecord(profileResult.value)) {
        const count = profileResult.value.public_repos
        if (typeof count === 'number' && Number.isInteger(count) && count >= 0) {
          publicRepoCount.value = count
        }
      }

      const next = selectActivityState(liveItems.length ? liveItems : null, cached, fallbackActivityItems)
      items.value = next.items
      source.value = next.source

      if (next.source === 'live') {
        const fetchedAt = new Date().toISOString()
        lastUpdated.value = fetchedAt
        const value: ActivityCache = {
          version: 1,
          fetchedAt,
          items: next.items,
          publicRepoCount: publicRepoCount.value
        }
        try {
          window.localStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(value))
        } catch {
          // Storage may be unavailable in private browsing; live data still renders.
        }
      }
    } catch {
      const next = selectActivityState(null, cached, fallbackActivityItems)
      items.value = next.items
      source.value = next.source
      if (!cached) {
        publicRepoCount.value = FALLBACK_PUBLIC_REPO_COUNT
        lastUpdated.value = FALLBACK_ACTIVITY_AUDITED_AT
      }
    } finally {
      window.clearTimeout(timeout)
      loading.value = false
    }
  }

  onMounted(() => {
    if (started.value) return
    started.value = true
    void refresh()
  })

  return {
    items,
    visibleActivity,
    expanded,
    canExpand,
    loading,
    source,
    sourceLabel,
    lastUpdated,
    publicRepoCount,
    formatActivityDate,
    toggleExpanded: () => { expanded.value = !expanded.value }
  }
}
