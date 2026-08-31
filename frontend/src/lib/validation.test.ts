import { describe, expect, it } from 'vitest'
import { sampleContent } from './sample'
import { validatePoster } from './validation'
import type { Poster } from '../types'

function poster(): Poster {
  return {
    id: 'test',
    title: 'Python Hash Table',
    content: structuredClone(sampleContent),
    revision: 1,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }
}

describe('validatePoster', () => {
  it('accepts the reference poster', () => {
    expect(validatePoster(poster())).toEqual([])
  })

  it('detects repeated content across sections', () => {
    const value = poster()
    value.content.flow[0].detail = value.content.core.bullets[0].text
    expect(validatePoster(value)).toContain('Remove repeated bullets or flow details.')
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

  it('blocks incomplete flow steps', () => {
    const value = poster()
    value.content.flow[0].detail = ''
    expect(validatePoster(value)).toContain('Flow steps cannot be blank.')
  })
})
