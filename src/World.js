import { Node } from './Node.js'
import { resolveShape } from './shapes.js'
import { QuadTree } from './QuadTree.js'

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function gaussianRand(minR, maxR) {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  const normalized = Math.min(Math.max((n + 3) / 6, 0), 1)
  return minR + (maxR - minR) * normalized
}

function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function lerpColor(colors, t) {
  if (colors.length === 0) return '#ffffff'
  if (colors.length === 1) return colors[0]
  const scaled = Math.max(0, Math.min(1, t)) * (colors.length - 1)
  const i = Math.min(Math.floor(scaled), colors.length - 2)
  const f = scaled - i
  const [r1, g1, b1] = hexToRgb(colors[i])
  const [r2, g2, b2] = hexToRgb(colors[i + 1])
  if ([r1, g1, b1, r2, g2, b2].some(Number.isNaN)) return colors[i]
  return `rgb(${Math.round(r1 + (r2 - r1) * f)},${Math.round(g1 + (g2 - g1) * f)},${Math.round(b1 + (b2 - b1) * f)})`
}

function spawnPosition(spawnRegion, width, height) {
  if (typeof spawnRegion === 'function') {
    return spawnRegion(width, height)
  }
  if (spawnRegion === 'center') {
    return { x: width * 0.25 + Math.random() * width * 0.5, y: height * 0.25 + Math.random() * height * 0.5 }
  }
  if (spawnRegion === 'edges') {
    const zone = Math.min(width, height) * 0.2
    const edge = Math.floor(Math.random() * 4)
    if (edge === 0) return { x: Math.random() * width, y: Math.random() * zone }
    if (edge === 1) return { x: Math.random() * width, y: height - Math.random() * zone }
    if (edge === 2) return { x: Math.random() * zone, y: Math.random() * height }
    return { x: width - Math.random() * zone, y: Math.random() * height }
  }
  return { x: Math.random() * width, y: Math.random() * height }
}

const DEFAULTS = {
  // Nodes
  nodeCount: 60,
  nodeSize: [0.8, 2.8],
  colors: ['#ffffff'],
  nodeSizeDistribution: 'uniform',
  nodeColorMode: 'random',
  nodeSpawnRegion: 'full',
  nodeRotation: false,

  // Edges
  edgeMaxDist: 180,
  edgeMaxOpacity: 0.18,
  edgeWidth: 0.5,
  edgeColors: null,
  edgeStyle: 'solid',
  edgeColorMode: 'alternate',
  maxEdgesPerNode: null,
  minEdgesPerNode: null,
  edgeCurvature: 0,
  edges: null,           // Array<[i,j]> — predefined pairs; null = distance-based

  // Node shape
  nodeShape: 'circle',

  // Glow
  glowOnLargeNodes: true,
  glowThreshold: 2,
  glowScale: 4,
  glowOpacity: 0.25,

  // Rendering
  pixelRatio: 'auto',
  blendMode: 'source-over',
  renderOrder: 'edges-first',
  background: null,

  // Callbacks
  onFrame: null,
  onNodeHover: null,
  onNodeLeave: null,
  onNodeClick: null,

  // Performance
  pauseWhenHidden: true,
  maxEdgesPerFrame: null,

  // Use QuadTree for edge distance queries — O(n log n) instead of O(n²), useful above ~200 nodes
  spatialIndex: false,

  // When false: World never sets canvas.width/height — caller is responsible for sizing
  autoResize: true,

  // Pause RAF when canvas is not visible in the viewport (uses IntersectionObserver).
  // Ineffective with autoResize: true — the fixed viewport canvas always intersects
  // the viewport; useful for autoResize: false embedded canvases.
  pauseWhenOffscreen: false,
}

const FRAME_MS = 1000 / 60
const MAX_FRAME_MS = 50

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function assignOptions(target, source) {
  for (const key of Object.keys(source)) {
    if (BLOCKED_KEYS.has(key) || source[key] === undefined) continue
    target[key] = source[key]
  }
  return target
}

// Options only consumed by _createNodes — changing them requires a rebuild
const NODE_REBUILD_KEYS = ['nodeCount', 'nodeSize', 'nodeSizeDistribution', 'nodeSpawnRegion', 'nodeRotation', 'layout']

function sameForces(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((f, i) => f === b[i])
}

function sameValue(a, b) {
  if (a === b) return true
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i])
}

export class World {
  constructor({ canvas, forces = [], ...options } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.forces = forces
    this.options = assignOptions({ ...DEFAULTS }, options)
    this._edgeColorsExplicit = !!options.edgeColors
    if (!this.options.edgeColors) {
      this.options.edgeColors = this.options.colors
    }

    this.nodes = []
    this.raf = null
    this._lastTime = null
    this.mouse = null
    this.scrollY = 0
    this._started = false
    this._hoveredNode = null
    this._resizeTimer = null
    this._pausedHidden = false
    this._pausedOffscreen = false

    this._onMouseMove = this._onMouseMove.bind(this)
    this._onScroll = this._onScroll.bind(this)
    this._onResize = this._onResize.bind(this)
    this._onVisibilityChange = this._onVisibilityChange.bind(this)
    this._onClick = this._onClick.bind(this)
    this._loop = this._loop.bind(this)
  }

  _sampleNodeRadius(minR, maxR) {
    const dist = this.options.nodeSizeDistribution
    if (dist === 'gaussian') return gaussianRand(minR, maxR)
    if (dist === 'weighted-small') return minR + (maxR - minR) * Math.pow(Math.random(), 2)
    return rand(minR, maxR)
  }

  _createNodes() {
    const width  = this._logicalWidth  ?? this.canvas.width
    const height = this._logicalHeight ?? this.canvas.height
    const opts   = this.options
    const { nodeSize, colors, nodeSpawnRegion, nodeRotation } = opts
    const [minR, maxR] = Array.isArray(nodeSize) ? nodeSize : [nodeSize, nodeSize]

    let positions = null
    if (opts.layout) {
      const fns = Array.isArray(opts.layout) ? opts.layout : [opts.layout]
      positions = fns.flatMap(fn => fn(width, height))
    }

    const count = positions ? positions.length : opts.nodeCount

    const rawNodes = Array.from({ length: count }, (_, i) => {
      const pos = positions ? positions[i] : spawnPosition(nodeSpawnRegion, width, height)
      const r = Math.max(0, this._sampleNodeRadius(minR, maxR))
      const node = new Node({
        x: pos.x,
        y: pos.y,
        r,
        vx: 0,
        vy: 0,
        color: colors.length ? colors[Math.floor(Math.random() * colors.length)] : '#ffffff',
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: rand(0.001, 0.003),
      })
      node._index = i
      if (nodeRotation) {
        node.angle = 0
        node.angularVelocity = rand(-0.02, 0.02)
      }
      return node
    })

    this._applyColors(rawNodes)

    this.nodes = rawNodes
  }

  _applyColors(nodes) {
    const { colors, nodeColorMode } = this.options
    const width = this._logicalWidth ?? this.canvas.width
    const height = this._logicalHeight ?? this.canvas.height

    if (nodeColorMode === 'by-size') {
      const sorted = [...nodes].sort((a, b) => a.r - b.r)
      sorted.forEach((node, idx) => {
        const t = sorted.length === 1 ? 0 : idx / (sorted.length - 1)
        const colorIdx = Math.min(Math.floor(t * colors.length), colors.length - 1)
        node.color = colors[colorIdx]
      })
    } else if (nodeColorMode === 'sequential') {
      nodes.forEach((node, i) => {
        node.color = colors[i % colors.length]
      })
    } else if (nodeColorMode === 'gradient') {
      nodes.forEach(node => {
        node.color = lerpColor(colors, node.x / width)
      })
    } else if (nodeColorMode === 'by-position') {
      nodes.forEach(node => {
        node.color = lerpColor(colors, (node.x / width + node.y / height) / 2)
      })
    } else {
      nodes.forEach(node => {
        node.color = colors.length ? colors[Math.floor(Math.random() * colors.length)] : '#ffffff'
      })
    }
  }

  _resize() {
    const prevWidth = this._logicalWidth
    const prevHeight = this._logicalHeight

    if (!this.options.autoResize) {
      this._dpr = 1
      this._logicalWidth = this.canvas.width
      this._logicalHeight = this.canvas.height
      this._viewportHeight = this.canvas.height
    } else {
      const dpr = this.options.pixelRatio === 'auto' ? (window.devicePixelRatio ?? 1) : this.options.pixelRatio
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Backing store covers only the viewport; the world spans the whole
      // document and _loop translates by scrollY. The canvas must be styled
      // position: fixed; top: 0; left: 0.
      this.canvas.width = viewportWidth * dpr
      this.canvas.height = viewportHeight * dpr
      this.canvas.style.width = viewportWidth + 'px'
      this.canvas.style.height = viewportHeight + 'px'

      this._dpr = dpr
      this._logicalWidth = viewportWidth
      this._logicalHeight = document.documentElement.scrollHeight
      this._viewportHeight = viewportHeight
    }

    if (this.nodes.length === 0 || this.options.layout) {
      this._createNodes()
    } else if (prevWidth !== this._logicalWidth || prevHeight !== this._logicalHeight) {
      this._rescaleNodes(prevWidth, prevHeight)
    }
  }

  _rescaleNodes(oldWidth, oldHeight) {
    if (!oldWidth || !oldHeight) return
    const sx = this._logicalWidth / oldWidth
    const sy = this._logicalHeight / oldHeight
    for (const node of this.nodes) {
      node.x *= sx
      node.y *= sy
    }
  }

  _onResize() {
    clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(() => this._resize(), 150)
  }

  _onMouseMove(e) {
    let mx, my
    if (this.options.autoResize) {
      mx = e.clientX
      my = e.clientY + window.scrollY
    } else {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      mx = (e.clientX - rect.left) * scaleX
      my = (e.clientY - rect.top) * scaleY
    }
    this.mouse = { x: mx, y: my }

    const { onNodeHover, onNodeLeave } = this.options
    if (!onNodeHover && !onNodeLeave) return

    let found = null
    for (const node of this.nodes) {
      if (Math.hypot(node.x - mx, node.y - my) < node.r * 3) {
        found = node
        break
      }
    }

    if (found !== this._hoveredNode) {
      if (this._hoveredNode && onNodeLeave) onNodeLeave(this._hoveredNode)
      if (found && onNodeHover) onNodeHover(found)
      this._hoveredNode = found
    }
  }

  _onScroll() {
    this.scrollY = window.scrollY
  }

  _maybeResume() {
    if (!this._started || this._pausedHidden || this._pausedOffscreen) return
    if (this.raf === null) {
      this._lastTime = null
      this.raf = requestAnimationFrame(this._loop)
    }
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this._pausedHidden = true
      cancelAnimationFrame(this.raf)
      this.raf = null
    } else {
      this._pausedHidden = false
      this._maybeResume()
    }
  }

  _onClick(e) {
    const { onNodeClick } = this.options
    if (!onNodeClick) return
    let mx, my
    if (this.options.autoResize) {
      mx = e.clientX
      my = e.clientY + window.scrollY
    } else {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      mx = (e.clientX - rect.left) * scaleX
      my = (e.clientY - rect.top) * scaleY
    }
    for (const node of this.nodes) {
      if (Math.hypot(node.x - mx, node.y - my) < node.r * 3) {
        onNodeClick(node)
        break
      }
    }
  }

  resize() {
    this._resize()
  }

  update(newOptions) {
    const prev = {
      onNodeClick: this.options.onNodeClick,
      pauseWhenHidden: this.options.pauseWhenHidden,
      pauseWhenOffscreen: this.options.pauseWhenOffscreen,
      autoResize: this.options.autoResize,
      pixelRatio: this.options.pixelRatio,
    }

    const { forces: newForces, canvas: _canvas, ...rest } = newOptions

    const prevVals = {}
    for (const key of NODE_REBUILD_KEYS) prevVals[key] = this.options[key]
    const prevColors = this.options.colors
    const prevColorMode = this.options.nodeColorMode

    assignOptions(this.options, rest)

    if (rest.colors && !rest.edgeColors && !this._edgeColorsExplicit) {
      this.options.edgeColors = rest.colors
    }
    if (rest.edgeColors) {
      this._edgeColorsExplicit = true
    }
    if (!this.options.edgeColors) {
      this.options.edgeColors = this.options.colors
      this._edgeColorsExplicit = false
    }

    if (newForces !== undefined && !sameForces(this.forces, newForces)) {
      this.forces = newForces
    }

    if (NODE_REBUILD_KEYS.some(key => !sameValue(prevVals[key], this.options[key]))) {
      this._createNodes()
    } else if (!sameValue(prevColors, this.options.colors) || prevColorMode !== this.options.nodeColorMode) {
      this._applyColors(this.nodes)
    }

    if (this._started) this._syncListeners(prev)
  }

  _observeCanvas() {
    this._io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this._pausedOffscreen = false
          this._maybeResume()
        } else {
          this._pausedOffscreen = true
          cancelAnimationFrame(this.raf)
          this.raf = null
        }
      }
    }, { threshold: 0 })
    this._io.observe(this.canvas)
  }

  _syncListeners(prev) {
    const opts = this.options

    if (!prev.onNodeClick && opts.onNodeClick) {
      window.addEventListener('click', this._onClick)
    } else if (prev.onNodeClick && !opts.onNodeClick) {
      window.removeEventListener('click', this._onClick)
    }

    if (!prev.pauseWhenHidden && opts.pauseWhenHidden) {
      document.addEventListener('visibilitychange', this._onVisibilityChange)
    } else if (prev.pauseWhenHidden && !opts.pauseWhenHidden) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange)
      this._pausedHidden = false
      this._maybeResume()
    }

    if (!prev.pauseWhenOffscreen && opts.pauseWhenOffscreen) {
      this._observeCanvas()
    } else if (prev.pauseWhenOffscreen && !opts.pauseWhenOffscreen) {
      if (this._io) { this._io.disconnect(); this._io = null }
      this._pausedOffscreen = false
      this._maybeResume()
    }

    if (prev.autoResize !== opts.autoResize) {
      if (opts.autoResize) {
        this.scrollY = window.scrollY
        window.addEventListener('resize', this._onResize)
        window.addEventListener('scroll', this._onScroll, { passive: true })
      } else {
        window.removeEventListener('resize', this._onResize)
        window.removeEventListener('scroll', this._onScroll)
        clearTimeout(this._resizeTimer)
        this._resizeTimer = null
      }
      this._resize()
    } else if (prev.pixelRatio !== opts.pixelRatio && opts.autoResize) {
      this._resize()
    }
  }

  _resolveEdgeColor(a, b, i, j, edgeColors) {
    const mode = this.options.edgeColorMode
    if (typeof mode === 'function') return mode(a, b, i, j)
    if (mode === 'source') return a.color
    if (mode === 'target') return b.color
    return edgeColors[(i + j) % edgeColors.length]
  }

  _drawEdge(ctx, a, b, i, j, opts, edgeCounts) {
    const { edgeMaxDist, edgeMaxOpacity, edgeWidth, edgeColors, edgeStyle, edgeCurvature } = opts
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (dist >= edgeMaxDist) return false

    const opacity = edgeMaxDist === Infinity ? edgeMaxOpacity : (1 - dist / edgeMaxDist) * edgeMaxOpacity
    const color = this._resolveEdgeColor(a, b, i, j, edgeColors)

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)

    if (edgeCurvature !== 0) {
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const dx = b.x - a.x
      const dy = b.y - a.y
      const perpX = -dy
      const perpY = dx
      const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1
      const offset = dist * edgeCurvature * 0.5
      ctx.quadraticCurveTo(mx + (perpX / len) * offset, my + (perpY / len) * offset, b.x, b.y)
    } else {
      ctx.lineTo(b.x, b.y)
    }

    if (edgeStyle === 'gradient') {
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
      grad.addColorStop(0, a.color)
      grad.addColorStop(1, b.color)
      ctx.strokeStyle = grad
    } else {
      ctx.strokeStyle = color
    }

    ctx.globalAlpha = opacity
    ctx.lineWidth = edgeWidth
    ctx.stroke()

    if (edgeCounts) {
      edgeCounts[i]++
      edgeCounts[j]++
    }
    return true
  }

  _drawEdges(ctx, nodes, opts, width, height) {
    if (opts.edgeStyle === 'dashed') ctx.setLineDash([4, 6])

    if (Array.isArray(opts.edges)) {
      // Infinity collapses the fade formula to flat edgeMaxOpacity for all pairs
      const edgeOpts = { ...opts, edgeMaxDist: Infinity }
      for (const [i, j] of opts.edges) {
        const a = nodes[i], b = nodes[j]
        if (!a || !b) continue
        this._drawEdge(ctx, a, b, i, j, edgeOpts, null)
      }
    } else {
      const { edgeMaxDist, maxEdgesPerNode, minEdgesPerNode, maxEdgesPerFrame, spatialIndex } = opts
      const needsCounts = maxEdgesPerNode !== null || minEdgesPerNode !== null
      const edgeCounts = needsCounts ? new Int32Array(nodes.length) : null
      let totalEdges = 0
      let mainPassComplete = true

      let qt = null
      mainPass: {
        if (spatialIndex) {
          qt = new QuadTree(-1, -1, width + 2, height + 2)
          for (const node of nodes) qt.insert(node)

          for (let i = 0; i < nodes.length; i++) {
            if (maxEdgesPerFrame !== null && totalEdges >= maxEdgesPerFrame) { mainPassComplete = false; break mainPass }
            if (edgeCounts && maxEdgesPerNode !== null && edgeCounts[i] >= maxEdgesPerNode) continue
            const a = nodes[i]
            const candidates = qt.queryRadius(a.x, a.y, edgeMaxDist)
            for (const b of candidates) {
              const j = b._index
              if (j <= i) continue
              if (maxEdgesPerFrame !== null && totalEdges >= maxEdgesPerFrame) { mainPassComplete = false; break mainPass }
              if (edgeCounts && maxEdgesPerNode !== null && (edgeCounts[i] >= maxEdgesPerNode || edgeCounts[j] >= maxEdgesPerNode)) continue
              if (this._drawEdge(ctx, a, b, i, j, opts, edgeCounts)) totalEdges++
            }
          }
        } else {
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              if (maxEdgesPerFrame !== null && totalEdges >= maxEdgesPerFrame) { mainPassComplete = false; break mainPass }
              if (edgeCounts && maxEdgesPerNode !== null && (edgeCounts[i] >= maxEdgesPerNode || edgeCounts[j] >= maxEdgesPerNode)) continue
              if (this._drawEdge(ctx, nodes[i], nodes[j], i, j, opts, edgeCounts)) totalEdges++
            }
          }
        }
      }

      // Minimum edges pass: for nodes with too few connections, draw to nearest neighbors
      if (minEdgesPerNode !== null) {
        const fallbackDist = edgeMaxDist * 3
        const fallbackOpts = { ...opts, edgeMaxDist: fallbackDist, edgeMaxOpacity: opts.edgeMaxOpacity * 0.5 }
        fallbackPass: for (let i = 0; i < nodes.length; i++) {
          if (edgeCounts[i] >= minEdgesPerNode) continue
          const a = nodes[i]
          const candidates = qt ? qt.queryRadius(a.x, a.y, fallbackDist) : nodes

          // bounded selection: keep only the k nearest eligible neighbors,
          // k = remaining deficit — no full sort over all nodes
          const k = minEdgesPerNode - edgeCounts[i]
          const nearest = [] // [j, dist], ascending, length <= k
          for (let ci = 0; ci < candidates.length; ci++) {
            const c = candidates[ci]
            const j = qt ? c._index : ci
            if (j === i) continue
            const dist = Math.hypot(a.x - c.x, a.y - c.y)
            if (dist >= fallbackDist) continue
            if (mainPassComplete && dist < edgeMaxDist) continue // already handled in main pass
            if (maxEdgesPerNode !== null && edgeCounts[j] >= maxEdgesPerNode) continue
            // ties break by node index so the edge set matches the brute-force
            // order regardless of the QuadTree's traversal order
            let pos = nearest.length
            while (pos > 0 && (nearest[pos - 1][1] > dist || (nearest[pos - 1][1] === dist && nearest[pos - 1][0] > j))) pos--
            if (pos < k) {
              nearest.splice(pos, 0, [j, dist])
              if (nearest.length > k) nearest.pop()
            }
          }

          for (const [j] of nearest) {
            if (edgeCounts[i] >= minEdgesPerNode) break
            if (maxEdgesPerFrame !== null && totalEdges >= maxEdgesPerFrame) break fallbackPass
            if (this._drawEdge(ctx, a, nodes[j], i, j, fallbackOpts, edgeCounts)) totalEdges++
          }
        }
      }
    }

    if (opts.edgeStyle === 'dashed') ctx.setLineDash([])
  }

  _drawNodes(ctx, nodes, opts, width, height) {
    const drawShape = resolveShape(opts.nodeShape)
    const fadeZone = 40

    for (const node of nodes) {
      const edgeFade = Math.min(
        node.x / fadeZone,
        (width - node.x) / fadeZone,
        node.y / fadeZone,
        (height - node.y) / fadeZone,
        1
      )
      const alpha = (node.brightness ?? 1) * edgeFade
      let shape = drawShape
      if (node.shape) {
        if (node._shapeKey !== node.shape) {
          node._shapeKey = node.shape
          node._resolvedShape = resolveShape(node.shape)
        }
        shape = node._resolvedShape
      }

      if (opts.glowOnLargeNodes && node.r > opts.glowThreshold) {
        const haloR = node.r * opts.glowScale
        if (haloR > 0) {
          const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloR)
          grd.addColorStop(0, node.color)
          grd.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(node.x, node.y, haloR, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.globalAlpha = alpha * opts.glowOpacity
          ctx.fill()
        }
      }

      ctx.globalAlpha = alpha
      ctx.fillStyle = node.color

      if (opts.nodeRotation && node.angle !== undefined) {
        ctx.save()
        ctx.translate(node.x, node.y)
        ctx.rotate(node.angle)
        shape(ctx, 0, 0, node.r)
        ctx.restore()
      } else {
        shape(ctx, node.x, node.y, node.r)
      }
    }
  }

  _loop(time) {
    if (!this._started) return

    const { canvas, ctx, nodes, forces } = this
    const width = this._logicalWidth ?? canvas.width
    const height = this._logicalHeight ?? canvas.height
    const opts = this.options

    const last = this._lastTime
    this._lastTime = time
    const dtMs = last === null ? FRAME_MS : Math.min(Math.max(time - last, 0), MAX_FRAME_MS)
    const dt = dtMs / FRAME_MS

    const context = Object.freeze({ time, dt, mouse: this.mouse, scrollY: this.scrollY, width, height })

    for (const force of forces) force(nodes, context)

    for (const node of nodes) {
      node.x += node.vx * dt
      node.y += node.vy * dt
      if (node.x < 0) node.x += width
      if (node.x > width) node.x -= width
      if (node.y < 0) node.y += height
      if (node.y > height) node.y -= height

      if (opts.nodeRotation && node.angle !== undefined) {
        node.angle += node.angularVelocity * dt
      }
    }

    const dpr = this._dpr ?? 1
    const scrollOffset = opts.autoResize ? this.scrollY : 0
    const viewportHeight = this._viewportHeight ?? height

    // world space -> device space: scale by dpr, shift the visible slice up
    ctx.setTransform(dpr, 0, 0, dpr, 0, -scrollOffset * dpr)
    ctx.globalCompositeOperation = opts.blendMode
    ctx.clearRect(0, scrollOffset, width, viewportHeight)

    if (opts.background) {
      ctx.globalAlpha = 1
      ctx.fillStyle = opts.background
      ctx.fillRect(0, scrollOffset, width, viewportHeight)
    }

    if (opts.renderOrder === 'nodes-first') {
      this._drawNodes(ctx, nodes, opts, width, height)
      this._drawEdges(ctx, nodes, opts, width, height)
    } else {
      this._drawEdges(ctx, nodes, opts, width, height)
      this._drawNodes(ctx, nodes, opts, width, height)
    }

    ctx.globalAlpha = 1

    if (opts.onFrame) opts.onFrame(nodes, context)

    if (this._started) this.raf = requestAnimationFrame(this._loop)
  }

  start() {
    if (this._started) return
    this._started = true
    this._pausedHidden = false
    this._pausedOffscreen = false
    this._lastTime = null
    if (this.options.autoResize) this.scrollY = window.scrollY
    this._resize()
    if (this.options.autoResize) {
      window.addEventListener('resize', this._onResize)
      window.addEventListener('scroll', this._onScroll, { passive: true })
    }
    window.addEventListener('mousemove', this._onMouseMove)
    if (this.options.pauseWhenHidden) {
      document.addEventListener('visibilitychange', this._onVisibilityChange)
    }
    if (this.options.onNodeClick) {
      window.addEventListener('click', this._onClick)
    }
    if (this.options.pauseWhenOffscreen) {
      this._observeCanvas()
    } else {
      this.raf = requestAnimationFrame(this._loop)
    }
  }

  stop() {
    this._started = false
    cancelAnimationFrame(this.raf)
    this.raf = null
    clearTimeout(this._resizeTimer)
    this._resizeTimer = null
    if (this._io) { this._io.disconnect(); this._io = null }
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('scroll', this._onScroll)
    document.removeEventListener('visibilitychange', this._onVisibilityChange)
    window.removeEventListener('click', this._onClick)
  }
}
