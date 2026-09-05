import { describe, expect, it } from 'vitest'
import { sampleContent } from './sample'
import { validatePoster } from './validation'
import type { Poster } from '../types'

function poster(): Poster {
  const value: Poster = {
    id: 'test',
    title: 'Python Hash Table',
    content: structuredClone(sampleContent),
    revision: 1,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }
  value.content.visual_flow.image = { filename: 'flow.png', media_type: 'image/png', data_url: 'data:image/png;base64,AAAA', width: 970, height: 290 }
  return value
}

describe('validatePoster', () => {
  it('accepts the reference poster', () => {
    expect(validatePoster(poster())).toEqual([])
  })

  it('requires unique Core Idea keywords', () => {
    const value = poster()
    value.content.core.keywords[3] = value.content.core.keywords[0]
    expect(validatePoster(value)).toContain('Core Idea keywords must be unique.')
  })

  it('accepts one and five Core Idea keyword chips', () => {
    const one = poster()
    one.content.core.keywords = ['ONE']
    expect(validatePoster(one)).toEqual([])
    const five = poster()
    five.content.core.keywords = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']
    expect(validatePoster(five)).toEqual([])
  })

  it('requires one Visual Flow image', () => {
    const value = poster()
    value.content.visual_flow.image = null
    expect(validatePoster(value)).toContain('Attach one Visual Flow image.')
  })
})
