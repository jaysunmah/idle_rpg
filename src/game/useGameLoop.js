import { useRef, useEffect } from 'react'

export function useGameLoop(callback, deps = []) {
  const frameRef = useRef()
  const lastTimeRef = useRef(0)
  const callbackRef = useRef(callback)
  const loopRef = useRef()
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  // Create loop function
  useEffect(() => {
    loopRef.current = (timestamp) => {
      const now = timestamp || performance.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      
      // Call the game update with delta time (capped at 16.667ms for Matter.js compatibility)
      callbackRef.current(Math.min(delta, 16.667))
      
      frameRef.current = requestAnimationFrame(loopRef.current)
    }
  }, [])
  
  useEffect(() => {
    lastTimeRef.current = performance.now()
    frameRef.current = requestAnimationFrame(loopRef.current)
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps])
  
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
        frameRef.current = requestAnimationFrame(loopRef.current)
      }
    },
  }
}

export default useGameLoop
