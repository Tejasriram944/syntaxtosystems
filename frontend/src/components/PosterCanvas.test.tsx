import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { sampleContent } from '../lib/sample'
import { splitHighlight } from '../lib/coreIdea'
import { PosterCanvas } from './PosterCanvas'
import { neonFrameState } from '../lib/neonAnimation'

describe('Poster renderer', () => {
  it('renders Core Idea without a visual box and Code Proof without explanation', () => {
    const content = structuredClone(sampleContent)
    const markup = renderToStaticMarkup(<PosterCanvas content={content} title="Test" />)
    expect(markup).toContain('core-keywords')
    expect(markup).not.toContain('core-visual')
    expect(markup).toContain('CODE PROOF')
    expect(markup).not.toContain('EXPLANATION')
    expect(markup).not.toContain('AND EXPLAIN')
    expect(markup).toContain('flow-image-placeholder')
  })

  it('renders exactly one Visual Flow image with concept-derived alt text', () => {
    const content = structuredClone(sampleContent)
    content.visual_flow.image = { filename: 'flow.png', media_type: 'image/png', data_url: 'data:image/png;base64,AAAA', width: 970, height: 290 }
    const markup = renderToStaticMarkup(<PosterCanvas content={content} title="Test" />)
    expect(markup.match(/<img/g)).toHaveLength(1)
    expect(markup).toContain('alt="Visual flow for Hash Table"')
  })

  it('splits only an exact highlight match', () => {
    expect(splitHighlight('Dictionary lookup is O(1).', 'O(1)')).toEqual(['Dictionary lookup is ', 'O(1)', '.'])
    expect(splitHighlight('Dictionary lookup is O(1).', 'o(1)')).toBeNull()
  })

  it.each([[0, 0], [45, 1], [90, 2], [135, 3]])('activates frame %i on border %i', (frame, activeIndex) => {
    expect([0, 1, 2, 3].map((index) => neonFrameState(index, frame).active)).toEqual([0, 1, 2, 3].map((index) => index === activeIndex))
  })

  it('finishes the final trace at frame 179', () => {
    expect(neonFrameState(3, 179)).toEqual({ active: true, progress: 1 })
  })
})
