import { describe, expect, it } from 'vitest'
import { sampleContent } from './sample'
import { normalizePoster } from './posterNormalization'
import type { Poster } from '../types'

function posterWith(content: unknown): Poster {
  return { id: 'test', title: 'Test', content, revision: 1, created_at: '', updated_at: '' } as Poster
}

describe('poster normalization', () => {
  it('adds an empty image slot to legacy API responses', () => {
    const { visual_flow: _removed, ...legacyContent } = structuredClone(sampleContent)
    const normalized = normalizePoster(posterWith({ ...legacyContent, flow: [{ title: 'Old', detail: 'Old' }] }))
    expect(normalized.content.visual_flow).toEqual({ image: null })
  })

  it('preserves an existing Visual Flow image', () => {
    const value = posterWith(structuredClone(sampleContent))
    expect(normalizePoster(value)).toBe(value)
  })
})
