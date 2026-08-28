<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const blueShades = ['#38bdf8', '#60a5fa', '#22d3ee', '#93c5fd', '#818cf8', '#67e8f9', '#0ea5e9']

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
        word.addEventListener('pointerenter', () => {
          const shade = blueShades[Math.floor(Math.random() * blueShades.length)]
          word.style.setProperty('--word-blue', shade)
        })
        fragment.append(word)
      }
      node.replaceWith(fragment)
    }
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
  visual: 'renderer' | 'schema' | 'language' | 'terrain' | 'interpreter' | 'jit'
}

const filters = ['all', 'engines', 'languages', 'platforms'] as const
type Filter = typeof filters[number]
const activeFilter = ref<Filter>('all')
const copied = ref(false)
const scrollProgress = ref(0)
const chaosMode = ref(true)
const activeIdea = ref(0)
const pointer = reactive({ x: -400, y: -400 })
const bursts = ref<Array<{ id: number; x: number; y: number; glyph: string; tx: number; ty: number }>>([])
const ideaLoop = [
  'What if browsers rendered differently?',
  'What if the language taught the machine?',
  'What if one file generated a world?',
  'What if the weird prototype actually worked?'
]
let ideaTimer: ReturnType<typeof window.setInterval> | undefined
let burstId = 0

const projects: Project[] = [
  {
    name: 'T_Caret',
    extension: '.tc',
    role: 'My renderer rabbit hole',
    description: 'I’m building a C++23 + Vulkan renderer to see how fast web-style layouts can get.',
    details: ['I push the pixels through the GPU', 'I own the layout logic too'],
    tags: ['C++23', 'Vulkan', 'Rendering engine'],
    category: 'engines',
    url: 'https://github.com/SahilKDas/T_Caret',
    featured: true,
    visual: 'renderer'
  },
  {
    name: 'RoseCondor',
    extension: '.rcdb',
    role: 'I made the whole thing',
    description: 'I made a type-safe serialization format and tiny database engine for TypeScript and Node.js.',
    details: ['Schemas that read like normal code', 'Very picky allowonly / disallow / block rules'],
    tags: ['TypeScript', 'Node.js', 'Serialization'],
    category: 'engines',
    url: 'https://github.com/SahilKDas',
    featured: true,
    visual: 'schema'
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
    name: 'Synthiscape',
    extension: '.py',
    role: 'I grow fake worlds',
    description: 'I generate huge explorable worlds with biomes, erosion, rivers, and navigation that stays snappy.',
    details: ['Procedural world simulation', 'Only rendering what you can actually see'],
    tags: ['Python', 'Pygame', 'Procedural graphics'],
    category: 'engines',
    url: 'https://github.com/SahilKDas/Synthiscape',
    visual: 'terrain'
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
  { name: 'Juliana', type: 'Language', language: 'Rust', description: 'I’m testing what a language can learn from Julia—and what I’d change.', url: 'https://github.com/SahilKDas/Juliana' },
  { name: '8j8k', type: 'Multiplayer', language: 'TypeScript', description: 'I built an open-source multiplayer Svelte game around collaboration.', url: 'https://github.com/SahilKDas/8j8k' },
  { name: 'Morlock', type: 'Chess engine', language: 'Go', description: 'My Go fork for poking around inside a chess engine.', url: 'https://github.com/SahilKDas/morlock' },
  { name: 'MSLASH', type: 'Interpreter', language: 'Python', description: 'A tiny interpreter for a language I made up.', url: 'https://github.com/SahilKDas/MSLASH' },
  { name: 'Flaky', type: 'Build week', language: 'TypeScript', description: 'What I built during OpenAI Build Week 2026.', url: 'https://github.com/SahilKDas/Flaky' },
  { name: 'Unspool', type: 'Civic tech', language: 'CSS', description: 'My Hack for Humanity 2026 project about mental wellbeing.', url: 'https://github.com/SahilKDas/HfH26Submission' },
  { name: 'NORA', type: 'Hackathon', language: 'JavaScript', description: 'What I shipped for United Hacks V7.', url: 'https://github.com/SahilKDas/NORA' },
  { name: 'Swordbattle Tweaks', type: 'Game mods', language: 'TypeScript', description: 'My open collection of custom swordbattle.io mods.', url: 'https://github.com/SahilKDas/swordbattle-tweaks' },
  { name: 'Lordhank2', type: 'Game systems', language: 'JavaScript', description: 'My multiplayer sword-fighting playground for quick experiments.', url: 'https://github.com/SahilKDas/lordhank2-testing' },
  { name: 'EagerGen3d', type: 'Procedural 3D', language: 'Research', description: 'Me asking how far procedural 3D can go.', url: 'https://github.com/SahilKDas/EagerGen3d' }
]
const visibleProjects = computed(() => activeFilter.value === 'all'
  ? projects
  : projects.filter(project => project.category === activeFilter.value)
)

const handleScroll = () => {
  const total = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = total > 0 ? window.scrollY / total : 0
}

const shellStyle = computed(() => ({
  '--pointer-x': `${pointer.x}px`,
  '--pointer-y': `${pointer.y}px`
}))

const handlePointerMove = (event: PointerEvent) => {
  if (!chaosMode.value) return
  pointer.x = event.clientX
  pointer.y = event.clientY
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
    <div class="scroll-meter" :style="{ transform: `scaleX(${scrollProgress})` }" />
    <div class="pointer-glow" aria-hidden="true" />
    <div class="bloom-field" aria-hidden="true">
      <i
        v-for="petal in 18"
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
        <Badge variant="secondary" class="launch-eyebrow">Languages · engines · graphics · weird ideas</Badge>
        <h1>I build the systems<br><em>behind the impossible.</em></h1>
        <p>I make runtimes, renderers, and whatever strange experiment starts with one useful question: <strong>what if?</strong></p>
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
            <span class="active">01 / ENGINE</span>
            <span>02 / RUNTIME</span>
            <span>03 / LANGUAGE</span>
            <span>04 / WORLD</span>
          </div>
          <div class="console-stage">
            <div class="stage-grid" />
            <div class="system-node node-core"><b>T_CARET</b><small>RENDER CORE</small></div>
            <div class="system-node node-data"><b>ROSECONDOR</b><small>TYPE-SAFE DATA</small></div>
            <div class="system-node node-lang"><b>ALK</b><small>JIT RUNTIME</small></div>
            <div class="system-path path-one"/><div class="system-path path-two"/>
            <div class="stage-readout"><span>PIPELINE / HEALTHY</span><span>60.0 FPS</span><span>MEM 18.4 MB</span></div>
          </div>
        </CardContent>
      </Card>

      <a href="#portfolio" class="launch-scroll"><span>Scroll for the rabbit holes</span><i /></a>
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
          <p class="role">Software engineer &amp;<br>systems tinkerer</p>
          <p class="intro">I don’t stick to one lane. My GitHub is basically a garage full of languages, engines, games, web stuff, and experiments that started with “what if?”</p>

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

          <p class="build-cadence">“Sometimes I ship in a day; sometimes I disappear into a month-long build. Every repository is a laboratory.”</p>
        </div>

        <div class="stack-block">
          <div class="stack-label"><span>Core stack</span><span>06 modules</span></div>
          <div class="stack-pills">
            <span>Python</span><span>C++23</span><span>TypeScript</span><span>Go</span><span>Bun</span><span>Vulkan</span>
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
        <a href="#work">Things I built</a>
        <a href="#research">Rabbit holes</a>
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
        <p class="section-kicker"><span>01</span> Stuff I’ve built</p>
        <div class="headline-row">
          <h2>I build below<br>the abstraction.</h2>
          <p>Engines, languages, and other things I probably could’ve made the easy way.</p>
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
            <strong>29</strong><span>public repos and counting</span><i>See the mess ↗</i>
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
        <p class="section-kicker"><span>02</span> Things I can’t leave alone</p>
        <div class="research-heading">
          <h2>Questions I keep<br>losing sleep over.</h2>
          <div class="signal"><i/><span>3 rabbit holes open</span></div>
        </div>

        <div class="research-list">
          <article>
            <span class="research-number">R/01</span>
            <div><h3>What if browsers rendered differently?</h3><p>I’m seeing how much browser-style layout and painting I can shove straight onto a modern GPU.</p></div>
            <span class="research-tag">GPU / browser guts</span>
          </article>
          <article>
            <span class="research-number">R/02</span>
            <div><h3>Languages that don’t hide the good parts</h3><p>I want beginner-friendly tools that still show you what the computer is actually doing.</p></div>
            <span class="research-tag">Making languages</span>
          </article>
          <article>
            <span class="research-number">R/03</span>
            <div><h3>Young builders doing real research</h3><p>I’m trying to make spaces where students can stop just consuming tech and start publishing their own work.</p></div>
            <span class="research-tag">Builder communities</span>
          </article>
        </div>
      </section>

      <section v-blue-words class="about-section" id="about">
        <p class="section-kicker"><span>03</span> A little about me</p>
        <div class="about-grid">
          <h2>Curious by default.<br><em>Way too into the details.</em></h2>
          <div class="about-copy">
            <p>I started with Python, got curious about what was underneath it, and somehow ended up building runtimes, web plumbing, language tools, and graphics engines.</p>
            <p>I’m currently open to work. Until the right thing shows up, I’ll be on GitHub turning “what if?” into another repository.</p>
          </div>
        </div>
        <div class="capabilities">
          <div><span>01</span><p>Systems<br>stuff</p></div>
          <div><span>02</span><p>Language<br>tools</p></div>
          <div><span>03</span><p>Graphics<br>pipelines</p></div>
          <div><span>04</span><p>Open-source<br>chaos</p></div>
        </div>
      </section>

      <footer v-blue-words class="main-footer">
        <div><span>Got a weird problem?</span><h2>Let’s make it real.</h2></div>
        <a href="https://github.com/SahilKDas" target="_blank" rel="noopener">Find me on GitHub <span>↗</span></a>
        <p>© {{ new Date().getFullYear() }} Sahil K. Das <span>Built with Nuxt 4</span></p>
      </footer>
    </main>
    </div>
  </div>
</template>
