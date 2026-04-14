// starflock — canvas particle library

export interface NodeOptions {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  color: string
  phase: number
  twinkleSpeed: number
}

export declare class Node {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  color: string
  brightness: number
  phase: number
  twinkleSpeed: number
  angle?: number
  angularVelocity?: number
  shape?: string | ShapeFn
  /** @internal assigned by World for spatial index lookups */
  _index: number
  constructor(opts: NodeOptions)
}

export type ShapeFn = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => void

export declare function resolveShape(shape: string | ShapeFn): ShapeFn

export declare const circle: ShapeFn
export declare const diamond: ShapeFn
export declare const star: ShapeFn
export declare const cross: ShapeFn
export declare const ring: ShapeFn

export interface ForceContext {
  readonly time: number
  readonly mouse: { x: number; y: number } | null
  readonly scrollY: number
  readonly width: number
  readonly height: number
}

export type Force = (nodes: Node[], context: ForceContext) => void

export type Layout = (width: number, height: number) => Array<{ x: number; y: number }>

export interface WorldOptions {
  canvas: HTMLCanvasElement
  forces?: Force[]
  layout?: Layout | Layout[]
  // Nodes
  nodeCount?: number
  nodeSize?: number | [number, number]
  colors?: string[]
  nodeSizeDistribution?: 'uniform' | 'gaussian' | 'weighted-small'
  nodeColorMode?: 'random' | 'by-size' | 'sequential' | 'gradient' | 'by-position'
  nodeSpawnRegion?: 'full' | 'center' | 'edges' | ((width: number, height: number) => { x: number; y: number })
  nodeRotation?: boolean
  // Edges
  edgeMaxDist?: number
  edgeMaxOpacity?: number
  edgeWidth?: number
  edgeColors?: string[] | null
  edgeStyle?: 'solid' | 'dashed' | 'gradient'
  edgeColorMode?: 'alternate' | 'source' | 'target' | ((a: Node, b: Node, i: number, j: number) => string)
  maxEdgesPerNode?: number | null
  minEdgesPerNode?: number | null
  edgeCurvature?: number
  edges?: Array<[number, number]> | null
  // Shape
  nodeShape?: string | ShapeFn
  // Glow
  glowOnLargeNodes?: boolean
  glowThreshold?: number
  glowScale?: number
  glowOpacity?: number
  // Rendering
  pixelRatio?: 'auto' | number
  blendMode?: GlobalCompositeOperation
  renderOrder?: 'edges-first' | 'nodes-first'
  background?: string | null
  // Callbacks
  onFrame?: ((nodes: Node[], context: ForceContext) => void) | null
  onNodeHover?: ((node: Node) => void) | null
  onNodeLeave?: ((node: Node) => void) | null
  onNodeClick?: ((node: Node) => void) | null
  // Performance
  pauseWhenHidden?: boolean
  maxEdgesPerFrame?: number | null
  spatialIndex?: boolean
  autoResize?: boolean
  pauseWhenOffscreen?: boolean
}

export declare class World {
  canvas: HTMLCanvasElement
  nodes: Node[]
  forces: Force[]
  options: WorldOptions
  constructor(opts: WorldOptions)
  start(): void
  stop(): void
  resize(): void
  update(options: Partial<Omit<WorldOptions, 'canvas'>>): void
}

// Forces
export interface DriftOptions {
  maxSpeed?: number
  minSpeed?: number
}
export declare function drift(opts?: DriftOptions): Force

export interface DampenOptions {
  factor?: number
}
export declare function dampen(opts?: DampenOptions): Force

export interface TwinkleOptions {
  minBrightness?: number
  variance?: number
}
export declare function twinkle(opts?: TwinkleOptions): Force

export interface MouseRepelOptions {
  radius?: number
  strength?: number
  mode?: 'repel' | 'attract' | 'orbit' | 'custom'
  fn?: (node: Node, mouse: { x: number; y: number }, context: ForceContext) => void
}
export declare function mouseRepel(opts?: MouseRepelOptions): Force

export interface ScrollDriftOptions {
  mode?: 'rotate' | 'wave' | 'scatter' | 'custom'
  strength?: number
  fn?: (node: Node, delta: number, context: ForceContext) => void
}
export declare function scrollDrift(opts?: ScrollDriftOptions): Force

export interface GravityOptions {
  x?: number | ((context: ForceContext) => number)
  y?: number | ((context: ForceContext) => number)
  strength?: number
}
export declare function gravity(opts?: GravityOptions): Force

export interface WindOptions {
  angle?: number
  strength?: number
  gust?: number
}
export declare function wind(opts?: WindOptions): Force

export interface NodeRepelOptions {
  radius?: number
  strength?: number
}
export declare function nodeRepel(opts?: NodeRepelOptions): Force

export interface NoiseOptions {
  scale?: number
  speed?: number
  strength?: number
}
export declare function noise(opts?: NoiseOptions): Force

export interface AttractOptions {
  x?: number | ((width: number, height: number) => number)
  y?: number | ((width: number, height: number) => number)
  radius?: number
  strength?: number
}
export declare function attract(opts?: AttractOptions): Force

// React adapter
export declare function useStarflock(options?: Omit<WorldOptions, 'canvas'>): import('react').RefObject<HTMLCanvasElement>

// Layouts namespace
export declare namespace layouts {
  function ring(opts?: {
    count?: number
    radius?: number
    cx?: number
    cy?: number
  }): Layout

  function constellation(
    name: 'orion' | 'big-dipper' | 'cassiopeia' | 'crux' | 'cygnus' | 'leo',
    opts?: {
      scale?: number
      cx?: number
      cy?: number
    }
  ): Layout

  function constellationEdges(name: 'orion' | 'big-dipper' | 'cassiopeia' | 'crux' | 'cygnus' | 'leo'): Array<[number, number]>
}

// Presets namespace
export declare namespace presets {
  function orion(overrides?: Partial<WorldOptions>): Partial<WorldOptions>
  function bigDipper(overrides?: Partial<WorldOptions>): Partial<WorldOptions>
}
