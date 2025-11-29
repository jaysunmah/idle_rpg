// Draw damage number
export function drawDamageNumber(g, value, isCrit, age) {
  g.clear()
  
  // Animated properties
  const alpha = Math.max(0, 1 - age)
  const scale = isCrit ? 1.2 + age * 0.3 : 1 + age * 0.2
  
  // Draw text background/shadow
  const text = isCrit ? `${value}!` : `${value}`
  const fontSize = isCrit ? 28 : 22
  const color = isCrit ? 0xffdd44 : 0xffffff
  
  // Simple circle representation (text requires Text objects)
  g.fill({ color, alpha })
  g.circle(0, 0, fontSize * scale / 2)
  g.fill()
}

export default { drawDamageNumber }
