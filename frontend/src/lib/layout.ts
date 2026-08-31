import type { SectionHeights } from '../types'

export type SectionKey = keyof SectionHeights

export const SECTION_ORDER: SectionKey[] = ['concept', 'core', 'proof', 'flow']
export const SECTION_LABELS: Record<SectionKey, string> = {
  concept: 'Concept', core: 'Core Idea', proof: 'Code Proof', flow: 'Visual Flow',
}
export const DEFAULT_SECTION_HEIGHTS: SectionHeights = { concept: 235, core: 390, proof: 610, flow: 400 }
export const MIN_SECTION_HEIGHTS: SectionHeights = { concept: 180, core: 280, proof: 260, flow: 300 }
export const SECTION_HEIGHT_BUDGET = 1635

export function resizeAdjacent(heights: SectionHeights, upper: SectionKey, lower: SectionKey, delta: number): SectionHeights {
  const minDelta = MIN_SECTION_HEIGHTS[upper] - heights[upper]
  const maxDelta = heights[lower] - MIN_SECTION_HEIGHTS[lower]
  const applied = Math.max(minDelta, Math.min(maxDelta, Math.round(delta)))
  return { ...heights, [upper]: heights[upper] + applied, [lower]: heights[lower] - applied }
}

export function setSectionHeight(heights: SectionHeights, key: SectionKey, requested: number): SectionHeights {
  const index = SECTION_ORDER.indexOf(key)
  const partner = index === SECTION_ORDER.length - 1 ? SECTION_ORDER[index - 1] : SECTION_ORDER[index + 1]
  return resizeAdjacent(heights, key, partner, Math.round(requested) - heights[key])
}
