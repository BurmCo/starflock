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
    [0.10, 0.10],  // Betelgeuse  (α: RA 05h 55m, Dec +07°) left shoulder
    [0.69, 0.15],  // Bellatrix   (γ: RA 05h 25m, Dec +06°) right shoulder
    [0.38, 0.54],  // Alnitak     (ζ: RA 05h 41m, Dec −02°) belt left  (east end)
    [0.47, 0.50],  // Alnilam     (ε: RA 05h 36m, Dec −01°) belt center
    [0.56, 0.46],  // Mintaka     (δ: RA 05h 32m, Dec −00°) belt right (west end)
    [0.25, 0.90],  // Saiph       (κ: RA 05h 48m, Dec −10°) left foot
    [0.90, 0.83],  // Rigel       (β: RA 05h 15m, Dec −08°) right foot
  ],
  'big-dipper': [
    [0.89, 0.10],  // Dubhe  (α: RA 11h 04m, Dec +62°) bowl top-right
    [0.90, 0.45],  // Merak  (β: RA 11h 02m, Dec +56°) bowl bottom-right
    [0.65, 0.62],  // Phecda (γ: RA 11h 54m, Dec +54°) bowl bottom-left
    [0.54, 0.40],  // Megrez (δ: RA 12h 15m, Dec +57°) bowl top-left / handle start
    [0.36, 0.47],  // Alioth (ε: RA 12h 54m, Dec +56°) handle 1
    [0.21, 0.54],  // Mizar  (ζ: RA 13h 24m, Dec +55°) handle 2
    [0.10, 0.90],  // Alkaid (η: RA 13h 48m, Dec +49°) handle end
  ],
  'cassiopeia': [
    [0.90, 0.61],  // Caph    (β: RA 00h 09m, Dec +59°) far right
    [0.66, 0.90],  // Schedar (α: RA 00h 41m, Dec +57°) second, low
    [0.54, 0.43],  // Gamma   (γ: RA 00h 57m, Dec +61°) middle, high — peak of W
    [0.32, 0.48],  // Ruchbah (δ: RA 01h 26m, Dec +60°) fourth
    [0.10, 0.10],  // Segin   (ε: RA 01h 54m, Dec +64°) far left, high
  ],
  'crux': [
    [0.51, 0.10],  // Gacrux (γ: RA 12h 31m, Dec −57°) top    (northernmost)
    [0.10, 0.44],  // Mimosa (β: RA 12h 48m, Dec −60°) left   (east arm)
    [0.62, 0.90],  // Acrux  (α: RA 12h 27m, Dec −63°) bottom (southernmost)
    [0.90, 0.32],  // Imai   (δ: RA 12h 15m, Dec −59°) right  (west arm)
  ],
  'cygnus': [
    [0.15, 0.10],  // Deneb   (α: RA 20h 41m, Dec +45°) upper-left  — top of long arm (NE)
    [0.35, 0.33],  // Sadr    (γ: RA 20h 22m, Dec +40°) center
    [0.90, 0.90],  // Albireo (β: RA 19h 31m, Dec +28°) lower-right — bottom of long arm (SW)
    [0.10, 0.62],  // Gienah  (ε: RA 20h 46m, Dec +34°) lower-left  — east wing
    [0.75, 0.11],  // Delta   (δ: RA 19h 45m, Dec +45°) upper-right — west wing
  ],
  'leo': [
    [0.75, 0.90],  // Regulus  (α: RA 10h 08m, Dec +12°) base of sickle
    [0.76, 0.63],  // Eta      (η: RA 10h 07m, Dec +17°) sickle
    [0.68, 0.45],  // Algieba  (γ: RA 10h 20m, Dec +20°) sickle — body junction
    [0.70, 0.25],  // Adhafera (ζ: RA 10h 17m, Dec +23°) sickle upper
    [0.86, 0.10],  // Mu       (μ: RA 09h 53m, Dec +26°) hook apex  (northernmost)
    [0.90, 0.23],  // Epsilon  (ε: RA 09h 46m, Dec +24°) hook tip   (westernmost)
    [0.10, 0.75],  // Denebola (β: RA 11h 49m, Dec +15°) tail — far left
    [0.33, 0.41],  // Zosma    (δ: RA 11h 14m, Dec +21°) body / hip
    [0.33, 0.70],  // Theta    (θ: RA 11h 14m, Dec +15°) hindquarters
  ],
}

const EDGES = {
  'orion': [
    [0, 1], // shoulders
    [0, 2], // left shoulder → left belt  (Betelgeuse → Alnitak)
    [1, 4], // right shoulder → right belt (Bellatrix → Mintaka)
    [2, 3], // belt left–center            (Alnitak → Alnilam)
    [3, 4], // belt center–right           (Alnilam → Mintaka)
    [2, 5], // left belt → left foot       (Alnitak → Saiph)
    [4, 6], // right belt → right foot     (Mintaka → Rigel)
    [5, 6], // bottom bar                  (Saiph → Rigel — completes hourglass)
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
    [0, 1], // right end → first valley  (Caph → Schedar)
    [1, 2], // first valley → center peak (Schedar → Gamma)
    [2, 3], // center peak → second valley (Gamma → Ruchbah)
    [3, 4], // second valley → left end    (Ruchbah → Segin)
  ],
  'crux': [
    [0, 2], // vertical beam   (Gacrux top → Acrux bottom)
    [1, 3], // horizontal beam (Mimosa left → Imai right)
  ],
  'cygnus': [
    [0, 1], // top to center
    [1, 2], // center to bottom (vertical beam)
    [3, 1], // left wing to center
    [1, 4], // center to right wing
  ],
  'leo': [
    [0, 1], // Regulus → Eta
    [1, 2], // Eta → Algieba
    [2, 3], // Algieba → Adhafera
    [3, 4], // Adhafera → Mu      (hook apex — highest point)
    [4, 5], // Mu → Epsilon       (hook tip — westernmost, completes backwards-?)
    [2, 7], // Algieba → Zosma    (body)
    [7, 6], // Zosma → Denebola  (tail — far left)
    [6, 8], // Denebola → Theta  (bottom left → bottom mid)
    [8, 0], // Theta → Regulus   (bottom mid → bottom right)
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
