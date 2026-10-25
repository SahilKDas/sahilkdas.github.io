import type { ActivityItem } from '../utils/github-activity'

export const FALLBACK_ACTIVITY_AUDITED_AT = '2026-10-25T00:00:00-07:00'
export const FALLBACK_PUBLIC_REPO_COUNT = 50

export const fallbackActivityItems: ActivityItem[] = [
  {
    id: '18124171040',
    repo: 'OpenShobu/Sekigahara',
    kind: 'release',
    title: 'Published v0.4',
    detail: 'v0.4 - Next Incumbent',
    timestamp: '2026-10-24T20:59:23Z',
    href: 'https://github.com/OpenShobu/Sekigahara/releases/tag/v0.4',
    isOpenShobu: true
  },
  {
    id: '25061337178',
    repo: 'OpenShobu/Sekigahara',
    kind: 'push',
    title: 'Pushed code',
    detail: 'main',
    timestamp: '2026-10-24T20:58:55Z',
    href: 'https://github.com/OpenShobu/Sekigahara/commit/74b3a4e0db0d67b9e80cdf64b7ad5020b6ea2dc7',
    isOpenShobu: true
  },
  {
    id: '17882568120',
    repo: 'OpenShobu/cani',
    kind: 'release',
    title: 'Published v0.2.0',
    detail: 'cani v0.2.0',
    timestamp: '2026-10-22T04:31:24Z',
    href: 'https://github.com/OpenShobu/cani/releases/tag/v0.2.0',
    isOpenShobu: true
  },
  {
    id: '23762241015',
    repo: 'OpenShobu/Universal-Shobu-Protocol-Specifications',
    kind: 'push',
    title: 'Pushed code',
    detail: 'main',
    timestamp: '2026-10-11T22:30:54Z',
    href: 'https://github.com/OpenShobu/Universal-Shobu-Protocol-Specifications/commit/4178b90af66d3834b465b6e9491f1f6c261c87ab',
    isOpenShobu: true
  },
  {
    id: '25083793691',
    repo: 'SahilKDas/sahilkdas.github.io',
    kind: 'push',
    title: 'Pushed code',
    detail: 'main',
    timestamp: '2026-10-24T22:40:27Z',
    href: 'https://github.com/SahilKDas/sahilkdas.github.io/commit/5e35b189f2e9edfaf652f1148c243a32ee44bf5a',
    isOpenShobu: false
  },
  {
    id: '25166756031',
    repo: 'SahilKDas/ferromine-emu',
    kind: 'create',
    title: 'Created branch',
    detail: 'main',
    timestamp: '2026-10-24T21:48:51Z',
    href: 'https://github.com/SahilKDas/ferromine-emu/tree/main',
    isOpenShobu: false
  },
  {
    id: '25020319545',
    repo: 'SahilKDas/Skallagrim',
    kind: 'push',
    title: 'Pushed code',
    detail: 'main',
    timestamp: '2026-10-24T04:04:36Z',
    href: 'https://github.com/SahilKDas/Skallagrim/commit/ab42a1c6e4efa2a968a121113343bb85f11182fd',
    isOpenShobu: false
  },
  {
    id: '24815471937',
    repo: 'SahilKDas-Alternate/sm64ds-steve',
    kind: 'push',
    title: 'Pushed code',
    detail: 'codex/steve-port',
    timestamp: '2026-10-22T05:29:09Z',
    href: 'https://github.com/SahilKDas-Alternate/sm64ds-steve/commit/2dbb81d51ec1ae05e8f5f30397b02a4e0747cb9b',
    isOpenShobu: false
  },
  {
    id: 'tangos-native-ccd692f',
    repo: 'SahilKDas/tangOS-Native',
    kind: 'push',
    title: 'Pushed code',
    detail: 'main',
    timestamp: '2026-10-22T04:48:08Z',
    href: 'https://github.com/SahilKDas/tangOS-Native/commit/ccd692f',
    isOpenShobu: false
  },
  {
    id: 'eloi-v4-release',
    repo: 'SahilKDas/Eloi',
    kind: 'release',
    title: 'Published v4.0.0',
    detail: 'Handcrafted four-player Teams',
    timestamp: '2026-10-18T22:32:21Z',
    href: 'https://github.com/SahilKDas/Eloi/releases/tag/v4.0.0',
    isOpenShobu: false
  }
]
