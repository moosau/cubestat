const MOVES = ["U", "D", "F", "B", "L", "R"]
const SUFFIXES = ["", "'", "2"]

export function generateScramble(length = 20): string {
  const scramble: string[] = []
  let lastFace = ""
  let secondLastFace = ""

  while (scramble.length < length) {
    const face = MOVES[Math.floor(Math.random() * MOVES.length)]
    // Avoid repeating the same face or opposite faces back-to-back
    if (face === lastFace) continue
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
    scramble.push(face + suffix)
    secondLastFace = lastFace
    lastFace = face
  }

  return scramble.join(" ")
}
