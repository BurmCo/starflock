/**
 * constellation — places nodes at named star positions
 *
 * name:  'orion' | 'big-dipper'
 * scale: size relative to Math.min(width, height), 0..1 (default 0.7)
 * cx:    horizontal center, relative to width (default 0.5)
 * cy:    vertical center, relative to height (default 0.5)
 */

const STARS = {
  'orion': [
    [0.28, 0.22],  // Betelgeuse  (left shoulder)
    [0.68, 0.18],  // Bellatrix   (right shoulder)
    [0.35, 0.52],  // Mintaka     (belt left)
    [0.50, 0.54],  // Alnilam     (belt center)
    [0.65, 0.56],  // Alnitak     (belt right)
    [0.30, 0.82],  // Saiph       (left foot)
    [0.78, 0.78],  // Rigel       (right foot)
  ],
  'big-dipper': [
    [0.68, 0.18],  // Dubhe  (bowl top-right)
    [0.72, 0.38],  // Merak  (bowl bottom-right)
    [0.50, 0.44],  // Phecda (bowl bottom-left)
    [0.44, 0.24],  // Megrez (bowl top-left / handle start)
    [0.28, 0.34],  // Alioth (handle 1)
    [0.14, 0.50],  // Mizar  (handle 2)
    [0.04, 0.70],  // Alkaid (handle end)
  ],
}

export function constellation(name, { scale = 0.7, cx = 0.5, cy = 0.5 } = {}) {
  const stars = STARS[name]
  if (!stars) throw new Error(`starflock: unknown constellation "${name}"`)

  return (width, height) => {
    const s = scale * Math.min(width, height)
    return stars.map(([nx, ny]) => ({
      x: cx * width  + (nx - 0.5) * s,
      y: cy * height + (ny - 0.5) * s,
    }))
  }
}
