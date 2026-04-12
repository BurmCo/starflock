import {
  World, drift, dampen, twinkle, mouseRepel,
  scrollDrift, gravity, wind, nodeRepel, noise, attract,
} from 'https://esm.sh/cosmograph@0.2.3'

// ─── Data Definitions ─────────────────────────────────────────────────────────

const FORCE_FNS = { drift, dampen, twinkle, mouseRepel, scrollDrift, gravity, wind, nodeRepel, noise, attract }

// Keys must match FORCE_FNS exactly
const FORCE_DEFS = {
  drift:       [{ key: 'maxSpeed',  default: 0.5 }],
  dampen:      [{ key: 'factor',    default: 0.98 }],
  twinkle:     [{ key: 'variance',  default: 0.5 }],
  mouseRepel:  [{ key: 'radius',    default: 100 }, { key: 'strength', default: 0.01 }, { key: 'mode', default: 'repel' }],
  wind:        [{ key: 'angle',     default: 0 },   { key: 'strength', default: 0.001 }, { key: 'gust', default: 0 }],
  gravity:     [{ key: 'x',        default: 0.5 },  { key: 'y',        default: 0.5 },   { key: 'strength', default: 0.0005 }],
  nodeRepel:   [{ key: 'radius',    default: 40 },   { key: 'strength', default: 0.003 }],
  noise:       [{ key: 'scale',     default: 0.004 },{ key: 'strength', default: 0.001 }, { key: 'speed', default: 0.0003 }],
  attract:     [{ key: 'x',        default: 0.5 },  { key: 'y',        default: 0.5 },   { key: 'radius', default: 250 }, { key: 'strength', default: 0.003 }],
  scrollDrift: [{ key: 'mode',     default: 'wave' },{ key: 'strength', default: 8 }],
}

const PARAM_DEFS = [
  'nodeCount', 'nodeSize', 'colors', 'nodeShape', 'nodeRotation',
  'nodeColorMode', 'nodeSpawnRegion', 'nodeSizeDistribution',
  'edgeMaxDist', 'edgeMaxOpacity', 'edgeWidth', 'edgeStyle',
  'edgeCurvature', 'edgeColors', 'maxEdgesPerNode', 'minEdgesPerNode',
  'blendMode', 'glowOpacity', 'glowScale', 'glowThreshold', 'background',
]

function parseValue(v) {
  if (typeof v !== 'string') return v
  const s = v.trim()
  if (s === 'true')  return true
  if (s === 'false') return false
  if (s.startsWith('[') || s.startsWith('{')) { try { return JSON.parse(s) } catch (e) { console.warn('parseValue: invalid JSON', s) } }
  const n = Number(s)
  if (!isNaN(n) && s !== '') return n
  return s
}

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  forces: [
    { name: 'drift',      params: {} },
    { name: 'dampen',     params: {} },
    { name: 'twinkle',    params: {} },
    { name: 'mouseRepel', params: {} },
  ],
  params: [
    { key: 'nodeCount', value: '60' },
  ],
  selectedForce: null,  // number | null — index into forces[]
  selectedParam: null,  // number | null — index into params[]
  panelOpen: true,
  _pendingKey: PARAM_DEFS[0],  // key staged in dropdown when nothing selected
  _pendingVal: '',              // value staged in input when nothing selected
}

// ─── World Management ─────────────────────────────────────────────────────────

const canvas = document.getElementById('canvas')
let world = null

const ro = new ResizeObserver(() => {
  canvas.width  = Math.round(canvas.clientWidth  * devicePixelRatio)
  canvas.height = Math.round(canvas.clientHeight * devicePixelRatio)
  world?.resize()
})
ro.observe(canvas)

function applyWorld() {
  const config = Object.fromEntries(
    state.params.map(p => [p.key, parseValue(p.value)])
  )
  const forces = state.forces.map(f => {
    const params = {}
    for (const def of FORCE_DEFS[f.name]) {
      if (f.params[def.key] !== undefined) {
        params[def.key] = parseValue(String(f.params[def.key]))
      }
    }
    return FORCE_FNS[f.name](params)
  })
  world?.destroy()
  world = new World({ canvas, autoResize: false, pauseWhenHidden: true, ...config, forces })
  world.start()
}
