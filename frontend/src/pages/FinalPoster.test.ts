import { describe, expect, it } from 'vitest'
import { PNG_EXPORT_OPTIONS } from '../lib/pngExport'

describe('poster PNG export', () => {
  it('captures the logical poster size without the screen preview scale', () => {
    expect(PNG_EXPORT_OPTIONS).toMatchObject({
      width: 1080,
      height: 1920,
      pixelRatio: 1,
      style: {
        transform: 'none',
        width: '1080px',
        height: '1920px',
      },
    })
  })
})
