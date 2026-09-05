import type { Poster, PosterContent } from '../types'

type LegacyPosterContent = Omit<PosterContent, 'visual_flow'> & {
  visual_flow?: PosterContent['visual_flow']
}

export function normalizePoster(poster: Poster): Poster {
  const content = poster.content as LegacyPosterContent
  if (content.visual_flow) return poster
  return {
    ...poster,
    content: {
      ...content,
      visual_flow: { image: null },
    },
  }
}
