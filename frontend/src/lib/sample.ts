import type { PosterContent } from '../types'

export const sampleContent: PosterContent = {
  level: 'LEVEL 2', eyebrow: 'INTERVIEW IMPORTANT',
  section_heights: { concept: 235, core: 390, proof: 610, flow: 400 },
  concept: { title: 'Hash Table', icon: 'grid', description: 'Stores key-value data using a hash function to locate entries efficiently.' },
  core: {
    bullets: [
      { text: 'A key is processed using a hash function.', highlight: 'hash function', accent: 'lime' },
      { text: 'The hash points to the matching dictionary entry.', highlight: 'hash', accent: 'pink' },
      { text: 'Dictionary lookup is average O(1).', highlight: 'O(1)', accent: 'lime' },
    ],
    keywords: ['KEY', 'HASH', 'INDEX', 'LOOKUP'],
  },
  proof: {
    code: 'data = {\n  "name": "Alice",\n  "age": 25\n}\n\nprint(data["name"])  # Alice',
  },
  visual_flow: { image: null },
}
