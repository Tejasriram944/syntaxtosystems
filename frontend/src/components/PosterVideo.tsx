import { useCurrentFrame } from 'remotion'
import { PosterCanvas } from './PosterCanvas'
import type { PosterContent } from '../types'

export interface PosterVideoProps { content: PosterContent; title: string }

export function PosterVideo({ content, title }: PosterVideoProps) {
  const frame = useCurrentFrame()
  return <PosterCanvas content={content} title={title} motion="frame" frame={frame} />
}
