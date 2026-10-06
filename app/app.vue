<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const blueShades = ['#38bdf8', '#60a5fa', '#22d3ee', '#93c5fd', '#818cf8', '#67e8f9', '#0ea5e9']
const blueWordListeners = new WeakMap<HTMLElement, (event: PointerEvent) => void>()

const vBlueWords = {
  mounted(element: HTMLElement) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement
        if (!node.textContent?.trim() || parent?.closest('[data-no-blue], .hover-word, script, style')) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    })

    const nodes: Text[] = []
    while (walker.nextNode()) nodes.push(walker.currentNode as Text)

    for (const node of nodes) {
      const fragment = document.createDocumentFragment()
      for (const token of (node.textContent || '').split(/(\s+)/)) {
        if (!token || /^\s+$/.test(token)) {
          fragment.append(token)
          continue
        }

        const word = document.createElement('span')
        word.className = 'hover-word'
        word.textContent = token
        fragment.append(word)
      }
      node.replaceWith(fragment)
    }

    const handleWordHover = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const word = target?.closest?.('.hover-word') as HTMLElement | null
      if (!word || !element.contains(word)) return
      word.style.setProperty('--word-blue', blueShades[Math.floor(Math.random() * blueShades.length)])
    }
    blueWordListeners.set(element, handleWordHover)
    element.addEventListener('pointerover', handleWordHover)
  },
  beforeUnmount(element: HTMLElement) {
    const listener = blueWordListeners.get(element)
    if (listener) element.removeEventListener('pointerover', listener)
    blueWordListeners.delete(element)
  }
}

type Project = {
  name: string
  extension?: string
  role: string
  description: string
  details: string[]
  tags: string[]
  category: 'engines' | 'languages' | 'platforms'
  url: string
  featured?: boolean
  visual: 'renderer' | 'schema' | 'language' | 'terrain' | 'interpreter' | 'jit' | 'chess' | 'race' | 'config' | 'ecosystem' | 'hive' | 'port'
}

const filters = ['all', 'engines', 'languages', 'platforms'] as const
type Filter = typeof filters[number]
const activeFilter = ref<Filter>('all')
const copied = ref(false)
const activePaletteIndex = ref(0)
const chaosMode = ref(true)
const activeIdea = ref(0)
const scrollMeter = ref<HTMLElement | null>(null)
const pointerGlow = ref<HTMLElement | null>(null)
const waveSvg = ref<SVGElement | null>(null)
const bursts = ref<Array<{ id: number; x: number; y: number; glyph: string; tx: number; ty: number }>>([])
type ColorSet = {
  ink: string
  panel: string
  card: string
  raised: string
  primary: string
  secondary: string
  soft: string
  grey: string
}
const colorSets: ColorSet[] = [
  { ink: '#031a12', panel: '#082b1d', card: '#0b3525', raised: '#114c35', primary: '#4ff0a0', secondary: '#22d3ee', soft: '#b5fbd4', grey: '#8fc8aa' },
  { ink: '#041826', panel: '#072d3c', card: '#09384b', raised: '#0d4d67', primary: '#22d3ee', secondary: '#3b82f6', soft: '#b7f4ff', grey: '#89bfcb' },
  { ink: '#150725', panel: '#29103c', card: '#35134b', raised: '#4d1b67', primary: '#a78bfa', secondary: '#f472b6', soft: '#e9ddff', grey: '#baa4ca' },
  { ink: '#290913', panel: '#431020', card: '#521328', raised: '#6c1a32', primary: '#fb7185', secondary: '#f59e0b', soft: '#ffe0e4', grey: '#d0a0aa' },
  { ink: '#06172b', panel: '#0a2b49', card: '#0b375d', raised: '#104d77', primary: '#38bdf8', secondary: '#67e8f9', soft: '#d7f3ff', grey: '#8ebdd1' }
]
const ideaLoop = [
  'What if a Hive agent learned the position instead of memorizing it?',
  'What if self-play produced evidence I could actually interrogate?',
  'What if a native port kept the original game data outside the repo?',
  'What if every failed training run stayed useful?'
]
let ideaTimer: ReturnType<typeof window.setInterval> | undefined
let scrollFrame: number | undefined
let pointerFrame: number | undefined
const latestPointer = { x: -400, y: -400 }
let burstId = 0

const projects: Project[] = [
  {
    name: 'Genseki',
    extension: '#1',
    role: 'The main quest',
    description: 'I saw a small bot ecosystem for a big-player-base board game and decided it was mine. Genseki is my C++26/Python Hive engine lab.',
    details: ['Alpha: native UHP engine + GUI built on attributed MIT foundations', 'Rho: separate policy/value research, self-play data, and training work', 'Current focus: strength, rules reliability, and a game people can actually use'],
    tags: ['C++26', 'Python', 'Policy + value', 'Hive / UHP'],
    category: 'engines',
    url: 'https://github.com/SahilKDas/Genseki',
    featured: true,
    visual: 'hive'
  },
  {
    name: '64DS-DX',
    extension: '#2',
    role: 'The native-port lane',
    description: 'My Super Mario 64 DS PC-port lane, kept in sync with the credited decompilation and co-op foundations it builds on.',
    details: ['Downstream of tangosdev/sm64ds-decomp and SCOPIC64/sm64ds-coop-port', 'ROMs and Nintendo assets stay outside the repository', 'Working toward a cleaner native port and integration path'],
    tags: ['C++', 'Decompilation', 'Native port', 'Upstream sync'],
    category: 'engines',
    url: 'https://github.com/SahilKDas/64DS-DX',
    featured: true,
    visual: 'port'
  },
  {
    name: 'MK7-Native',
    extension: '#3',
    role: 'The long-term port',
    description: 'I’m building an experimental C++26 route toward running Mario Kart 7 natively on PCs and laptops instead of hiding everything behind full-system emulation.',
    details: ['External-ROM workflow with user-supplied game data', 'SDL3/Vulkan host plus a growing 3DS runtime layer', 'Services, input, persistent saves, and graphics are coming online piece by piece'],
    tags: ['C++26', 'Vulkan', 'SDL3', 'Static recompilation'],
    category: 'engines',
    url: 'https://github.com/SahilKDas/MK7-Native',
    featured: true,
    visual: 'race'
  },
  {
    name: 'Eloi',
    extension: '#4 / paused',
    role: 'Waiting on Kaggle',
    description: 'My chess-engine rabbit hole has a Rust 2024 four-player branch, but I’m not actively working on it until somebody takes on the v4.0.0 Kaggle program for me.',
    details: ['14×14 four-player core with FFA and Teams state', 'Native GUI and three-thread baseline search', 'Kaggle-ready self-play and training scaffolding; currently paused'],
    tags: ['Rust 2024', 'Four-player chess', 'Self-play', 'Paused'],
    category: 'engines',
    url: 'https://github.com/SahilKDas/Eloi/tree/v4.0.0',
    visual: 'chess'
  },
  {
    name: 'LFE‑NNUE',
    extension: 'complete',
    role: 'The finished ecosystem',
    description: 'I turned Life Engine into a native evolutionary ecosystem where organisms inherit bodies, physiology, perception, and sparse neural behavior.',
    details: ['A major, attributed fork of MaxRobinsonTheGreat/LifeEngine', 'Inherited and mutating neural policies without scripted steering', 'Ecology, lineage, observability, and bounded long-run analytics'],
    tags: ['C++', 'TypeScript', 'NNUE', 'Evolution'],
    category: 'engines',
    url: 'https://github.com/SahilKDas/LFE-NNUE',
    visual: 'ecosystem'
  },
  {
    name: 'RoseWind',
    extension: '.rw',
    role: 'A language I designed',
    description: 'I made a text-based language for learning programming without hiding all the real structure.',
    details: ['Friendly syntax, fewer training wheels', 'Built in TypeScript'],
    tags: ['Language design', 'TypeScript', 'Education'],
    category: 'languages',
    url: 'https://github.com/SahilKDas/RoseWind',
    visual: 'language'
  },
  {
    name: 'ALK',
    role: 'My JIT experiment',
    description: 'I’m seeing what a dynamically typed, JIT-compiled language for the web can feel like.',
    details: ['Yes, I wrote a JIT', 'A lot of web-runtime poking'],
    tags: ['C++', 'JIT', 'Language runtime'],
    category: 'languages',
    url: 'https://github.com/SahilKDas/ALK',
    visual: 'jit'
  },
  {
    name: 'Colubrid',
    extension: '.py',
    role: 'Python, from scratch',
    description: 'I wrote a Python interpreter in C and C++ because apparently using Python normally was too easy.',
    details: ['Parser and interpreter guts', 'C / C++, no magic curtain'],
    tags: ['C++', 'Interpreters', 'Python'],
    category: 'languages',
    url: 'https://github.com/SahilKDas/Colubrid',
    visual: 'interpreter'
  }
]

const repositoryIndex = [
  { name: 'SM3DL-Recomp', type: 'Starts January 2027', language: 'C++', description: 'A blunt future goal: recompile Super Mario 3D Land for native hardware. The repository is a marker, not fake progress.', url: 'https://github.com/SahilKDas/SM3DL-Recomp' },
  { name: 'HexQuoridor-3P', type: 'Useful failure', language: 'Java', description: 'A recent experiment I keep around because “plan first” is still a technical result.', url: 'https://github.com/SahilKDas/HexQuoridor-3P' },
  { name: 'FIADA', type: 'Completed chapter', language: 'C++', description: 'A deterministic top-down racer with a recurrent neural driver. I learned from it; I am not pretending it is still active.', url: 'https://github.com/SahilKDas/FIADA' },
  { name: 'TcSON', type: 'Archived tooling', language: 'TypeScript', description: 'A configuration-language experiment that evaluated trusted source into deterministic JSON.', url: 'https://github.com/SahilKDas/tcson' },
  { name: 'Synthiscape', type: 'Procedural worlds', language: 'Python', description: 'A fast terrain generator with biomes, erosion, rivers, zoom, and pan in one Python file.', url: 'https://github.com/SahilKDas/Synthiscape' },
  { name: 'Short-Term Projects', type: 'Rapid experiments', language: 'Svelte', description: 'The deliberately small builds I use to keep trying ideas without pretending each one is a startup.', url: 'https://github.com/SahilKDas/_Short_Term_Projects' },
  { name: 'T_Caret', type: 'Archived renderer', language: 'C++', description: 'My earlier C++23 and Vulkan web-layout renderer experiment. Finished as a chapter, kept as evidence.', url: 'https://github.com/SahilKDas/T_Caret' },
  { name: 'Juliana', type: 'Archived language', language: 'Rust', description: 'My archived attempt to rethink a few parts of Julia.', url: 'https://github.com/SahilKDas/Juliana' },
  { name: '8j8k', type: 'Multiplayer', language: 'TypeScript', description: 'I built an open-source multiplayer Svelte game around collaboration.', url: 'https://github.com/SahilKDas/8j8k' },
  { name: 'MSLASH', type: 'Interpreter', language: 'Python', description: 'A tiny interpreter for a language I made up.', url: 'https://github.com/SahilKDas/MSLASH' },
  { name: 'Flaky', type: 'Build week', language: 'TypeScript', description: 'What I built during OpenAI Build Week 2026.', url: 'https://github.com/SahilKDas/Flaky' },
  { name: 'Unspool', type: 'Civic tech', language: 'CSS', description: 'My Hack for Humanity 2026 project about mental wellbeing.', url: 'https://github.com/SahilKDas/HfH26Submission' },
  { name: 'NORA', type: 'Hackathon', language: 'JavaScript', description: 'What I shipped for United Hacks V7.', url: 'https://github.com/SahilKDas/NORA' },
  { name: 'Swordbattle Tweaks', type: 'Game mods', language: 'TypeScript', description: 'My open collection of custom swordbattle.io mods.', url: 'https://github.com/SahilKDas/swordbattle-tweaks' },
  { name: 'Lordhank2', type: 'Game systems', language: 'JavaScript', description: 'My multiplayer sword-fighting playground for quick experiments.', url: 'https://github.com/SahilKDas/lordhank2-testing' }
]
const visibleProjects = computed(() => activeFilter.value === 'all'
  ? projects
  : projects.filter(project => project.category === activeFilter.value)
)

const withAlpha = (hex: string, alpha: number) => {
  const channels = [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16))
  return `rgba(${channels.join(', ')}, ${alpha})`
}

const activeColors = computed<ColorSet>(() => colorSets[activePaletteIndex.value])

const handleScroll = () => {
  if (scrollFrame !== undefined) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined
    const total = document.documentElement.scrollHeight - window.innerHeight
    const progress = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0
    if (scrollMeter.value) scrollMeter.value.style.transform = `scaleX(${progress})`
    if (waveSvg.value) {
      const waveX = progress * -140
      const waveY = Math.sin(progress * Math.PI * 6) * 12
      waveSvg.value.style.transform = `translate3d(${waveX}px, ${waveY}px, 0)`
    }
    const nextPalette = Math.min(colorSets.length - 1, Math.floor(progress * colorSets.length))
    if (nextPalette !== activePaletteIndex.value) activePaletteIndex.value = nextPalette
  })
}

const shellStyle = computed(() => {
  const colors = activeColors.value
  return {
    '--ink': colors.ink,
    '--panel': colors.panel,
    '--surface-card': colors.card,
    '--surface-raised': colors.raised,
    '--cyan': colors.primary,
    '--theme-secondary': colors.secondary,
    '--cyan-soft': colors.soft,
    '--grey': colors.grey,
    '--line': withAlpha(colors.soft, .17),
    '--theme-glow': withAlpha(colors.primary, .28)
  }
})

const handlePointerMove = (event: PointerEvent) => {
  if (!chaosMode.value) return
  latestPointer.x = event.clientX
  latestPointer.y = event.clientY
  if (pointerFrame !== undefined) return
  pointerFrame = window.requestAnimationFrame(() => {
    pointerFrame = undefined
    if (pointerGlow.value) {
      pointerGlow.value.style.transform = `translate3d(${latestPointer.x}px, ${latestPointer.y}px, 0) translate(-50%, -50%)`
    }
  })
}

const popBurst = (event: PointerEvent) => {
  if (!chaosMode.value || event.button !== 0) return
  const glyphs = ['✦', '◇', '01', '?!', '⌁', '♡']
  const created = Array.from({ length: 5 }, (_, index) => ({
    id: burstId++,
    x: event.clientX,
    y: event.clientY,
    glyph: glyphs[(burstId + index) % glyphs.length],
    tx: Math.round((Math.random() - .5) * 130),
    ty: Math.round(-35 - Math.random() * 85)
  }))
  bursts.value.push(...created)
  window.setTimeout(() => {
    const ids = new Set(created.map(item => item.id))
    bursts.value = bursts.value.filter(item => !ids.has(item.id))
  }, 850)
}

const tiltCard = (event: PointerEvent) => {
  if (!chaosMode.value || event.pointerType === 'touch') return
  const card = event.currentTarget as HTMLElement
  const bounds = card.getBoundingClientRect()
  const rotateY = ((event.clientX - bounds.left) / bounds.width - .5) * 7
  const rotateX = ((event.clientY - bounds.top) / bounds.height - .5) * -7
  card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`)
  card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`)
}

const resetCard = (event: PointerEvent) => {
  const card = event.currentTarget as HTMLElement
  card.style.setProperty('--tilt-x', '0deg')
  card.style.setProperty('--tilt-y', '0deg')
}

const copyHandle = async () => {
  await navigator.clipboard.writeText('@SahilKDas')
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  ideaTimer = window.setInterval(() => {
    if (chaosMode.value) activeIdea.value = (activeIdea.value + 1) % ideaLoop.length
  }, 2300)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
  if (pointerFrame !== undefined) window.cancelAnimationFrame(pointerFrame)
  if (ideaTimer) window.clearInterval(ideaTimer)
})
</script>

<template>
  <div
    class="site-root"
    :class="{ 'chaos-on': chaosMode }"
    :style="shellStyle"
    @pointermove="handlePointerMove"
    @pointerdown="popBurst"
  >
    <div ref="scrollMeter" class="scroll-meter" />
    <div ref="pointerGlow" class="pointer-glow" aria-hidden="true" />
    <div class="wave-field" aria-hidden="true">
      <svg ref="waveSvg" viewBox="0 0 1600 900" preserveAspectRatio="none">
        <path class="wave-line wave-line-a" d="M-260 156 C 20 20, 230 302, 510 156 S 1000 22, 1280 156 S 1760 290, 1940 120" />
        <path class="wave-line wave-line-b" d="M-220 390 C 90 215, 300 565, 610 390 S 1120 215, 1430 390 S 1790 540, 1960 350" />
        <path class="wave-line wave-line-c" d="M-300 665 C 15 480, 315 845, 630 665 S 1130 480, 1445 665 S 1810 830, 1980 625" />
        <path class="wave-line wave-line-d" d="M-180 790 C 150 665, 400 905, 730 790 S 1240 665, 1570 790 S 1850 900, 2010 755" />
      </svg>
    </div>
    <div class="bloom-field" aria-hidden="true">
      <i
        v-for="petal in 10"
        :key="petal"
        :style="{
          '--petal-left': `${(petal * 37) % 100}%`,
          '--petal-delay': `${(petal % 9) * -1.3}s`,
          '--petal-duration': `${7 + (petal % 6)}s`
        }"
      />
    </div>
    <span
      v-for="burst in bursts"
      :key="burst.id"
      class="click-burst"
      :style="{ left: `${burst.x}px`, top: `${burst.y}px`, '--burst-x': `${burst.tx}px`, '--burst-y': `${burst.ty}px` }"
      aria-hidden="true"
    >{{ burst.glyph }}</span>

    <section id="launch" class="launch-hero">
      <div class="launch-grid" aria-hidden="true" />
      <div class="launch-orb launch-orb-one" aria-hidden="true" />
      <div class="launch-orb launch-orb-two" aria-hidden="true" />

      <header class="launch-bar">
        <a href="#launch" class="launch-brand" aria-label="Sahil K. Das home">
          <strong>SKD</strong><span>My little systems lab / 2026</span>
        </a>
        <Badge variant="outline" class="launch-status">
          <i /> Open to work · probably building something
        </Badge>
      </header>

      <div v-blue-words class="launch-copy">
        <Badge variant="secondary" class="launch-eyebrow">Game-playing agents · policy/value learning · native systems</Badge>
        <h1>I build agents that<br><em>learn, compete &amp; ship.</em></h1>
        <p>Genseki is the main quest: a Hive engine lab where neural research has to survive real rules, real opponents, and evidence I can reproduce.</p>
        <div class="launch-actions" data-no-blue>
          <Button as="a" href="#portfolio" size="lg" class="launch-primary">
            See what I’m building
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14m0 0 6-6m-6 6-6-6" /></svg>
          </Button>
          <Button as="a" href="https://github.com/SahilKDas" target="_blank" rel="noopener" variant="outline" size="lg" class="launch-secondary">
            Open my GitHub <span>↗</span>
          </Button>
        </div>
      </div>

      <Card class="hero-console">
        <CardHeader class="console-chrome">
          <div class="console-dots"><i/><i/><i/></div>
          <span>skd://research/system-map</span>
          <Badge variant="outline">LIVE</Badge>
        </CardHeader>
        <CardContent class="console-content">
          <div class="console-rail">
            <span class="active">01 / GENSEKI</span>
            <span>02 / SELF-PLAY</span>
            <span>03 / NATIVE PORTS</span>
            <span>04 / EVIDENCE</span>
          </div>
          <div class="console-stage">
            <div class="stage-grid" />
            <div class="system-node node-core"><b>GENSEKI</b><small>HIVE + POLICY/VALUE</small></div>
            <div class="system-node node-data"><b>64DS-DX</b><small>NATIVE PORT / #2</small></div>
            <div class="system-node node-lang"><b>MK7 / ELOI</b><small>#3 / #4 PAUSED</small></div>
            <div class="system-path path-one"/><div class="system-path path-two"/>
            <div class="stage-readout"><span>LAB / VERY ACTIVE</span><span>43 PUBLIC REPOS</span><span>4-ITEM QUEUE</span></div>
          </div>
        </CardContent>
      </Card>

      <a href="#portfolio" class="launch-scroll"><span>Scroll for the rabbit holes</span><i /></a>
      <div class="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0 65 C180 10 310 115 500 58 C690 0 820 110 1010 52 C1190 -2 1320 84 1440 38 L1440 120 L0 120 Z" />
        </svg>
      </div>
    </section>

    <div id="portfolio" class="portfolio-shell">

    <aside class="profile-pane">
      <div class="grid-noise" aria-hidden="true" />
      <div v-blue-words class="profile-content">
        <header class="site-id">
          <a href="#launch" class="monogram" aria-label="Back to launch hero">SKD<span>/01</span></a>
          <span class="availability"><i /> Open to work. Busy building anyway.</span>
        </header>

        <div class="identity" id="profile">
          <p class="eyebrow"><span>Restlessly curious.</span><b>×</b><span>Constantly building.</span></p>
          <h1>Sahil K.<br><em>Das.</em></h1>
          <p class="role">Software engineer &amp;<br>professional rabbit-hole finder</p>
          <p class="intro">I build whatever I want—but right now I’m zooming in on policy/value learning, NNUEs, self-play, training pipelines, and agents that have to make decisions inside real game systems.</p>

          <div class="profile-actions">
            <a class="primary-action" href="https://github.com/SahilKDas" target="_blank" rel="noopener">
              Explore GitHub
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M7 5h8v8" /></svg>
            </a>
            <button class="handle-button" data-no-blue type="button" @click="copyHandle">
              <span>{{ copied ? 'Copied' : '@SahilKDas' }}</span>
              <svg v-if="!copied" viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="7" width="8" height="8" rx="1"/><path d="M5 12H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"/></svg>
              <svg v-else viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9"/></svg>
            </button>
          </div>

          <p class="build-cadence">“Sometimes I deliver in a day; sometimes I disappear into a weeks-long project.”</p>
        </div>

        <div class="stack-block">
          <div class="stack-label"><span>Current toolbox</span><span>08 usual suspects</span></div>
          <div class="stack-pills">
            <span>C++26</span><span>Rust</span><span>Python</span><span>TypeScript</span><span>Vulkan</span><span>CMake</span><span>Cargo</span><span>Bun</span>
          </div>
        </div>

        <footer class="profile-footer">
          <span>The proof is on GitHub</span>
          <span class="coordinates">37° N / 122° W</span>
        </footer>
      </div>
    </aside>

    <main class="work-pane">
      <nav v-blue-words class="main-nav" aria-label="Page sections">
        <a href="#work">Priority queue</a>
        <a href="#research">Neural work</a>
        <a href="#about">Me</a>
        <button class="chaos-toggle" data-no-blue type="button" :aria-pressed="chaosMode" @click.stop="chaosMode = !chaosMode">
          <i /> {{ chaosMode ? 'Low power' : 'Full signal' }}
        </button>
        <a class="github-nav" href="https://github.com/SahilKDas" target="_blank" rel="noopener">GH ↗</a>
      </nav>

      <div class="signal-tape" data-no-blue aria-live="polite">
        <div>
          <span>ACTIVE THOUGHT_{{ String(activeIdea + 1).padStart(2, '0') }} — {{ ideaLoop[activeIdea] }}</span>
          <span aria-hidden="true">ACTIVE THOUGHT_{{ String(activeIdea + 1).padStart(2, '0') }} — {{ ideaLoop[activeIdea] }}</span>
        </div>
      </div>

      <section v-blue-words class="main-intro" id="work">
        <p class="section-kicker"><span>01</span> Current priority queue</p>
        <div class="headline-row">
          <h2>Neural systems<br>with something to prove.</h2>
          <p>Four projects, in order. Genseki comes first; Eloi stays paused until its Kaggle program has an owner.</p>
        </div>

        <div class="filter-row" aria-label="Filter projects">
          <button
            v-for="filter in filters"
            :key="filter"
            type="button"
            :class="{ active: activeFilter === filter }"
            @click="activeFilter = filter"
          >
            {{ filter }}<sup>{{ filter === 'all' ? projects.length : projects.filter(p => p.category === filter).length }}</sup>
          </button>
        </div>
      </section>

      <TransitionGroup name="project-list" tag="div" class="projects-grid">
        <article
          v-for="(project, index) in visibleProjects"
          :key="project.name"
          class="project-card"
          :class="{ featured: project.featured }"
          v-blue-words
          @pointermove="tiltCard"
          @pointerleave="resetCard"
        >
          <a class="card-link" :href="project.url" target="_blank" rel="noopener" :aria-label="`View ${project.name} on GitHub`">
            <div class="card-topline">
              <span class="project-index">PRJ—{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="project-role">{{ project.role }}</span>
              <span class="arrow">↗</span>
            </div>

            <div class="project-visual" :class="`visual-${project.visual}`" aria-hidden="true">
              <template v-if="project.visual === 'renderer'">
                <div class="render-toolbar"><i/><i/><i/><span>tc://render.pipeline</span></div>
                <div class="render-space">
                  <div class="render-tree"><span>ROOT</span><span>└ GRID</span><span>&nbsp;&nbsp;├ BOX</span><span>&nbsp;&nbsp;└ TEXT</span></div>
                  <div class="render-frame"><i/><b/><span>60.0 FPS</span></div>
                </div>
              </template>
              <template v-else-if="project.visual === 'schema'">
                <div class="code-lines"><span><b>schema</b> Profile &#123;</span><span>&nbsp;&nbsp;name: <i>string</i></span><span>&nbsp;&nbsp;role: <i>allowonly</i> [</span><span>&nbsp;&nbsp;&nbsp;&nbsp;"builder", "architect"</span><span>&nbsp;&nbsp;]</span><span>&#125;</span></div>
                <div class="validation-ok">✓ schema valid</div>
              </template>
              <template v-else-if="project.visual === 'terrain'">
                <div class="topography topo-one"/><div class="topography topo-two"/><div class="topography topo-three"/>
                <div class="terrain-readout"><span>SEED 0826</span><span>H 847M</span></div>
              </template>
              <template v-else-if="project.visual === 'hive'">
                <div class="hive-board">
                  <i v-for="cell in 19" :key="cell" :class="[`hive-cell-${cell}`, { active: [3, 6, 8, 10, 12, 15, 17].includes(cell) }]" />
                  <b class="hive-piece hive-queen">Q</b><b class="hive-piece hive-ant">A</b><b class="hive-piece hive-beetle">B</b>
                </div>
                <div class="hive-hud"><span>ALPHA <b>UHP</b></span><span>RHO <b>POLICY/VALUE</b></span><span>PRIORITY <b>#1</b></span></div>
              </template>
              <template v-else-if="project.visual === 'port'">
                <div class="ds-shell"><div class="ds-screen top"><i/><b>64</b><span>DS</span></div><div class="ds-hinge"/><div class="ds-screen bottom"><i/><i/><i/><i/></div></div>
                <div class="port-hud"><span>DECOMP <b>UPSTREAM</b></span><span>PORT <b>NATIVE</b></span><span>DATA <b>EXTERNAL</b></span></div>
              </template>
              <template v-else-if="project.visual === 'chess'">
                <div class="chess-board">
                  <i v-for="square in 64" :key="square" :class="{ dark: (Math.floor((square - 1) / 8) + ((square - 1) % 8)) % 2 }" />
                  <b class="chess-piece piece-black-king">♚</b>
                  <b class="chess-piece piece-black-knight">♞</b>
                  <b class="chess-piece piece-white-queen">♕</b>
                  <b class="chess-piece piece-white-king">♔</b>
                  <b class="chess-piece piece-white-knight">♘</b>
                </div>
                <div class="chess-hud"><span>BRANCH <b>V4.0.0</b></span><span>BOARD <b>14×14</b></span><span>STATUS <b>PAUSED</b></span></div>
              </template>
              <template v-else-if="project.visual === 'race'">
                <div class="race-track"><i class="track-inner"/><b class="race-car car-one"/><b class="race-car car-two"/><b class="race-car car-three"/></div>
                <div class="race-hud"><span>POLICY <b>1,011,461</b></span><span>PHYSICS <b>120 HZ</b></span><span>EVAL <b>31 / 33</b></span></div>
              </template>
              <template v-else-if="project.visual === 'config'">
                <div class="config-editor"><span><b>import</b> db <b>from</b> <i>"./db.tcson"</i>;</span><span><b>export default</b> &#123;</span><span>&nbsp;&nbsp;...db,</span><span>&nbsp;&nbsp;runtime: <i>"bun"</i>,</span><span>&nbsp;&nbsp;deterministic: <em>true</em></span><span>&#125;;</span></div>
                <div class="config-output"><span>JSON</span><b>CANONICAL</b><i>✓</i></div>
              </template>
              <template v-else-if="project.visual === 'ecosystem'">
                <div class="life-grid"><i v-for="cell in 96" :key="cell" :class="`cell-${cell % 9}`" /></div>
                <div class="brain-readout"><span>POPULATION</span><b>10,000</b><small>NNUE / EVOLVING</small></div>
              </template>
              <template v-else>
                <div class="terminal-lines">
                  <span><i>$</i> {{ project.visual === 'jit' ? 'alk run main.alk --jit' : project.visual === 'interpreter' ? 'colubrid ./main.py' : 'rosewind learn.rw' }}</span>
                  <span class="muted">loading {{ project.name.toLowerCase() }} runtime...</span>
                  <span><b>›</b> ready in {{ project.visual === 'jit' ? '14' : '08' }}ms</span>
                </div>
                <div class="pulse-orbit"><i/><i/><i/></div>
              </template>
            </div>

            <div class="card-copy">
              <h3>{{ project.name }}<code v-if="project.extension">{{ project.extension }}</code></h3>
              <p>{{ project.description }}</p>
              <ul>
                <li v-for="detail in project.details" :key="detail">{{ detail }}</li>
              </ul>
            </div>

            <div class="tags">
              <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
            </div>
          </a>
        </article>
      </TransitionGroup>

      <section v-blue-words class="repo-index" aria-labelledby="repo-index-title">
        <div class="repo-index-head">
          <div>
            <p class="section-kicker"><span>01B</span> GitHub detour</p>
            <h2 id="repo-index-title">More rabbit holes.</h2>
          </div>
          <a href="https://github.com/SahilKDas?tab=repositories" target="_blank" rel="noopener">
            <strong>43</strong><span>public repos and counting</span><i>See the lab ↗</i>
          </a>
        </div>

        <div class="repo-table">
          <a
            v-for="(repo, index) in repositoryIndex"
            :key="repo.name"
            :href="repo.url"
            target="_blank"
            rel="noopener"
          >
            <span class="repo-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <div><h3>{{ repo.name }}</h3><p>{{ repo.description }}</p></div>
            <span class="repo-type">{{ repo.type }}</span>
            <span class="repo-language"><i />{{ repo.language }}</span>
            <b>↗</b>
          </a>
        </div>
      </section>
      <section v-blue-words class="research-section" id="research">
        <p class="section-kicker"><span>02</span> Neural work, zoomed in</p>
        <div class="research-heading">
          <h2>Questions I keep<br>losing sleep over.</h2>
          <div class="signal"><i/><span>3 rabbit holes open</span></div>
        </div>

        <div class="research-list">
          <article>
            <span class="research-number">R/01</span>
            <div><h3>Can an agent learn Hive instead of faking it?</h3><p>Rho is my policy/value track: rules-grounded state, self-play evidence, training data, and experiments that stay separate from the Alpha engine.</p></div>
            <span class="research-tag">Policy / value / self-play</span>
          </article>
          <article>
            <span class="research-number">R/02</span>
            <div><h3>A score is not an explanation.</h3><p>I care about controlled opponents, frozen inputs, reproducible runs, honest failures, and knowing exactly why a model was promoted.</p></div>
            <span class="research-tag">Evaluation / evidence</span>
          </article>
          <article>
            <span class="research-number">R/03</span>
            <div><h3>Can research survive contact with the whole system?</h3><p>The model still has to meet a rules engine, search, a GUI, performance limits, packaging, and users. I like owning that entire path.</p></div>
            <span class="research-tag">Research engineering</span>
          </article>
        </div>
      </section>

      <section v-blue-words class="about-section" id="about">
        <p class="section-kicker"><span>03</span> A little about me</p>
        <div class="about-grid">
          <h2>Curious by default.<br><em>Way too into the details.</em></h2>
          <div class="about-copy">
            <p>I started with Python, got curious about what was underneath it, and ended up in C++ and Rust building game engines, neural agents, native ports, and the infrastructure around them.</p>
            <p>I will apply to <strong>Google DeepMind</strong>. Until then, I’m turning the gap between curiosity and research engineering into public, reproducible work.</p>
          </div>
        </div>
        <div class="capabilities">
          <div><span>01</span><p>Neural<br>agents</p></div>
          <div><span>02</span><p>Engine<br>systems</p></div>
          <div><span>03</span><p>Native<br>ports</p></div>
          <div><span>04</span><p>Evidence &amp;<br>reproducibility</p></div>
        </div>
      </section>

      <footer v-blue-words class="main-footer">
        <div><span>Got a hard problem?</span><h2>Let’s make it measurable.</h2></div>
        <a href="https://github.com/SahilKDas" target="_blank" rel="noopener">Find me on GitHub <span>↗</span></a>
        <p>© {{ new Date().getFullYear() }} Sahil K. Das <span>Built with Nuxt 4</span></p>
      </footer>
    </main>
    </div>
  </div>
</template>
