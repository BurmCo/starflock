import { World, drift, dampen, twinkle, mouseRepel, scrollDrift, gravity, wind, nodeRepel, noise, attract } from '../src/index.js'

// Star color palettes
const STARS = ['#ffffff', '#cce8ff', '#fff4e0']       // white, blue-white, warm white
const STARS_COOL = ['#ffffff', '#cce8ff', '#e8f0ff']  // white + cool blues
const STARS_WARM = ['#fff8f0', '#ffe4c4', '#ffffff']  // warm white + faint orange

const CONFIGS = [
  {
    title: 'Default — constellation',
    config: {
      nodeCount: 40,
      nodeSize: [0.8, 2.8],
      colors: STARS,
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.18,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { nodeCount: 40, edgeMaxDist: 180, forces: 'twinkle · mouseRepel · dampen · drift' },
  },
  {
    title: 'Edge style — gradient + curved',
    config: {
      nodeCount: 50,
      colors: STARS_COOL,
      edgeMaxDist: 200,
      edgeMaxOpacity: 0.5,
      edgeStyle: 'gradient',
      edgeCurvature: 0.4,
      edgeWidth: 1,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { edgeStyle: 'gradient', edgeCurvature: 0.4, edgeWidth: 1 },
  },
  {
    title: 'Edge style — dashed',
    config: {
      nodeCount: 50,
      colors: STARS,
      edgeMaxDist: 200,
      edgeMaxOpacity: 0.4,
      edgeStyle: 'dashed',
      edgeWidth: 0.8,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { edgeStyle: 'dashed', edgeMaxOpacity: 0.4 },
  },
  {
    title: 'Edge colors + thickness',
    config: {
      nodeCount: 45,
      colors: ['#ffffff'],
      edgeColors: ['#60A5FA', '#A78BFA', '#38BDF8'],
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.45,
      edgeWidth: 1.2,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { edgeColors: 'blue · violet · sky', edgeWidth: 1.2 },
  },
  {
    title: 'Node shape — diamond + rotation',
    config: {
      nodeCount: 50,
      nodeSize: [2, 6],
      nodeShape: 'diamond',
      nodeRotation: true,
      colors: STARS_COOL,
      edgeMaxDist: 160,
      forces: [mouseRepel(), dampen(), drift()],
    },
    display: { nodeShape: 'diamond', nodeRotation: true, nodeSize: '[2, 6]' },
  },
  {
    title: 'Node shape — star',
    config: {
      nodeCount: 40,
      nodeSize: [3, 7],
      nodeShape: 'star',
      nodeRotation: true,
      colors: STARS_WARM,
      edgeMaxDist: 140,
      edgeMaxOpacity: 0.2,
      forces: [mouseRepel(), dampen(), drift()],
    },
    display: { nodeShape: 'star', nodeRotation: true, nodeSize: '[3, 7]' },
  },
  {
    title: 'Blend mode — screen',
    config: {
      nodeCount: 50,
      nodeSize: [1, 4],
      colors: STARS,
      edgeMaxDist: 160,
      edgeMaxOpacity: 0.3,
      blendMode: 'screen',
      glowOpacity: 0.5,
      glowScale: 6,
      forces: [twinkle({ variance: 0.6 }), mouseRepel(), dampen(), drift()],
    },
    display: { blendMode: 'screen', glowOpacity: 0.5, glowScale: 6 },
  },
  {
    title: 'Force — gravity',
    config: {
      nodeCount: 45,
      colors: STARS,
      edgeMaxDist: 150,
      edgeMaxOpacity: 0.25,
      forces: [gravity({ x: 0.5, y: 0.5, strength: 0.0005 }), mouseRepel({ radius: 80, strength: 0.02 }), dampen({ factor: 0.96 }), drift({ maxSpeed: 0.5 })],
    },
    display: { gravity: '{ x: 0.5, y: 0.5 }', strength: 0.0005 },
  },
  {
    title: 'Force — wind + gust',
    config: {
      nodeCount: 40,
      colors: STARS_COOL,
      edgeMaxDist: 160,
      edgeMaxOpacity: 0.2,
      forces: [wind({ angle: 0.3, strength: 0.001, gust: 0.0008 }), dampen({ factor: 0.98 }), drift({ maxSpeed: 0.3 })],
    },
    display: { wind: 'angle: 0.3', strength: 0.001, gust: 0.0008 },
  },
  {
    title: 'Force — noise field',
    config: {
      nodeCount: 45,
      colors: STARS,
      edgeMaxDist: 170,
      edgeMaxOpacity: 0.2,
      forces: [noise({ scale: 0.004, strength: 0.001, speed: 0.0003 }), dampen({ factor: 0.98 }), drift({ maxSpeed: 0.4 })],
    },
    display: { noise: 'scale: 0.004', strength: 0.001, speed: 0.0003 },
  },
  {
    title: 'Force — node repel',
    config: {
      nodeCount: 50,
      nodeSize: [2, 5],
      colors: STARS_COOL,
      edgeMaxDist: 120,
      edgeMaxOpacity: 0.3,
      forces: [nodeRepel({ radius: 40, strength: 0.003 }), mouseRepel({ radius: 100, strength: 0.015 }), dampen({ factor: 0.95 }), drift({ maxSpeed: 0.3 })],
    },
    display: { nodeRepel: '{ radius: 40 }', strength: 0.003 },
  },
  {
    title: 'Mouse — attract',
    config: {
      nodeCount: 40,
      colors: STARS,
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.25,
      forces: [mouseRepel({ mode: 'attract', radius: 150, strength: 0.008 }), dampen({ factor: 0.97 }), drift()],
    },
    display: { mouseRepel: "mode: 'attract'", radius: 150, strength: 0.008 },
  },
  {
    title: 'Mouse — orbit',
    config: {
      nodeCount: 40,
      colors: STARS,
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.2,
      forces: [mouseRepel({ mode: 'orbit', radius: 140, strength: 0.01 }), dampen({ factor: 0.98 }), drift()],
    },
    display: { mouseRepel: "mode: 'orbit'", radius: 140, strength: 0.01 },
  },
  {
    title: 'Spawn region — edges',
    config: {
      nodeCount: 45,
      colors: STARS,
      nodeSpawnRegion: 'edges',
      edgeMaxDist: 140,
      edgeMaxOpacity: 0.25,
      maxEdgesPerNode: 3,
      forces: [nodeRepel({ radius: 60, strength: 0.002 }), dampen({ factor: 0.98 }), drift({ maxSpeed: 0.3 })],
    },
    display: { nodeSpawnRegion: 'edges', maxEdgesPerNode: 3 },
  },
  {
    title: 'Size distribution — gaussian',
    config: {
      nodeCount: 40,
      nodeSize: [0.5, 5],
      nodeSizeDistribution: 'gaussian',
      colors: ['#ffffff'],
      edgeMaxDist: 160,
      edgeMaxOpacity: 0.2,
      glowThreshold: 3,
      glowScale: 5,
      glowOpacity: 0.3,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { nodeSizeDistribution: 'gaussian', nodeSize: '[0.5, 5]' },
  },
  {
    title: 'Min edges per node — 2',
    config: {
      nodeCount: 40,
      colors: STARS,
      edgeMaxDist: 100,
      edgeMaxOpacity: 0.3,
      minEdgesPerNode: 2,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { minEdgesPerNode: 2, edgeMaxDist: 100 },
  },
  {
    title: 'Max edges per node — 3',
    config: {
      nodeCount: 50,
      colors: STARS,
      edgeMaxDist: 240,
      edgeMaxOpacity: 0.35,
      maxEdgesPerNode: 3,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { maxEdgesPerNode: 3, edgeMaxDist: 240 },
  },
  {
    title: 'Scroll drift — wave',
    config: {
      nodeCount: 40,
      colors: STARS,
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.2,
      forces: [scrollDrift({ mode: 'wave', strength: 8 }), dampen({ factor: 0.97 }), drift()],
    },
    display: { scrollDrift: "mode: 'wave'", strength: 8 },
  },
  {
    title: 'Scroll drift — rotate',
    config: {
      nodeCount: 40,
      colors: STARS_COOL,
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.2,
      forces: [scrollDrift({ mode: 'rotate', strength: 6 }), dampen({ factor: 0.97 }), drift()],
    },
    display: { scrollDrift: "mode: 'rotate'", strength: 6 },
  },
  {
    title: 'Scroll drift — scatter',
    config: {
      nodeCount: 40,
      colors: STARS_WARM,
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.2,
      forces: [scrollDrift({ mode: 'scatter', strength: 6 }), dampen({ factor: 0.97 }), drift()],
    },
    display: { scrollDrift: "mode: 'scatter'", strength: 6 },
  },
  {
    title: 'Color mode — gradient',
    config: {
      nodeCount: 50,
      nodeSize: [1, 4],
      colors: ['#60A5FA', '#ffffff', '#FBBF24'],
      nodeColorMode: 'gradient',
      edgeMaxDist: 160,
      edgeMaxOpacity: 0.2,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { nodeColorMode: 'gradient', colors: 'blue → white → amber (x-axis)' },
  },
  {
    title: 'Color mode — by-position',
    config: {
      nodeCount: 50,
      nodeSize: [1, 4],
      colors: ['#60A5FA', '#ffffff', '#FBBF24'],
      nodeColorMode: 'by-position',
      edgeMaxDist: 160,
      edgeMaxOpacity: 0.2,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { nodeColorMode: 'by-position', colors: 'blue → white → amber (diagonal)' },
  },
  {
    title: 'Force — attract',
    config: {
      nodeCount: 50,
      colors: STARS,
      edgeMaxDist: 160,
      edgeMaxOpacity: 0.25,
      forces: [attract({ x: 0.5, y: 0.5, radius: 250, strength: 0.003 }), nodeRepel({ radius: 35, strength: 0.004 }), mouseRepel({ radius: 80, strength: 0.02 }), dampen({ factor: 0.97 }), drift({ maxSpeed: 0.4 })],
    },
    display: { attract: '{ x: 0.5, y: 0.5 }', radius: 250, strength: 0.003 },
  },
  {
    title: 'Colors — blue / violet',
    config: {
      nodeCount: 45,
      nodeSize: [0.8, 3],
      colors: ['#60A5FA', '#A78BFA', '#E879F9'],
      edgeMaxDist: 180,
      edgeMaxOpacity: 0.22,
      blendMode: 'screen',
      glowOpacity: 0.35,
      glowScale: 5,
      forces: [twinkle({ variance: 0.5 }), mouseRepel(), dampen(), drift()],
    },
    display: { colors: '#60A5FA · #A78BFA · #E879F9', blendMode: 'screen' },
  },
  {
    title: 'Colors — amber / rose',
    config: {
      nodeCount: 45,
      nodeSize: [0.8, 3],
      colors: ['#FBBF24', '#F87171', '#FB923C'],
      edgeMaxDist: 170,
      edgeMaxOpacity: 0.2,
      forces: [twinkle(), mouseRepel(), dampen(), drift()],
    },
    display: { colors: '#FBBF24 · #F87171 · #FB923C' },
  },
]

function renderConfig(display) {
  return Object.entries(display)
    .map(([k, v]) => `<span class="key">${k}</span>: <span class="val">${v}</span>`)
    .join('\n')
}

const grid = document.getElementById('grid')
const worlds = []

for (const { title, config, display } of CONFIGS) {
  const card = document.createElement('div')
  card.className = 'card'

  const canvasWrap = document.createElement('div')
  canvasWrap.className = 'canvas-wrap'

  const canvas = document.createElement('canvas')
  canvasWrap.appendChild(canvas)
  card.appendChild(canvasWrap)

  const info = document.createElement('div')
  info.className = 'card-info'
  info.innerHTML = `
    <div class="card-title">${title}</div>
    <div class="card-config">${renderConfig(display)}</div>
  `
  card.appendChild(info)
  grid.appendChild(card)

  const world = new World({ canvas, autoResize: false, pauseWhenHidden: true, pauseWhenOffscreen: true, ...config })

  // Size canvas once it's in the DOM, then start
  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      canvas.width = entry.contentRect.width
      canvas.height = entry.contentRect.height
      world.resize()
    }
  })
  ro.observe(canvas)

  // Scroll simulator toggle
  const hasScroll = (config.forces ?? []).some(f => f.toString().includes('scrollY') || String(f).includes('scroll'))
  const toggle = document.createElement('div')
  toggle.className = 'scroll-toggle'
  toggle.innerHTML = '↕ scroll sim <span class="hint">hovering…</span>'
  canvasWrap.appendChild(toggle)

  let scrollActive = false
  let scrollInterval = null
  let scrollDir = 1

  toggle.addEventListener('click', () => {
    scrollActive = !scrollActive
    toggle.classList.toggle('active', scrollActive)
    if (!scrollActive && scrollInterval) {
      clearInterval(scrollInterval)
      scrollInterval = null
    }
  })

  toggle.addEventListener('mouseenter', (e) => {
    if (!scrollActive) return
    scrollInterval = setInterval(() => {
      world.scrollY = (world.scrollY ?? 0) + scrollDir * 20
    }, 16)
  })

  toggle.addEventListener('mousemove', (e) => {
    const rect = toggle.getBoundingClientRect()
    scrollDir = (e.clientY - rect.top) < rect.height / 2 ? -1 : 1
  })

  toggle.addEventListener('mouseleave', () => {
    if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null }
  })

  world.start()
  worlds.push(world)
}
