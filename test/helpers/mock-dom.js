export function createMockContext() {
  const calls = []
  const record = (method) => (...args) => { calls.push({ method, args }) }
  const gradient = () => ({
    addColorStop(offset, color) {
      // real browsers reject unparseable colors — emulate for rgb(NaN,…) bugs
      if (String(color).includes('NaN')) throw new SyntaxError(`invalid color: ${color}`)
    },
  })
  const ctx = { calls }
  for (const m of [
    'beginPath', 'arc', 'fill', 'stroke', 'moveTo', 'lineTo', 'quadraticCurveTo',
    'closePath', 'rect', 'save', 'restore', 'translate', 'rotate', 'setTransform',
    'clearRect', 'fillRect', 'setLineDash', 'drawImage',
  ]) ctx[m] = record(m)
  ctx.createLinearGradient = (...args) => { calls.push({ method: 'createLinearGradient', args }); return gradient() }
  ctx.createRadialGradient = (...args) => { calls.push({ method: 'createRadialGradient', args }); return gradient() }
  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.globalAlpha = 1
  ctx.lineWidth = 1
  ctx.globalCompositeOperation = 'source-over'
  return ctx
}

export function createMockCanvas({ width = 800, height = 600 } = {}) {
  const ctx = createMockContext()
  return {
    width,
    height,
    style: {},
    ctx,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
  }
}

export function installDom({ innerWidth = 1024, innerHeight = 768, scrollHeight = 3000, scrollY = 0, dpr = 1 } = {}) {
  const listeners = new Map() // 'window:resize' -> Set<fn>
  const key = (target, type) => `${target}:${type}`
  const addFor = (target) => (type, fn) => {
    const k = key(target, type)
    if (!listeners.has(k)) listeners.set(k, new Set())
    listeners.get(k).add(fn)
  }
  const removeFor = (target) => (type, fn) => {
    listeners.get(key(target, type))?.delete(fn)
  }

  let rafQueue = []
  let rafId = 0

  const win = {
    innerWidth,
    innerHeight,
    scrollY,
    devicePixelRatio: dpr,
    addEventListener: addFor('window'),
    removeEventListener: removeFor('window'),
  }
  const doc = {
    hidden: false,
    documentElement: { scrollHeight },
    addEventListener: addFor('document'),
    removeEventListener: removeFor('document'),
    createElement: () => createMockCanvas(),
  }

  const ioInstances = []
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback
      this.observed = []
      ioInstances.push(this)
    }
    observe(el) { this.observed.push(el) }
    disconnect() { this.observed = [] }
  }

  globalThis.window = win
  globalThis.document = doc
  globalThis.requestAnimationFrame = (fn) => { rafQueue.push({ id: ++rafId, fn }); return rafId }
  globalThis.cancelAnimationFrame = (id) => { rafQueue = rafQueue.filter(entry => entry.id !== id) }
  globalThis.IntersectionObserver = MockIntersectionObserver

  return {
    win,
    doc,
    flushRaf(time = 0) {
      const queue = rafQueue
      rafQueue = []
      for (const { fn } of queue) fn(time)
    },
    pendingRafCount() {
      return rafQueue.length
    },
    fire(target, type, event = {}) {
      for (const fn of listeners.get(key(target, type)) ?? []) fn(event)
    },
    listenerCount(target, type) {
      return listeners.get(key(target, type))?.size ?? 0
    },
    io: {
      instances: ioInstances,
      trigger(instance, isIntersecting) {
        instance.callback([{ isIntersecting, target: instance.observed[0] }])
      },
    },
    uninstall() {
      delete globalThis.window
      delete globalThis.document
      delete globalThis.requestAnimationFrame
      delete globalThis.cancelAnimationFrame
      delete globalThis.IntersectionObserver
    },
  }
}
