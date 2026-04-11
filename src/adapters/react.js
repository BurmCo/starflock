import { useEffect, useRef } from 'react'
import { World } from '../World.js'

/**
 * useCosmograph — React hook for cosmograph
 *
 * Returns a canvasRef to attach to a <canvas> element.
 * All World options are supported as props.
 *
 * Example:
 *   const ref = useCosmograph({ nodeCount: 60, colors: ['#fff'], forces: [drift()] })
 *   return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
 */
export function useCosmograph(options = {}) {
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
  })  // no deps — runs after every render, world.update() is cheap for unchanged options

  return canvasRef
}
