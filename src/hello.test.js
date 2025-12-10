import { describe, it, expect } from 'vitest'
import { hello } from './hello.js'

describe('hello', () => {
  it('should return "Hello, World!" when no name is provided', () => {
    expect(hello()).toBe('Hello, World!')
  })

  it('should return "Hello, [name]!" when a name is provided', () => {
    expect(hello('Alice')).toBe('Hello, Alice!')
    expect(hello('Bob')).toBe('Hello, Bob!')
  })
})
