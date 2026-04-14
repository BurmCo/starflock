# starflock

[![npm](https://img.shields.io/npm/v/starflock)](https://www.npmjs.com/package/starflock)

Lightweight, zero-dependency canvas particle library. Composable forces, configurable everything.

```
npm install starflock
```

---

## Quick start

```js
import { World, drift, dampen, twinkle, mouseRepel } from 'starflock'

const world = new World({
  canvas: document.getElementById('bg'),
  nodeCount: 60,
  colors: ['#ffffff', '#cce8ff'],
  forces: [twinkle(), mouseRepel(), dampen(), drift()],
})

world.start()
```

**Forces are just functions** — compose them in any order, pass as an array. Each force runs every frame and mutates node velocities.

---

## Recipes

### Full-screen background

```js
const world = new World({
  canvas,
  autoResize: true,
  pauseWhenHidden: true,
  pauseWhenOffscreen: true,
  nodeCount: 60,
  colors: ['#ffffff', '#cce8ff', '#fff4e0'],
  edgeMaxDist: 180,
  forces: [twinkle(), mouseRepel(), dampen(), drift()],
})
world.start()
```

### Constellation with predefined edges

```js
import { World, layouts, twinkle, dampen, mouseRepel } from 'starflock'

new World({
  canvas,
  layout: layouts.constellation('orion'),
  edges:  layouts.constellationEdges('orion'),
  colors: ['#ffffff', '#aad4ff', '#ffd2aa'],
  nodeSize: [1.5, 3.5],
  edgeMaxOpacity: 0.55,
  forces: [twinkle(), dampen(), mouseRepel()],
}).start()
```

### Preset — one-liner

```js
import { World, presets, twinkle, dampen, mouseRepel } from 'starflock'

new World({
  canvas,
  ...presets.orion(),
  forces: [twinkle(), dampen(), mouseRepel()],
}).start()
```

### React

```jsx
import { useStarflock } from 'starflock/react'
import { drift, dampen, twinkle, mouseRepel } from 'starflock'

export default function Background() {
  const ref = useStarflock({
    nodeCount: 60,
    colors: ['#ffffff', '#cce8ff'],
    forces: [twinkle(), mouseRepel(), dampen(), drift()],
  })

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }} />
}
```

---

## World options

### Nodes

| Option | Type | Default | Description |
|---|---|---|---|
| `nodeCount` | `number` | `60` | Number of nodes — ignored when `layout` is set |
| `nodeSize` | `[min, max]` | `[0.8, 2.8]` | Radius range in px |
| `colors` | `string[]` | `['#ffffff']` | Node colors |
| `nodeShape` | `'circle' \| 'diamond' \| 'star' \| 'cross' \| 'ring'` | `'circle'` | Node shape |
| `nodeRotation` | `boolean` | `false` | Nodes rotate on their axis — visible on diamond/star |
| `nodeSizeDistribution` | `'uniform' \| 'gaussian' \| 'weighted-small'` | `'uniform'` | Size sampling distribution |
| `nodeColorMode` | `'random' \| 'by-size' \| 'sequential' \| 'gradient' \| 'by-position'` | `'random'` | How colors are assigned |
| `nodeSpawnRegion` | `'full' \| 'center' \| 'edges' \| fn` | `'full'` | Where nodes spawn. `fn(width, height) => {x, y}` for custom regions |
| `layout` | `Layout \| Layout[]` | — | Deterministic node placement — overrides `nodeCount` and `nodeSpawnRegion` |

### Edges

| Option | Type | Default | Description |
|---|---|---|---|
| `edges` | `Array<[number, number]> \| null` | `null` | Predefined index pairs — when set, only these connections are drawn |
| `edgeMaxDist` | `number` | `180` | Max distance for edge to appear — ignored when `edges` is set |
| `edgeMaxOpacity` | `number` | `0.18` | Max edge opacity |
| `edgeWidth` | `number` | `0.5` | Edge stroke width in px |
| `edgeColors` | `string[]` | `null` | Edge colors — falls back to `colors` if not set |
| `edgeStyle` | `'solid' \| 'dashed' \| 'gradient'` | `'solid'` | `gradient` interpolates between connected node colors |
| `edgeColorMode` | `'alternate' \| 'source' \| 'target' \| fn` | `'alternate'` | `fn(a, b, i, j) => color` for custom logic |
| `edgeCurvature` | `number` | `0` | `0` = straight, `1` = strong bezier curve |
| `maxEdgesPerNode` | `number \| null` | `null` | Cap connections per node — prevents dense clusters |
| `minEdgesPerNode` | `number \| null` | `null` | Guarantee minimum connections — draws faint long-range edges as fallback |

### Glow

| Option | Type | Default | Description |
|---|---|---|---|
| `glowOnLargeNodes` | `boolean` | `true` | Adds radial halo to nodes above threshold |
| `glowThreshold` | `number` | `2` | Minimum radius to trigger glow |
| `glowScale` | `number` | `4` | Halo radius multiplier |
| `glowOpacity` | `number` | `0.25` | Halo opacity |

### Rendering

| Option | Type | Default | Description |
|---|---|---|---|
| `blendMode` | `string` | `'source-over'` | Canvas `globalCompositeOperation` — `'screen'` makes overlapping nodes glow brighter |
| `renderOrder` | `'edges-first' \| 'nodes-first'` | `'edges-first'` | Draw order |
| `background` | `string \| null` | `null` | Background fill color — `null` for transparent |
| `pixelRatio` | `number \| 'auto'` | `'auto'` | HiDPI/Retina pixel ratio |

### Performance

| Option | Type | Default | Description |
|---|---|---|---|
| `pauseWhenHidden` | `boolean` | `true` | Pause RAF when tab is not visible |
| `pauseWhenOffscreen` | `boolean` | `false` | Pause RAF when canvas is scrolled out of view |
| `autoResize` | `boolean` | `true` | Fit canvas to window on resize — set to `false` when managing canvas size yourself |
| `maxEdgesPerFrame` | `number \| null` | `null` | Hard cap on edges drawn per frame — useful for very high node counts |
| `spatialIndex` | `boolean` | `false` | Use a QuadTree for edge queries — O(n log n) instead of O(n²), worth enabling above ~200 nodes |

### Callbacks

| Option | Type | Description |
|---|---|---|
| `onFrame` | `(nodes, context) => void` | Called every frame after rendering |
| `onNodeHover` | `(node) => void` | Called when cursor enters a node's hitbox |
| `onNodeLeave` | `(node) => void` | Called when cursor leaves a node's hitbox |
| `onNodeClick` | `(node) => void` | Called when a node is clicked |

---

## Layouts & Presets

A `Layout` is a function `(width, height) => Array<{x, y}>` that returns deterministic node positions. Pass one or an array to combine multiple layouts.

### `layouts.ring(opts?)`

Places nodes evenly on a circle.

| Param | Default | |
|---|---|---|
| `count` | `48` | Number of nodes |
| `radius` | `0.38` | Radius relative to `Math.min(width, height)` |
| `cx` | `0.5` | Center x, relative to width |
| `cy` | `0.5` | Center y, relative to height |

### `layouts.constellation(name, opts?)`

Places nodes at named star positions. Coordinates are scaled to the canvas.

**Available names:** `'orion'` · `'big-dipper'` · `'cassiopeia'` · `'crux'` · `'cygnus'` · `'leo'`

| Param | Default | |
|---|---|---|
| `scale` | `0.7` | Size relative to `Math.min(width, height)` |
| `cx` | `0.5` | Center x, relative to width |
| `cy` | `0.5` | Center y, relative to height |

### `layouts.constellationEdges(name)`

Returns the predefined edge pairs for a constellation — index pairs into the node array produced by `layouts.constellation(name)`.

```js
new World({
  canvas,
  layout: layouts.constellation('cassiopeia'),
  edges:  layouts.constellationEdges('cassiopeia'),
  ...
})
```

### Combining layouts

Pass an array of layouts to merge multiple constellations. Offset the edge indices by the cumulative node count of previous layouts:

```js
const orionEdges  = layouts.constellationEdges('orion')
const dipperEdges = layouts.constellationEdges('big-dipper').map(([i, j]) => [i + 7, j + 7])

new World({
  canvas,
  layout: [
    layouts.constellation('orion',      { cx: 0.3 }),
    layouts.constellation('big-dipper', { cx: 0.7 }),
  ],
  edges: [...orionEdges, ...dipperEdges],
  ...
})
```

### Custom layouts

Any function `(width, height) => Array<{x, y}>` works:

```js
function circle(count = 40) {
  return (width, height) => Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    return {
      x: width  / 2 + Math.cos(angle) * width  * 0.35,
      y: height / 2 + Math.sin(angle) * height * 0.35,
    }
  })
}

new World({ canvas, layout: circle(40), forces: [twinkle(), dampen()] }).start()
```

### Presets

Presets are plain objects — spread them into the constructor and override anything:

```js
import { presets } from 'starflock'

presets.orion()      // layout + edges + colors for Orion
presets.bigDipper()  // layout + edges + colors for the Big Dipper

// override individual options
new World({ canvas, ...presets.orion(), edgeMaxOpacity: 0.8 }).start()
```

---

## Forces

Forces are plain functions — `(nodes, context) => void`. The `context` object provides `{ time, mouse, scrollY, width, height }`. Combine freely.

### `drift({ maxSpeed })`
Caps node velocity — prevents runaway acceleration. Use as the last force in your chain.

| Param | Default | |
|---|---|---|
| `maxSpeed` | `0.08` | Maximum speed in px/frame |

### `dampen({ factor })`
Multiplies all velocities by `factor` each frame — simulates friction.

| Param | Default | |
|---|---|---|
| `factor` | `0.99` | `0.95` = heavy friction, `0.999` = near frictionless |

### `twinkle({ minBrightness, variance })`
Oscillates node opacity using a per-node sine wave.

| Param | Default | |
|---|---|---|
| `minBrightness` | `0.5` | Minimum alpha |
| `variance` | `0.5` | Oscillation amplitude |

### `mouseRepel({ mode, radius, strength, fn })`
Cursor interaction.

| Param | Default | |
|---|---|---|
| `mode` | `'repel'` | `'repel'` · `'attract'` · `'orbit'` · `'custom'` |
| `radius` | `120` | Influence radius in px |
| `strength` | `0.012` | Force multiplier |
| `fn` | — | `fn(node, mouse, context)` when `mode: 'custom'` |

### `gravity({ x, y, strength })`
Pulls all nodes toward a fixed point. Values `0..1` are relative to canvas size.

| Param | Default | |
|---|---|---|
| `x` | `0.5` | Target x — `0.5` = center |
| `y` | `0.5` | Target y |
| `strength` | `0.0002` | Force magnitude |

### `attract({ x, y, radius, strength })`
Like gravity but only affects nodes within `radius`. Has a dead zone at the center — combine with `nodeRepel` to prevent clustering.

| Param | Default | |
|---|---|---|
| `x` | `0.5` | Target x |
| `y` | `0.5` | Target y |
| `radius` | `200` | Influence radius in px |
| `strength` | `0.001` | Force magnitude |

### `nodeRepel({ radius, strength })`
Nodes push each other away — simulates charged particles. O(n²), keep `radius` small.

| Param | Default | |
|---|---|---|
| `radius` | `60` | Repulsion radius |
| `strength` | `0.003` | Force magnitude |

### `wind({ angle, strength, gust })`
Constant directional force with optional sinusoidal gusting.

| Param | Default | |
|---|---|---|
| `angle` | `0` | Direction in radians |
| `strength` | `0.001` | Base force magnitude |
| `gust` | `0` | Gust amplitude |

### `noise({ scale, strength, speed })`
Moves nodes along a slowly shifting 2D vector field. Nearby nodes flow in the same direction — organic, non-random.

| Param | Default | |
|---|---|---|
| `scale` | `0.004` | Field scale — small = broad sweeping currents |
| `strength` | `0.001` | Force magnitude |
| `speed` | `0.0003` | How fast the field shifts over time |

### `scrollDrift({ mode, strength })`
Reacts to `world.scrollY`. In `autoResize` mode this tracks `window.scrollY` automatically.

| Param | Default | |
|---|---|---|
| `mode` | `'rotate'` | `'rotate'` · `'wave'` · `'scatter'` · `'custom'` |
| `strength` | `1.0` | Effect multiplier |
| `fn` | — | `fn(node, delta, context)` when `mode: 'custom'` |

---

## Custom forces

Any function matching `(nodes, context) => void` works as a force:

```js
function pulse() {
  return (nodes, { time }) => {
    const scale = Math.sin(time * 0.001)
    for (const node of nodes) {
      node.vx += (node.x - 400) * scale * 0.0001
      node.vy += (node.y - 300) * scale * 0.0001
    }
  }
}

new World({ canvas, forces: [pulse(), dampen(), drift()] })
```

---

## Shapes

`circle` · `diamond` · `star` · `cross` · `ring`

Custom shape function: `(ctx, x, y, r) => void`

```js
import { World } from 'starflock'

function triangle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y + r)
  ctx.lineTo(x - r, y + r)
  ctx.closePath()
  ctx.fill()
}

new World({ canvas, nodeShape: triangle })
```

---

## API

### `world.start()`
Begins the render loop and registers event listeners.

### `world.stop()`
Cancels the render loop and removes all event listeners.

### `world.update(options)`
Live-updates any option without restarting. Node positions and velocities are preserved.

```js
world.update({ colors: ['#ff0000'], edgeMaxOpacity: 0.4 })
```

### `world.resize()`
Recomputes canvas dimensions and recreates nodes. Call this when managing canvas size manually (`autoResize: false`).

### `world.scrollY`
Set directly when managing scroll manually (e.g. in a bounded canvas):
```js
window.addEventListener('scroll', () => { world.scrollY = window.scrollY })
```
