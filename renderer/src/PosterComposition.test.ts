import { describe, expect, it } from 'vitest'
import { sectionRects } from './PosterComposition'

describe('poster video geometry', () => {
  it('tracks adjusted section heights', () => {
    const rects = sectionRects({ concept: 200, core: 400, proof: 635, flow: 400 })
    expect(rects).toEqual([
      { y: 152, height: 200 },
      { y: 366, height: 400 },
      { y: 780, height: 635 },
      { y: 1429, height: 400 },
    ])
  })
})
