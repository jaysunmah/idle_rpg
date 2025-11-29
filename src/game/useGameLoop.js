import { useRef, useEffect, useCallback } from 'react'

export function useGameLoop(callback, deps = []) {
  const frameRef = useRef()
  const lastTimeRef = useRef(performance.now())
  const callbackRef = useRef(callback)
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  const loop = useCallback(() => {
    const now = performance.now()
    const delta = now - lastTimeRef.current
    lastTimeRef.current = now
    
    // Call the game update with delta time (capped at 16.667ms for Matter.js compatibility)
    callbackRef.current(Math.min(delta, 16.667))
    
    frameRef.current = requestAnimationFrame(loop)
  }, [])
  
  useEffect(() => {
    frameRef.current = requestAnimationFrame(loop)
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [loop, ...deps])
  
  return {
    pause: () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    },
    resume: () => {
      if (!frameRef.current) {
        lastTimeRef.current = performance.now()
        frameRef.current = requestAnimationFrame(loop)
      }
    },
  }
}

export default useGameLoop
