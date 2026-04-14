/**
 * constellation — places nodes at named star positions
 *
 * name:  'orion' | 'big-dipper' | 'cassiopeia' | 'crux' | 'cygnus' | 'leo'
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
  'cassiopeia': [
    [0.10, 0.55],  // Caph     (far left)
    [0.28, 0.28],  // Shedar   (second, high)
    [0.50, 0.55],  // Gamma    (middle)
    [0.72, 0.28],  // Ruchbah  (fourth, high)
    [0.90, 0.55],  // Segin    (far right)
  ],
  'crux': [
    [0.50, 0.12],  // Gamma Crucis (top)
    [0.88, 0.50],  // Mimosa       (right)
    [0.50, 0.88],  // Acrux        (bottom)
    [0.12, 0.50],  // Delta Crucis (left)
  ],
  'cygnus': [
    [0.50, 0.10],  // Deneb   (top of vertical)
    [0.50, 0.50],  // Sadr    (center)
    [0.50, 0.90],  // Albireo (bottom of vertical)
    [0.12, 0.50],  // Gienah  (left wing)
    [0.88, 0.50],  // Delta   (right wing)
  ],
  'leo': [
    [0.18, 0.72],  // Regulus  (base of sickle)
    [0.26, 0.50],  // Eta      (sickle)
    [0.40, 0.28],  // Algieba  (sickle)
    [0.56, 0.22],  // Adhafera (sickle top)
    [0.68, 0.32],  // Mu       (sickle curve)
    [0.82, 0.52],  // Denebola (tail)
    [0.65, 0.62],  // Theta    (back)
  ],
}

const EDGES = {
  'orion': [
    [0, 1], // shoulders
    [0, 2], // left shoulder → left belt
    [1, 4], // right shoulder → right belt
    [2, 3], // belt left–center
    [3, 4], // belt center–right
    [2, 5], // left belt → left foot
    [4, 6], // right belt → right foot
  ],
  'big-dipper': [
    [0, 1], // bowl right side
    [1, 2], // bowl bottom
    [2, 3], // bowl left side
    [3, 0], // bowl top
    [3, 4], // handle start
    [4, 5], // handle middle
    [5, 6], // handle end
  ],
  'cassiopeia': [
    [0, 1], // left valley
    [1, 2], // left peak down
    [2, 3], // right peak up
    [3, 4], // right valley
  ],
  'crux': [
    [0, 2], // vertical beam (top–bottom)
    [1, 3], // horizontal beam (right–left)
  ],
  'cygnus': [
    [0, 1], // top to center
    [1, 2], // center to bottom (vertical beam)
    [3, 1], // left wing to center
    [1, 4], // center to right wing
  ],
  'leo': [
    [0, 1], // sickle base–eta
    [1, 2], // eta–algieba
    [2, 3], // algieba–adhafera
    [3, 4], // adhafera–mu (top of sickle)
    [4, 2], // mu→algieba — closes the hook (reversed question-mark shape)
    [0, 6], // regulus–theta (back)
    [6, 5], // theta–denebola (tail)
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

export function constellationEdges(name) {
  const edges = EDGES[name]
  if (!edges) throw new Error(`starflock: unknown constellation "${name}"`)
  return edges.map(pair => [pair[0], pair[1]])
}
