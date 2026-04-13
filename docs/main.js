import {
  World, drift, dampen, twinkle, mouseRepel,
  scrollDrift, gravity, wind, nodeRepel, noise, attract,
} from 'https://esm.sh/starflock@0.2.3'

// ─── Data Definitions ─────────────────────────────────────────────────────────

const FORCE_FNS = { drift, dampen, twinkle, mouseRepel, scrollDrift, gravity, wind, nodeRepel, noise, attract }

// Keys must match FORCE_FNS exactly
const FORCE_DEFS = {
  drift:       [{ key: 'maxSpeed',  default: 0.5,    hint: '0.1 – 2.0' }],
  dampen:      [{ key: 'factor',    default: 0.98,   hint: '0.9 – 0.999' }],
  twinkle:     [{ key: 'variance',  default: 0.5,    hint: '0.0 – 1.0' }],
  mouseRepel:  [{ key: 'radius',    default: 100,    hint: '50 – 300' }, { key: 'strength', default: 0.01, hint: '0.001 – 0.05' }, { key: 'mode', default: 'repel', options: ['repel', 'attract'] }],
  wind:        [{ key: 'angle',     default: 0,      hint: '0 – 360' },  { key: 'strength', default: 0.001, hint: '0.0001 – 0.01' }, { key: 'gust', default: 0, hint: '0.0 – 1.0' }],
  gravity:     [{ key: 'x',        default: 0.5,    hint: '0.0 – 1.0' }, { key: 'y', default: 0.5, hint: '0.0 – 1.0' }, { key: 'strength', default: 0.0005, hint: '0.0001 – 0.005' }],
  nodeRepel:   [{ key: 'radius',    default: 40,     hint: '10 – 150' },  { key: 'strength', default: 0.003, hint: '0.001 – 0.02' }],
  noise:       [{ key: 'scale',     default: 0.004,  hint: '0.001 – 0.02' }, { key: 'strength', default: 0.001, hint: '0.0001 – 0.005' }, { key: 'speed', default: 0.0003, hint: '0.0001 – 0.002' }],
  attract:     [{ key: 'x',        default: 0.5,    hint: '0.0 – 1.0' }, { key: 'y', default: 0.5, hint: '0.0 – 1.0' }, { key: 'radius', default: 250, hint: '50 – 500' }, { key: 'strength', default: 0.003, hint: '0.0005 – 0.01' }],
  scrollDrift: [{ key: 'mode',     default: 'wave',  options: ['wave', 'shift'] }, { key: 'strength', default: 8, hint: '1 – 30' }],
}

const FORCE_DESCS = {
  drift:       'Gives each node a slow random velocity, making the field gently wander.',
  dampen:      'Multiplies every velocity by a factor each frame — slows nodes without fully stopping them.',
  twinkle:     'Randomly varies node opacity each frame for a sparkling effect.',
  mouseRepel:  'Pushes (or pulls) nodes near the cursor. Radius is in canvas pixels.',
  wind:        'Applies a constant directional acceleration to all nodes. Gust adds turbulence.',
  gravity:     'Pulls nodes toward a normalised point (x/y 0–1). Good for clustering.',
  nodeRepel:   'Nodes push each other away when closer than radius, preventing pileups.',
  noise:       'Steers nodes along a slow-moving Perlin noise field for organic flow.',
  attract:     'Pulls nodes within radius toward a normalised point, like gravity with a cutoff.',
  scrollDrift: 'Shifts nodes when the page is scrolled — wave mode pulses, shift mode translates.',
}

const PARAM_DEFS = [
  'nodeCount', 'nodeSize', 'colors', 'nodeShape', 'nodeRotation',
  'nodeColorMode', 'nodeSpawnRegion', 'nodeSizeDistribution',
  'edgeMaxDist', 'edgeMaxOpacity', 'edgeWidth', 'edgeStyle',
  'edgeCurvature', 'edgeColors', 'edgeColorMode', 'maxEdgesPerNode', 'minEdgesPerNode',
  'renderOrder', 'blendMode', 'glowOpacity', 'glowScale', 'glowThreshold', 'background',
]

const PARAM_DESCS = {
  nodeCount:           { desc: 'Total number of nodes spawned in the world.',                           hint: '20 – 500' },
  nodeSize:            { desc: 'Base radius of each node in canvas pixels.',                            hint: '1 – 20' },
  colors:              { desc: 'Array of hex colours nodes are randomly drawn from.',                   isColorArray: true },
  nodeShape:           { desc: 'Shape used to render nodes.',                                           options: ['circle', 'ring', 'diamond', 'star', 'cross'] },
  nodeRotation:        { desc: 'Rotation angle applied to non-circular node shapes (radians).',         hint: '0 – 6.28' },
  nodeColorMode:       { desc: 'How colour is assigned to nodes.',                                      options: ['random', 'sequential', 'gradient', 'by-size', 'by-position'] },
  nodeSpawnRegion:     { desc: 'Region where new nodes appear.',                                        options: ['full', 'center', 'edges'] },
  nodeSizeDistribution:{ desc: 'Distribution curve for node sizes.',                                   options: ['uniform', 'gaussian', 'weighted-small'] },
  edgeMaxDist:         { desc: 'Maximum distance between nodes for an edge to be drawn.',               hint: '50 – 300' },
  edgeMaxOpacity:      { desc: 'Opacity of edges at their closest point.',                             hint: '0.0 – 1.0' },
  edgeWidth:           { desc: 'Stroke width of edges in canvas pixels.',                              hint: '0.5 – 5' },
  edgeStyle:           { desc: 'Rendering style of edges.',                                            options: ['solid', 'dashed'] },
  edgeCurvature:       { desc: 'How much edges bow between nodes (0 = straight).',                     hint: '0.0 – 1.0' },
  edgeColors:          { desc: 'Array of hex colours for edges. Defaults to node colours if omitted.', isColorArray: true },
  edgeColorMode:       { desc: 'Which node colour is used to tint each edge.',                         options: ['alternate', 'source', 'target'] },
  maxEdgesPerNode:     { desc: 'Cap on how many edges a single node can draw.',                        hint: '1 – 10' },
  minEdgesPerNode:     { desc: 'Minimum edges drawn per node (0 = none).',                             hint: '0 – 5' },
  renderOrder:         { desc: 'Whether edges or nodes are drawn on top.',                             options: ['edges-first', 'nodes-first'] },
  blendMode:           { desc: 'Canvas globalCompositeOperation for node rendering.',                  options: ['source-over', 'lighter', 'screen', 'multiply', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity', 'xor'] },
  glowOpacity:         { desc: 'Opacity of the soft bloom drawn around each node.',                   hint: '0.0 – 1.0' },
  glowScale:           { desc: 'How large the bloom halo is relative to the node.',                   hint: '1.0 – 6.0' },
  glowThreshold:       { desc: 'Minimum node brightness before glow is applied.',                     hint: '0.0 – 1.0' },
  background:          { desc: 'Canvas background colour.',                                            isColor: true },
}

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

function toHex(val) {
  const s = String(val).trim().replace(/^["']|["']$/g, '')
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : '#000000'
}

function hsvToHex(h, s, v) {
  const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  const h = d === 0 ? 0
    : max === r ? ((g - b) / d % 6) * 60
    : max === g ? (b - r) / d * 60 + 120
    : (r - g) / d * 60 + 240
  return [(h + 360) % 360, max === 0 ? 0 : d / max, max]
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
  world?.stop()
  world = new World({ canvas, autoResize: false, pauseWhenHidden: true, ...config, forces })
  world.start()
}

// ─── In-Page Color Picker ─────────────────────────────────────────────────────

const cpop = (() => {
  const el = document.createElement('div')
  el.className = 'cpop'
  el.style.display = 'none'
  el.innerHTML = `
    <div class="cpop-sv"><div class="cpop-sv-cur"></div></div>
    <div class="cpop-hue"><div class="cpop-hue-cur"></div></div>
    <input class="cpop-hex" type="text" maxlength="7" spellcheck="false">
  `
  document.body.appendChild(el)

  let h = 0, s = 1, v = 1, dragging = null, onChange = null

  const svEl  = el.querySelector('.cpop-sv')
  const svCur = el.querySelector('.cpop-sv-cur')
  const hueEl = el.querySelector('.cpop-hue')
  const hueCur = el.querySelector('.cpop-hue-cur')
  const hexIn  = el.querySelector('.cpop-hex')

  function sync() {
    svEl.style.setProperty('--h', h)
    svCur.style.left = (s * 100) + '%'
    svCur.style.top  = ((1 - v) * 100) + '%'
    hueCur.style.left = (h / 360 * 100) + '%'
    hexIn.value = hsvToHex(h, s, v)
    onChange?.(hsvToHex(h, s, v))
  }

  function applySV(e) {
    const r = svEl.getBoundingClientRect()
    s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    v = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))
    sync()
  }

  function applyHue(e) {
    const r = hueEl.getBoundingClientRect()
    h = Math.max(0, Math.min(360, (e.clientX - r.left) / r.width * 360))
    sync()
  }

  svEl.addEventListener('mousedown',  e => { dragging = 'sv';  applySV(e);  e.preventDefault() })
  hueEl.addEventListener('mousedown', e => { dragging = 'hue'; applyHue(e); e.preventDefault() })
  document.addEventListener('mousemove', e => {
    if (dragging === 'sv')  applySV(e)
    if (dragging === 'hue') applyHue(e)
  })
  document.addEventListener('mouseup', () => { dragging = null })

  hexIn.addEventListener('input', e => {
    const val = e.target.value
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      ;[h, s, v] = hexToHsv(val)
      svEl.style.setProperty('--h', h)
      svCur.style.left  = (s * 100) + '%'
      svCur.style.top   = ((1 - v) * 100) + '%'
      hueCur.style.left = (h / 360 * 100) + '%'
      onChange?.(val)
    }
  })

  document.addEventListener('mousedown', e => {
    if (el.style.display === 'none') return
    if (!el.contains(e.target) && !e.target.closest('.color-swatch-wrap') && !e.target.closest('.param-color-btn')) {
      el.style.display = 'none'
    }
  }, true)

  return {
    open(anchor, hex, cb) {
      ;[h, s, v] = hexToHsv(toHex(hex))
      onChange = cb
      svEl.style.setProperty('--h', h)
      svCur.style.left  = (s * 100) + '%'
      svCur.style.top   = ((1 - v) * 100) + '%'
      hueCur.style.left = (h / 360 * 100) + '%'
      hexIn.value = hsvToHex(h, s, v)
      el.style.display = 'block'
      const ar = anchor.getBoundingClientRect()
      const pw = el.offsetWidth || 180, ph = el.offsetHeight || 200
      let top  = ar.bottom + 6
      let left = ar.left
      if (top  + ph > window.innerHeight - 8) top  = ar.top - ph - 6
      if (left + pw > window.innerWidth  - 8) left = window.innerWidth - pw - 8
      el.style.top  = top  + 'px'
      el.style.left = left + 'px'
    },
    close() { el.style.display = 'none' },
  }
})()

// ─── Input Helpers ────────────────────────────────────────────────────────────

function parseColors(val) {
  try { const a = JSON.parse(val); if (Array.isArray(a)) return a } catch (e) {}
  return []
}

function colorEditorHTML(val) {
  const colors = parseColors(val)
  const swatches = colors.map((c, i) => `
    <span class="color-swatch-wrap">
      <button class="color-swatch" data-color-idx="${i}" data-color="${esc(c)}" style="background:${esc(c)}"></button>
      <button class="color-swatch-remove" data-color-idx="${i}" tabindex="-1">✕</button>
    </span>`).join('')
  return `<div class="color-array-editor" id="color-editor">
    <div class="color-swatches">${swatches}</div>
    <button class="color-swatch-add" id="color-add">+</button>
  </div>`
}

function subparamInputHTML(def, forceIdx, f) {
  const val = f.params[def.key] ?? def.default
  if (def.options) {
    return `<select class="subparam-input" data-force-idx="${forceIdx}" data-force-key="${def.key}">
      ${def.options.map(o => `<option value="${o}"${val === o ? ' selected' : ''}>${o}</option>`).join('')}
    </select>`
  }
  return `<input class="subparam-input" data-force-idx="${forceIdx}" data-force-key="${def.key}" value="${esc(val)}">`
}

function paramValInputHTML(key, val) {
  const def = PARAM_DESCS[key]
  if (def?.isColorArray) return colorEditorHTML(val)
  if (def?.isColor) {
    const hex = toHex(val)
    return `<button class="param-color-btn" id="param-val" data-color="${esc(hex)}" style="background:${esc(hex)}"></button>`
  }
  if (def?.options) {
    return `<select class="param-val-select" id="param-val">
      ${def.options.map(o => `<option value="${o}"${val === o ? ' selected' : ''}>${o}</option>`).join('')}
    </select>`
  }
  return `<input class="param-val-input" id="param-val" value="${esc(val)}" placeholder="val">`
}

function readParamValFromDOM(panel) {
  const colorEditor = panel.querySelector('#color-editor')
  if (colorEditor) {
    return JSON.stringify([...colorEditor.querySelectorAll('.color-swatch')].map(s => s.dataset.color))
  }
  const pv = panel.querySelector('#param-val')
  return pv?.dataset.color ?? pv?.value ?? ''
}

// ─── Panel Rendering ──────────────────────────────────────────────────────────

function renderPanel() {
  const panel = document.getElementById('panel')

  // Forces section
  const forcesHTML = state.forces.map((f, i) => {
    const isSelected = state.selectedForce === i
    const subparamsHTML = isSelected
      ? `<div class="subparams">${
          FORCE_DESCS[f.name]
            ? `<div class="info-box">${esc(FORCE_DESCS[f.name])}</div>`
            : ''
        }${
          (FORCE_DEFS[f.name] ?? []).map(def => `
            <div class="subparam-row">
              <span class="subparam-key">${def.key}${def.hint ? `<span class="info-hint">${esc(def.hint)}</span>` : ''}</span>
              ${subparamInputHTML(def, i, f)}
            </div>`).join('')
        }</div>`
      : ''
    return `
      <button class="chip${isSelected ? ' selected' : ''}" data-force-chip="${i}">
        ${esc(f.name)}<span class="chip-remove" data-force-remove="${i}">✕</span>
      </button>${subparamsHTML}`
  }).join('')

  const addForceOptions = Object.keys(FORCE_FNS)
    .map(n => `<option value="${n}">${n}</option>`).join('')

  // Params section
  const pendingKey = state._pendingKey
  const pendingVal = state.selectedParam !== null ? state.params[state.selectedParam].value : state._pendingVal

  const paramDef = PARAM_DESCS[pendingKey]
  const paramInfo = paramDef
    ? `<div class="info-box">
        ${esc(paramDef.desc)}${paramDef.hint ? `<span class="info-hint">${esc(paramDef.hint)}</span>` : ''}
       </div>`
    : ''

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
          ${paramDef?.isColorArray ? '' : paramValInputHTML(pendingKey, pendingVal)}
          <button class="param-add-btn" id="param-add">+</button>
        </div>
        ${paramDef?.isColorArray ? colorEditorHTML(pendingVal) : ''}
        ${paramInfo}
        <div class="param-list">${paramsListHTML}</div>
      </div>
      <div class="panel-section">
        <button class="apply-btn" id="apply-btn">Apply</button>
        <p class="info-disclaimer">ranges shown are typical defaults, not hard limits</p>
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
      if (state.selectedParam === i) {
        state.selectedParam = null
      } else {
        state.selectedParam = i
        state._pendingKey = state.params[i].key
      }
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

  // Param key dropdown — stages a new pending key and deselects any active param row
  panel.querySelector('#param-key')?.addEventListener('change', e => {
    state._pendingKey = e.target.value
    state._pendingVal = ''
    state.selectedParam = null
    renderPanel()
  })

  // Param value input (text/select) — live update without re-render
  panel.querySelector('#param-val')?.addEventListener('input', e => {
    if (state.selectedParam !== null) {
      state.params[state.selectedParam].value = e.target.value
      const valEl = panel.querySelector(`[data-param-row="${state.selectedParam}"] .param-row-val`)
      if (valEl) valEl.textContent = e.target.value
    } else {
      state._pendingVal = e.target.value
    }
  })

  // Color swatch — open picker
  panel.querySelectorAll('.color-swatch').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation()
      const i = +el.dataset.colorIdx
      cpop.open(el, el.dataset.color, hex => {
        const swatch = document.querySelector(`.color-swatch[data-color-idx="${i}"]`)
        if (swatch) { swatch.style.background = hex; swatch.dataset.color = hex }
        const colors = [...panel.querySelectorAll('.color-swatch')].map(s => s.dataset.color)
        const val = JSON.stringify(colors)
        if (state.selectedParam !== null) {
          state.params[state.selectedParam].value = val
          const valEl = panel.querySelector(`[data-param-row="${state.selectedParam}"] .param-row-val`)
          if (valEl) valEl.textContent = val
        } else {
          state._pendingVal = val
        }
      })
    })
  })

  // Single color param button — open picker
  panel.querySelector('.param-color-btn')?.addEventListener('click', e => {
    e.stopPropagation()
    const btn = e.currentTarget
    cpop.open(btn, btn.dataset.color, hex => {
      btn.style.background = hex
      btn.dataset.color = hex
      if (state.selectedParam !== null) {
        state.params[state.selectedParam].value = hex
        const valEl = panel.querySelector(`[data-param-row="${state.selectedParam}"] .param-row-val`)
        if (valEl) valEl.textContent = hex
      } else {
        state._pendingVal = hex
      }
    })
  })

  // Color swatch — remove
  panel.querySelectorAll('.color-swatch-remove').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation()
      cpop.close()
      const i = +el.dataset.colorIdx
      const colors = [...panel.querySelectorAll('.color-swatch')].map(s => s.dataset.color)
      colors.splice(i, 1)
      const val = JSON.stringify(colors)
      if (state.selectedParam !== null) state.params[state.selectedParam].value = val
      else state._pendingVal = val
      renderPanel()
    })
  })

  // Color swatch — add
  panel.querySelector('#color-add')?.addEventListener('click', () => {
    const colors = [...panel.querySelectorAll('.color-swatch')].map(s => s.dataset.color)
    colors.push('#ffffff')
    const val = JSON.stringify(colors)
    if (state.selectedParam !== null) state.params[state.selectedParam].value = val
    else state._pendingVal = val
    renderPanel()
  })

  // Param add button
  panel.querySelector('#param-add')?.addEventListener('click', () => {
    const key = panel.querySelector('#param-key').value
    const val = readParamValFromDOM(panel)
    if (!key) return
    if (state.params.some(p => p.key === key)) {
      state.selectedParam = state.params.findIndex(p => p.key === key)
      state._pendingKey = key
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
