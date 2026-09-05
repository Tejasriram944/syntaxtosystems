import { describe, expect, it } from 'vitest'
import { getVisualFlowDimensions, MAX_VISUAL_FLOW_FILE_BYTES, validateVisualFlowFile } from './visualFlow'

describe('Visual Flow images', () => {
  it.each([
    [300, 190],
    [400, 290],
    [915, 805],
  ])('calculates a 970 px image slot for a %i px section', (flowHeight, imageHeight) => {
    expect(getVisualFlowDimensions(flowHeight)).toMatchObject({ sectionWidth: 1030, sectionHeight: flowHeight, imageWidth: 970, imageHeight })
  })

  it('accepts the three supported image formats', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) expect(validateVisualFlowFile({ type, size: 100 })).toBeNull()
  })

  it('rejects unsupported, empty, and oversized files', () => {
    expect(validateVisualFlowFile({ type: 'image/gif', size: 100 })).toMatch(/PNG/)
    expect(validateVisualFlowFile({ type: 'image/png', size: 0 })).toMatch(/empty/)
    expect(validateVisualFlowFile({ type: 'image/png', size: MAX_VISUAL_FLOW_FILE_BYTES + 1 })).toMatch(/5 MB/)
  })
})
