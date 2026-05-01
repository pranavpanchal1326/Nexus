import { describe, it, expect } from 'vitest'
import {
  generateTesseractVertices,
  generateTesseractEdges,
  rotateXW,
  rotateZW,
  project4Dto3D,
  transformVertex,
} from '../../lib/tesseract-math'

describe('generateTesseractVertices', () => {
  it('generates exactly 16 vertices', () => {
    expect(generateTesseractVertices()).toHaveLength(16)
  })

  it('all coordinates are +1 or -1', () => {
    generateTesseractVertices().forEach(v => {
      v.forEach(c => expect(Math.abs(c)).toBe(1))
    })
  })

  it('all 16 vertices are unique', () => {
    const verts = generateTesseractVertices()
    const keys  = new Set(verts.map(v => v.join(',')))
    expect(keys.size).toBe(16)
  })

  it('first vertex is (-1,-1,-1,-1)', () => {
    const v = generateTesseractVertices()[0]
    expect(v).toEqual([-1, -1, -1, -1])
  })

  it('last vertex is (1,1,1,1)', () => {
    const v = generateTesseractVertices()[15]
    expect(v).toEqual([1, 1, 1, 1])
  })
})

describe('generateTesseractEdges', () => {
  it('generates exactly 32 edges', () => {
    expect(generateTesseractEdges()).toHaveLength(32)
  })

  it('all edge indices are valid (0-15)', () => {
    generateTesseractEdges().forEach(([a, b]) => {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(16)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(16)
    })
  })

  it('all edges connect vertices differing in exactly one coordinate', () => {
    const verts = generateTesseractVertices()
    generateTesseractEdges().forEach(([aIdx, bIdx]) => {
      const a = verts[aIdx]
      const b = verts[bIdx]
      const diffs = a.filter((c, i) => c !== b[i]).length
      expect(diffs).toBe(1)
    })
  })

  it('no duplicate edges', () => {
    const edges = generateTesseractEdges()
    const keys  = new Set(edges.map(([a, b]) => `${a}-${b}`))
    expect(keys.size).toBe(32)
  })

  it('no self-loops', () => {
    generateTesseractEdges().forEach(([a, b]) => {
      expect(a).not.toBe(b)
    })
  })
})

describe('rotateXW', () => {
  it('identity at angle 0', () => {
    const v: [number,number,number,number] = [1, 0, 0, 0]
    const r = rotateXW(v, 0)
    expect(r[0]).toBeCloseTo(1)
    expect(r[3]).toBeCloseTo(0)
  })

  it('90deg rotation maps x→w, w→-x', () => {
    const v: [number,number,number,number] = [1, 0, 0, 0]
    const r = rotateXW(v, Math.PI / 2)
    expect(r[0]).toBeCloseTo(0)
    expect(r[3]).toBeCloseTo(1)
  })

  it('preserves y and z coordinates', () => {
    const v: [number,number,number,number] = [1, 2, 3, 0]
    const r = rotateXW(v, Math.PI / 4)
    expect(r[1]).toBeCloseTo(2)
    expect(r[2]).toBeCloseTo(3)
  })

  it('rotation preserves vector magnitude in XW plane', () => {
    const v: [number,number,number,number] = [1, 0, 0, 1]
    const r = rotateXW(v, Math.PI / 3)
    const origMag = Math.sqrt(v[0]**2 + v[3]**2)
    const newMag  = Math.sqrt(r[0]**2 + r[3]**2)
    expect(newMag).toBeCloseTo(origMag)
  })
})

describe('rotateZW', () => {
  it('identity at angle 0', () => {
    const v: [number,number,number,number] = [0, 0, 1, 0]
    const r = rotateZW(v, 0)
    expect(r[2]).toBeCloseTo(1)
    expect(r[3]).toBeCloseTo(0)
  })

  it('90deg rotation maps z→w, w→-z', () => {
    const v: [number,number,number,number] = [0, 0, 1, 0]
    const r = rotateZW(v, Math.PI / 2)
    expect(r[2]).toBeCloseTo(0)
    expect(r[3]).toBeCloseTo(1)
  })

  it('preserves x and y coordinates', () => {
    const v: [number,number,number,number] = [3, 4, 1, 0]
    const r = rotateZW(v, Math.PI / 6)
    expect(r[0]).toBeCloseTo(3)
    expect(r[1]).toBeCloseTo(4)
  })
})

describe('project4Dto3D', () => {
  it('vertex at w=0 projects with scale 1 (distance/distance)', () => {
    const v: [number,number,number,number] = [1, 1, 1, 0]
    const p = project4Dto3D(v, 2)
    expect(p[0]).toBeCloseTo(1)
    expect(p[1]).toBeCloseTo(1)
    expect(p[2]).toBeCloseTo(1)
  })

  it('positive w enlarges projected coordinates', () => {
    const v1: [number,number,number,number] = [1, 0, 0, 0]
    const v2: [number,number,number,number] = [1, 0, 0, 1]
    const p1 = project4Dto3D(v1, 2)
    const p2 = project4Dto3D(v2, 2)
    expect(p2[0]).toBeGreaterThan(p1[0])
  })

  it('negative w shrinks projected coordinates', () => {
    const v1: [number,number,number,number] = [1, 0, 0, 0]
    const v2: [number,number,number,number] = [1, 0, 0, -1]
    const p1 = project4Dto3D(v1, 2)
    const p2 = project4Dto3D(v2, 2)
    expect(p2[0]).toBeLessThan(p1[0])
  })
})

describe('transformVertex', () => {
  it('returns a Vec3 (3 elements)', () => {
    const v: [number,number,number,number] = [1, -1, 1, -1]
    const p = transformVertex(v, 0.5, 0.3)
    expect(p).toHaveLength(3)
  })

  it('output is finite — no NaN or Infinity', () => {
    const verts = generateTesseractVertices()
    verts.forEach(v => {
      const p = transformVertex(v, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
      p.forEach(c => {
        expect(isFinite(c)).toBe(true)
        expect(isNaN(c)).toBe(false)
      })
    })
  })

  it('different angles produce different projections', () => {
    const v: [number,number,number,number] = [1, 1, 1, 1]
    const p1 = transformVertex(v, 0, 0)
    const p2 = transformVertex(v, 1, 0.5)
    const isDiff = p1.some((c, i) => Math.abs(c - p2[i]) > 0.001)
    expect(isDiff).toBe(true)
  })
})
