// scripts/visual-audit.ts
// Run: npx ts-node scripts/visual-audit.ts
// Counts occurrences of signal color #E8FF47 in all component files

import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const SIGNAL_COLOR  = '#E8FF47'
const SIGNAL_VAR    = 'var\\(--color-signal\\)'
const SIGNAL_RGBA   = 'rgba\\(232,255,71'
const MAX_INSTANCES = 8

function walkDir(dir: string): string[] {
  const files: string[] = []
  try {
    const list = readdirSync(dir)
    for (const file of list) {
      const path = join(dir, file)
      const stat = statSync(path)
      if (stat.isDirectory()) {
        if (!path.includes('node_modules') && !path.includes('.next') && !path.includes('.git') && !path.includes('scripts')) {
          files.push(...walkDir(path))
        }
      } else if (path.match(/\.(tsx?)$/)) {
        files.push(path)
      }
    }
  } catch (e) {
    // Skip
  }
  return files
}

function countSignalInstances(content: string): number {
  const hexRegex  = new RegExp(SIGNAL_COLOR, 'gi')
  const varRegex  = new RegExp(SIGNAL_VAR, 'g')
  const rgbaRegex = new RegExp(SIGNAL_RGBA, 'g')

  const hexCount  = (content.match(hexRegex)  ?? []).length
  const varCount  = (content.match(varRegex)  ?? []).length
  const rgbaCount = (content.match(rgbaRegex) ?? []).length
  
  return hexCount + varCount + rgbaCount
}

const files = walkDir('.')
let total   = 0
const hits: { file: string; count: number }[] = []

files.forEach(file => {
  const content = readFileSync(file, 'utf-8')
  const count   = countSignalInstances(content)
  if (count > 0) {
    hits.push({ file, count })
    total += count
  }
})

console.log('\n─── Signal Color Audit ───────────────────────')
hits.sort((a, b) => b.count - a.count).forEach(({ file, count }) => {
  console.log(`  ${count}x  ${file}`)
})
console.log(`\nTotal: ${total} instances`)
console.log(`Limit: ${MAX_INSTANCES} instances`)
console.log(total <= MAX_INSTANCES
  ? '✓ PASS — within signal budget'
  : `✗ FAIL — ${total - MAX_INSTANCES} over budget`
)
