import { useEffect, useRef } from 'react'
import { World } from '../World.js'

/**
 * useStarflock — React hook for starflock
 *
 * Returns a canvasRef to attach to a <canvas> element.
 * All World options are supported as props and update live via world.update().
 *
 * Memoize the forces array with useMemo so it is not re-created on every
 * render — World.update() keeps the current forces when the new array is
 * element-wise identical, so a memoized array is never touched.
 *
 * Example:
 *   const forces = useMemo(() => [twinkle(), mouseRepel(), dampen(), drift()], [])
 *   const ref = useStarflock({ nodeCount: 60, colors: ['#fff'], forces })
 *   return <canvas ref={ref} style={{ position: 'fixed', inset: 0 }} />
 */
export function useStarflock(options = {}) {
  const canvasRef = useRef(null)
  const worldRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const world = new World({ canvas, ...options })
    worldRef.current = world
    world.start()
    return () => {
      world.stop()
      worldRef.current = null
    }
  }, [])

  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.update(options)
    }
  })  // no deps — runs after every render; update() diffs forces and reconciles listeners

  return canvasRef
}
