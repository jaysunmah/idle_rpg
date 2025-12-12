import { useRef, useEffect, useCallback } from 'react'

export function useGameLoop(callback, deps = []) {
  const frameRef = useRef()
  const lastTimeRef = useRef(null)
  const callbackRef = useRef(callback)
  const loopRef = useRef()
  
  // Initialize lastTimeRef in useEffect to avoid calling performance.now during render
  useEffect(() => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = performance.now()
    }
  }, [])
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  // Create the loop function and store it in a ref to avoid immutability issues
  useEffect(() => {
    loopRef.current = () => {
      const now = performance.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      
      // Call the game update with delta time (capped at 16.667ms for Matter.js compatibility)
      callbackRef.current(Math.min(delta, 16.667))
      
      frameRef.current = requestAnimationFrame(loopRef.current)
    }
  }, [])
  
  const loop = useCallback(() => {
    if (loopRef.current) {
      loopRef.current()
    }
  }, [])
  
  useEffect(() => {
    frameRef.current = requestAnimationFrame(loop)
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
