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

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

canvas.width  = Math.round(canvas.clientWidth  * devicePixelRatio)
canvas.height = Math.round(canvas.clientHeight * devicePixelRatio)

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
  const forces = state.forces.filter(f => FORCE_DEFS[f.name]).map(f => {
    const params = {}
    for (const def of FORCE_DEFS[f.name]) {
      if (f.params[def.key] !== undefined) {
        params[def.key] = parseValue(f.params[def.key])
      }
    }
    return FORCE_FNS[f.name](params)
  })
  world?.destroy()
  world = new World({ canvas, autoResize: false, pauseWhenHidden: true, ...config, forces })
  world.start()
}

// ─── Panel Rendering ──────────────────────────────────────────────────────────

function renderPanel() {
  const panel = document.getElementById('panel')

  // Forces section
  const forcesHTML = state.forces.map((f, i) => {
    const isSelected = state.selectedForce === i
    const subparamsHTML = isSelected
      ? `<div class="subparams">${
          (FORCE_DEFS[f.name] ?? []).map(def => `
            <div class="subparam-row">
              <span class="subparam-key">${def.key}</span>
              <input class="subparam-input"
                data-force-idx="${i}" data-force-key="${def.key}"
                value="${esc(f.params[def.key] ?? def.default)}" />
            </div>`).join('')
        }</div>`
      : ''
    return `
      <button class="chip${isSelected ? ' selected' : ''}" data-force-chip="${i}">
        ${esc(f.name)}<button class="chip-remove" data-force-remove="${i}">✕</button>
      </button>${subparamsHTML}`
  }).join('')

  const addForceOptions = Object.keys(FORCE_FNS)
    .map(n => `<option value="${n}">${n}</option>`).join('')

  // Params section
  const pendingKey = state.selectedParam !== null ? state.params[state.selectedParam].key : state._pendingKey
  const pendingVal = state.selectedParam !== null ? state.params[state.selectedParam].value : state._pendingVal

  const paramsListHTML = state.params.map((p, i) => `
    <div class="param-row${state.selectedParam === i ? ' selected' : ''}" data-param-row="${i}">
      <span class="param-row-key">${p.key}</span>
      <div class="param-row-right">
        <span class="param-row-val">${esc(p.value)}</span>
        <button class="param-remove" data-param-remove="${i}">✕</button>
      </div>
    </div>`).join('')

  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">cosmograph</span>
      <button class="panel-collapse">${state.panelOpen ? '⊟' : '⊞'}</button>
    </div>
    ${state.panelOpen ? `
      <div class="panel-section">
        <div class="section-label">Forces</div>
        <div class="chips">${forcesHTML}</div>
        <select class="chip-add">
          <option value="">+ add</option>
          ${addForceOptions}
        </select>
      </div>
      <div class="panel-section">
        <div class="section-label">Parameter</div>
        <div class="param-add-row">
          <select class="param-key-select" id="param-key">
            ${PARAM_DEFS.map(k => `<option value="${k}"${k === pendingKey ? ' selected' : ''}>${k}</option>`).join('')}
          </select>
          <input class="param-val-input" id="param-val" value="${esc(pendingVal)}" placeholder="val" />
          <button class="param-add-btn" id="param-add">+</button>
        </div>
        <div class="param-list">${paramsListHTML}</div>
      </div>
      <div class="panel-section">
        <button class="apply-btn" id="apply-btn">Apply</button>
      </div>` : ''}
  `

  attachEvents()
}

function attachEvents() {
  const panel = document.getElementById('panel')

  // Collapse toggle
  panel.querySelector('.panel-collapse')?.addEventListener('click', () => {
    state.panelOpen = !state.panelOpen
    renderPanel()
  })

  if (!state.panelOpen) return

  // Force chip — toggle sub-params
  panel.querySelectorAll('[data-force-chip]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-force-remove]')) return
      const i = +el.dataset.forceChip
      state.selectedForce = state.selectedForce === i ? null : i
      renderPanel()
    })
  })

  // Force chip — remove
  panel.querySelectorAll('[data-force-remove]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation()
      const i = +el.dataset.forceRemove
      state.forces.splice(i, 1)
      if (state.selectedForce === i) state.selectedForce = null
      else if (typeof state.selectedForce === 'number' && state.selectedForce > i) state.selectedForce--
      renderPanel()
    })
  })

  // Force add
  panel.querySelector('.chip-add')?.addEventListener('change', e => {
    const name = e.target.value
    if (!name) return
    state.forces.push({ name, params: {} })
    renderPanel()
  })

  // Sub-param inputs — update state on change (no re-render needed)
  panel.querySelectorAll('.subparam-input').forEach(el => {
    el.addEventListener('change', () => {
      const i   = +el.dataset.forceIdx
      const key =  el.dataset.forceKey
      state.forces[i].params[key] = el.value
    })
  })

  // Param row — select / deselect
  panel.querySelectorAll('[data-param-row]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-param-remove]')) return
      const i = +el.dataset.paramRow
      state.selectedParam = state.selectedParam === i ? null : i
      renderPanel()
    })
  })

  // Param row — remove
  panel.querySelectorAll('[data-param-remove]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation()
      const i = +el.dataset.paramRemove
      state.params.splice(i, 1)
      if (state.selectedParam === i) state.selectedParam = null
      else if (typeof state.selectedParam === 'number' && state.selectedParam > i) state.selectedParam--
      renderPanel()
    })
  })

  // Param key dropdown
  panel.querySelector('#param-key')?.addEventListener('change', e => {
    if (state.selectedParam !== null) {
      state.params[state.selectedParam].key = e.target.value
      renderPanel()
    } else {
      state._pendingKey = e.target.value
    }
  })

  // Param value input — live update without re-render (preserves focus)
  panel.querySelector('#param-val')?.addEventListener('input', e => {
    if (state.selectedParam !== null) {
      state.params[state.selectedParam].value = e.target.value
      const valEl = panel.querySelector(`[data-param-row="${state.selectedParam}"] .param-row-val`)
      if (valEl) valEl.textContent = e.target.value
    } else {
      state._pendingVal = e.target.value
    }
  })

  // Param add button
  panel.querySelector('#param-add')?.addEventListener('click', () => {
    const key = panel.querySelector('#param-key').value
    const val = panel.querySelector('#param-val').value
    if (!key) return
    if (state.params.some(p => p.key === key)) {
      state.selectedParam = state.params.findIndex(p => p.key === key)
      renderPanel()
      return
    }
    state.params.push({ key, value: val })
    state.selectedParam = state.params.length - 1
    state._pendingKey = PARAM_DEFS[0]
    state._pendingVal = ''
    renderPanel()
  })

  // Apply button
  panel.querySelector('#apply-btn')?.addEventListener('click', applyWorld)
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

renderPanel()
applyWorld()
