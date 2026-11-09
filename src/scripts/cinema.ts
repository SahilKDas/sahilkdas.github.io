import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { createHyperspace } from './hyperspace'

gsap.registerPlugin(ScrollTrigger)

const root = document.documentElement
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
const cinema = !reducedMotion && innerWidth > 820 && (memory === undefined || memory >= 4)
const slate = document.querySelector<HTMLElement>('[data-scene-slate]')

if (cinema) root.dataset.cinema = 'on'

let lenis: Lenis | undefined
if (!reducedMotion && innerWidth > 820) {
  lenis = new Lenis({ smoothWheel: true, lerp: 0.085, wheelMultiplier: .84, touchMultiplier: 1 })
  lenis.on('scroll', () => ScrollTrigger.update())
  gsap.ticker.add(time => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

const progress = document.querySelector<HTMLElement>('[data-progress]')
if (progress) {
  gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: .2 } })
}

const setScene = (value?: string, active = true) => {
  if (!cinema) return
  root.dataset.letterbox = active ? 'on' : 'off'
  if (slate) slate.textContent = active && value ? value.replace('|', ' — ') : ''
}

document.querySelectorAll<HTMLElement>('[data-scene]').forEach(section => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 45%',
    end: 'bottom 45%',
    onEnter: () => setScene(section.dataset.scene),
    onEnterBack: () => setScene(section.dataset.scene),
    onLeave: () => setScene(undefined, false),
    onLeaveBack: () => setScene(undefined, false),
  })
})

const topbar = document.querySelector<HTMLElement>('[data-topbar]')
const paper = document.querySelector<HTMLElement>('[data-paper]')
if (paper && topbar) {
  ScrollTrigger.create({ trigger: paper, start: 'top 64px', end: 'bottom 64px', toggleClass: { targets: topbar, className: 'topbar-paper' } })
}

const approach = document.querySelector<HTMLElement>('[data-approach]')
if (approach && cinema) {
  gsap.set('.portal-sky,.world-effects', { scale: 1, yPercent: 0 })
  gsap.set('.portal-landscape', { scale: 1, yPercent: 0 })
  gsap.set('.portal-ocean', { scale: 1, yPercent: 0 })
  gsap.set('.portal-architecture', { scale: 1, yPercent: 0 })
  gsap.set('.portal-foreground', { scale: 1, yPercent: 0 })
  const hero = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: approach, start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true } })
  hero
    .to('.portal-sky,.world-effects', { scale: 1.08, yPercent: -1, duration: .34 }, .08)
    .to('.portal-landscape', { scale: 1.5, yPercent: 2, duration: .34 }, .08)
    .to('.portal-ocean', { scale: 1.38, yPercent: 1, duration: .34 }, .08)
    .to('.portal-architecture', { scale: 1.58, yPercent: 1, duration: .34 }, .08)
    .to('.portal-foreground', { scale: 1.82, yPercent: 2, duration: .34 }, .08)
    .fromTo('.hero-copy .mask-word', { yPercent: 125 }, { yPercent: 0, duration: .12, stagger: .035 }, .12)
    .fromTo('.hero-kicker,.hero-intro', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .1, stagger: .035 }, .18)
    .to('.hero-copy', { opacity: 0, y: -28, duration: .1 }, .5)
    .to('.scroll-cue', { opacity: 0, duration: .06 }, .08)
    .to('.portal-radiance', { scale: 3.2, opacity: 1, duration: .38 }, .58)
    .to('.scene-veil', { opacity: 0, duration: .38 }, .58)
}

const crossing = document.querySelector<HTMLElement>('[data-crossing]')
const hyperCanvas = document.querySelector<HTMLCanvasElement>('[data-hyperspace]')
if (crossing && hyperCanvas && cinema) {
  const hyper = createHyperspace(hyperCanvas)
  const state = { p: 0 }
  const draw = () => hyper?.draw(state.p)
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: crossing, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true } })
    .to(state, { p: 1, duration: 1, onUpdate: draw }, 0)
    .fromTo('.crossing-label', { opacity: 0, letterSpacing: '.7em' }, { opacity: 1, letterSpacing: '.28em', duration: .08 }, .67)
    .to('.crossing-label', { opacity: 0, duration: .06 }, .83)
    .to('.crossing-white', { opacity: 1, duration: .08 }, .92)
  addEventListener('resize', draw, { passive: true })
}

const spores = document.querySelector<HTMLCanvasElement>('[data-spores]')
const field = document.querySelector<HTMLElement>('[data-field]')
const sporeState = { p: 0 }
const hash = (i: number) => { const value = Math.sin(i * 78.233 + 12.9898) * 43758.5453; return value - Math.floor(value) }
const drawSpores = () => {
  if (!spores) return
  const context = spores.getContext('2d')
  if (!context) return
  const width = spores.clientWidth, height = spores.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2)
  if (spores.width !== Math.round(width * dpr) || spores.height !== Math.round(height * dpr)) { spores.width = Math.round(width * dpr); spores.height = Math.round(height * dpr); context.setTransform(dpr, 0, 0, dpr, 0, 0) }
  context.clearRect(0, 0, width, height)
  context.globalCompositeOperation = 'lighter'
  for (let index = 0; index < 150; index++) {
    const grade = hash(index + 61), speed = .3 + hash(index + 97) * .7
    const y = ((hash(index + 31) - sporeState.p * speed * .55) % 1 + 1) % 1
    const x = (hash(index) + Math.sin(y * 6.2 + hash(index) * 11) * .014 + 1) % 1
    const alpha = (.08 + grade * .38) * Math.sin(y * Math.PI)
    context.fillStyle = `rgba(214,232,255,${alpha})`
    context.beginPath(); context.arc(x * width, y * height, .5 + grade * 1.6, 0, Math.PI * 2); context.fill()
  }
  context.globalCompositeOperation = 'source-over'
}

if (field && cinema) {
  const fieldTimeline = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: field, start: 'top top', end: 'bottom bottom', scrub: .75, invalidateOnRefresh: true } })
  fieldTimeline
    .fromTo('.field-sky', { scale: 1.2, yPercent: -2 }, { scale: 1.04, yPercent: -.6, duration: 1 }, 0)
    .fromTo('.field-mist', { scale: 1.3, yPercent: -2 }, { scale: 1.12, yPercent: -1.2, duration: 1 }, 0)
    .fromTo('.field-flora', { scale: 1.46, yPercent: -3 }, { scale: 1.2, yPercent: -1.8, duration: 1 }, 0)
    .fromTo('.field-grass', { scale: 1.8, yPercent: -5 }, { scale: 1.36, yPercent: -3, duration: 1 }, 0)
    .fromTo('.field-veil', { opacity: 1 }, { opacity: 0, duration: .1 }, 0)
    .fromTo('.field-content', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .1 }, .12)
    .fromTo('.atlas-index a', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .06, stagger: .045 }, .25)
    .to(sporeState, { p: 1, duration: 1, onUpdate: drawSpores }, 0)
  addEventListener('resize', drawSpores, { passive: true })
}

const projectFilm = document.querySelector<HTMLElement>('[data-project-film]')
const frames = gsap.utils.toArray<HTMLElement>('[data-project-frame]')
if (projectFilm && frames.length && cinema) {
  gsap.set(frames, { autoAlpha: 0 })
  gsap.set(frames[0], { autoAlpha: 1 })
  const film = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: projectFilm, start: 'top top', end: 'bottom bottom', scrub: .75, onUpdate: self => { const current = Math.min(frames.length - 1, Math.floor(self.progress * frames.length)); const counter = document.querySelector('[data-project-number]'); if (counter) counter.textContent = String(current + 1).padStart(2, '0') } } })
  const slot = 1 / frames.length
  frames.forEach((frame, index) => {
    const at = index * slot
    if (index > 0) { film.to(frames[index - 1], { autoAlpha: 0, y: -25, duration: .035 }, at - .02); film.fromTo(frame, { autoAlpha: 0, y: 35 }, { autoAlpha: 1, y: 0, duration: .045 }, at) }
    film.fromTo(frame.querySelector('.project-visual'), { scale: 1.08, rotate: index % 2 ? 2 : -2 }, { scale: 1, rotate: 0, duration: slot * .8 }, at)
    film.fromTo(frame.querySelector('.mask-word'), { yPercent: 120 }, { yPercent: 0, duration: .06 }, at + .02)
  })
}

const cinematicCards = gsap.utils.toArray<HTMLElement>('[data-cinematic-card]')
const cardMotion = !reducedMotion && (memory === undefined || memory >= 2)
if (cinematicCards.length && cardMotion) {
  const mobile = innerWidth <= 820
  cinematicCards.forEach((card, index) => {
    const visual = card.querySelector<HTMLElement>('[data-card-visual]')
    const glyph = card.querySelector<HTMLElement>('[data-card-glyph]')
    const motif = card.querySelector<HTMLElement>('.card-motif')
    const grid = card.querySelector<HTMLElement>('.repo-card-grid')
    const copy = card.querySelector<HTMLElement>('.repo-card-copy,.organization-copy')
    const glyphScale = Number.parseFloat(card.style.getPropertyValue('--card-glyph')) || 1
    const direction = index % 2 ? -1 : 1
    const slide = mobile ? 6 + (index * 3) % 5 : 10 + (index * 5) % 10
    const turn = direction * (.25 + ((index * 7) % 9) * .09)
    const glyphTurn = direction * (2 + (index * 11) % 9)
    const glyphX = direction * (5 + (index * 17) % 13)
    const motifTurn = direction * (14 + (index * 19) % 38)
    const enterClip = direction > 0 ? `inset(0% ${8 + index % 8}% 0% 0%)` : `inset(0% 0% 0% ${8 + index % 8}%)`
    const exitClip = direction > 0 ? `inset(0% 0% 0% ${3 + index % 5}%)` : `inset(0% ${3 + index % 5}% 0% 0%)`
    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: card,
        start: 'top 92%',
        end: 'bottom 8%',
        scrub: mobile ? .35 : .62,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        onToggle: self => card.classList.toggle('card-active', self.isActive),
      },
    })
    timeline
      .fromTo(card, { xPercent: direction * slide, y: 0, scale: mobile ? .985 : .955, rotateZ: turn }, { xPercent: 0, y: 0, scale: 1, rotateZ: 0, duration: .56 }, 0)
      .to(card, { xPercent: -direction * slide * .42, y: 0, scale: mobile ? .992 : .982, rotateZ: -turn * .28, duration: .44 }, .56)
    if (visual) timeline.fromTo(visual, { clipPath: enterClip, scale: 1.06 + (index % 4) * .012 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .56 }, 0).to(visual, { clipPath: exitClip, scale: .985, duration: .44 }, .56)
    if (glyph) timeline.fromTo(glyph, { xPercent: glyphX, yPercent: 0, rotation: glyphTurn, scale: glyphScale * .9 }, { xPercent: 0, yPercent: 0, rotation: 0, scale: glyphScale, duration: .56 }, 0).to(glyph, { xPercent: -glyphX * .36, yPercent: 0, rotation: -glyphTurn * .16, scale: glyphScale * 1.035, duration: .44 }, .56)
    if (motif) timeline.fromTo(motif, { rotation: motifTurn, scale: .82 + (index % 5) * .025, opacity: .18 }, { rotation: -motifTurn * .35, scale: 1.08 + (index % 3) * .035, opacity: .68, duration: 1 }, 0)
    if (grid) timeline.fromTo(grid, { xPercent: direction * -6, yPercent: 0 }, { xPercent: direction * 6, yPercent: 0, duration: 1 }, 0)
    if (copy) timeline.fromTo(copy.children, { x: direction * (24 + (index % 4) * 8), y: 0, opacity: .46 }, { x: 0, y: 0, opacity: 1, duration: .56, stagger: .035 }, .04)
  })
}

const abyss = document.querySelector<HTMLElement>('[data-abyss]')
if (abyss && cinema) {
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: abyss, start: 'top top', end: 'bottom bottom', scrub: .8 } })
    .fromTo('.abyss-deepfield', { scale: 1.24, yPercent: 5 }, { scale: 1.04, yPercent: -2, duration: 1 }, 0)
    .fromTo('.abyss-disc', { scale: .42, opacity: 0, rotate: -7 }, { scale: 1.08, opacity: .9, rotate: 0, duration: .55 }, .02)
    .fromTo('.about-copy', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .09 }, .12)
    .to('.about-copy', { opacity: 0, y: -28, duration: .08 }, .45)
    .fromTo('.contact-copy', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .1 }, .58)
    .fromTo('.contact-copy .mask-word', { yPercent: 125 }, { yPercent: 0, duration: .08 }, .62)
}

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target) } }), { threshold: .12, rootMargin: '-40px 0px' })
document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element))

let pointerFrame = 0
addEventListener('pointermove', event => { if (!matchMedia('(pointer:fine)').matches) return; cancelAnimationFrame(pointerFrame); pointerFrame = requestAnimationFrame(() => { root.style.setProperty('--pointer-x', `${event.clientX}px`); root.style.setProperty('--pointer-y', `${event.clientY}px`) }) }, { passive: true })

const repositoryRows = [...document.querySelectorAll<HTMLElement>('[data-repo]')]
let activeCategory = 'All', searchQuery = ''
const filterRepositories = () => {
  let shown = 0
  repositoryRows.forEach(row => { const visible = (activeCategory === 'All' || row.dataset.category === activeCategory) && (row.dataset.name || '').includes(searchQuery); row.hidden = !visible; if (visible) shown++ })
  const empty = document.querySelector<HTMLElement>('[data-no-results]'); if (empty) empty.hidden = shown > 0
  lenis?.resize(); ScrollTrigger.refresh()
}
document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button => button.addEventListener('click', () => { activeCategory = button.dataset.filter || 'All'; document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button)); filterRepositories() }))
document.querySelector<HTMLInputElement>('[data-search]')?.addEventListener('input', event => { searchQuery = (event.currentTarget as HTMLInputElement).value.toLowerCase().trim(); filterRepositories() })
document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => { lenis?.resize(); ScrollTrigger.refresh() }))

type ActivityItem = { id: string; repo: string; kind: string; detail: string; timestamp: string; href: string; openShobu: boolean }
const cacheKey = 'skd-github-activity-v3', cacheTtl = 15 * 60 * 1000
const safeUrl = (value: string) => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'github.com' ? url.toString() : 'https://github.com/SahilKDas' } catch { return 'https://github.com/SahilKDas' } }
const eventDate = (value: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
const refreshDate = (value: number) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const renderActivity = (items: ActivityItem[], source: string, refreshed: number) => {
  const list = document.querySelector('[data-activity-list]'); if (!list || !items.length) return
  list.replaceChildren(...items.slice(0, 10).map((item, index) => { const link = document.createElement('a'); link.href = safeUrl(item.href); link.target = '_blank'; link.rel = 'noopener'; for (const [tag, text] of [['span', String(index + 1).padStart(2, '0')], ['small', item.kind], ['strong', item.repo], ['em', item.detail]] as const) { const node = document.createElement(tag); node.textContent = text; link.append(node) } const time = document.createElement('time'); time.dateTime = item.timestamp; time.textContent = eventDate(item.timestamp); link.append(time); const arrow = document.createElement('i'); arrow.textContent = '↗'; link.append(arrow); return link }))
  const badge = document.querySelector('[data-activity-source]'); if (badge) badge.textContent = `${source} · ${refreshDate(refreshed)}`
  lenis?.resize(); ScrollTrigger.refresh()
}
const normalize = (event: any): ActivityItem | null => {
  if (!event || !['PushEvent', 'ReleaseEvent', 'CreateEvent', 'PullRequestEvent'].includes(event.type) || typeof event.id !== 'string' || typeof event.created_at !== 'string' || typeof event.repo?.name !== 'string') return null
  const repo = event.repo.name, kind = event.type.replace('Event', '').replace('PullRequest', 'pull request').toLowerCase()
  const detail = event.type === 'PushEvent' ? String(event.payload?.ref || 'main').replace('refs/heads/', '') : event.type === 'ReleaseEvent' ? String(event.payload?.release?.tag_name || 'release') : event.type === 'CreateEvent' ? `${String(event.payload?.ref_type || 'ref')}: ${String(event.payload?.ref || 'created')}` : String(event.payload?.action || 'updated')
  return { id: event.id, repo, kind, detail, timestamp: event.created_at, href: safeUrl(event.payload?.pull_request?.html_url || event.payload?.release?.html_url || `https://github.com/${repo}`), openShobu: repo.startsWith('OpenShobu/') }
}
const readCache = () => { try { const value = JSON.parse(localStorage.getItem(cacheKey) || 'null'); return value && typeof value.savedAt === 'number' && Array.isArray(value.items) ? value : null } catch { return null } }
const cached = readCache()
if (cached && Date.now() - cached.savedAt < cacheTtl) renderActivity(cached.items, 'Cached', cached.savedAt)
else {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 5000)
  Promise.allSettled([
    fetch('https://api.github.com/users/SahilKDas/events/public?per_page=30', { signal: controller.signal }).then(response => response.ok ? response.json() : Promise.reject()),
    fetch('https://api.github.com/orgs/OpenShobu/events?per_page=30', { signal: controller.signal }).then(response => response.ok ? response.json() : Promise.reject()),
  ]).then(results => { const raw = results.flatMap(result => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []); const items = raw.map(normalize).filter((item): item is ActivityItem => Boolean(item)).filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index).sort((a, b) => Number(b.openShobu) - Number(a.openShobu) || Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 16); if (!items.length) throw new Error('No supported activity'); const savedAt = Date.now(); localStorage.setItem(cacheKey, JSON.stringify({ savedAt, items })); renderActivity(items, 'Live GitHub', savedAt) }).catch(() => { if (cached) renderActivity(cached.items, 'Cached', cached.savedAt) }).finally(() => clearTimeout(timeout))
}

document.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async event => { const button = event.currentTarget as HTMLButtonElement; try { await navigator.clipboard.writeText('lordhank2'); button.textContent = 'Copied'; setTimeout(() => button.textContent = 'Discord · lordhank2', 1600) } catch { button.textContent = 'lordhank2' } })

addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
