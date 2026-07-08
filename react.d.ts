import type { WorldOptions } from 'starflock'

export declare function useStarflock(
  options?: Omit<WorldOptions, 'canvas'>
): { readonly current: HTMLCanvasElement | null }
