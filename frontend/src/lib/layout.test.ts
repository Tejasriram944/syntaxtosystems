import { describe, expect, it } from 'vitest'
import { DEFAULT_SECTION_HEIGHTS, MIN_SECTION_HEIGHTS, SECTION_HEIGHT_BUDGET, resizeAdjacent, setSectionHeight } from './layout'

const total = (value: typeof DEFAULT_SECTION_HEIGHTS) => Object.values(value).reduce((sum, height) => sum + height, 0)

describe('section resizing', () => {
  it('moves an adjacent boundary without changing the poster budget', () => {
    const result = resizeAdjacent(DEFAULT_SECTION_HEIGHTS, 'concept', 'core', 50)
    expect(result).toMatchObject({ concept: 285, core: 340 })
    expect(total(result)).toBe(SECTION_HEIGHT_BUDGET)
  })

  it('clamps at the adjacent section minimum', () => {
    const result = resizeAdjacent(DEFAULT_SECTION_HEIGHTS, 'concept', 'core', 999)
    expect(result.core).toBe(MIN_SECTION_HEIGHTS.core)
    expect(total(result)).toBe(SECTION_HEIGHT_BUDGET)
  })

  it('uses Code Proof to compensate Visual Flow numeric edits', () => {
    const result = setSectionHeight(DEFAULT_SECTION_HEIGHTS, 'flow', 450)
    expect(result).toMatchObject({ proof: 560, flow: 450 })
    expect(total(result)).toBe(SECTION_HEIGHT_BUDGET)
  })
})
