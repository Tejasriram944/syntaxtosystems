import type { Poster } from '../types'
import { MIN_SECTION_HEIGHTS, SECTION_HEIGHT_BUDGET, SECTION_ORDER } from './layout'

const normalize = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '')
export function validatePoster(poster: Poster): string[] {
  const errors: string[] = []
  const c = poster.content
  if (!poster.title.trim() || !c.concept.title.trim() || !c.concept.description.trim()) errors.push('Complete the poster title and concept fields.')
  if (c.concept.description.length > 140) errors.push('Concept introduction is too long.')
  if (c.proof.code.split('\n').length > 12 || c.proof.code.length > 500) errors.push('Code proof exceeds 12 lines.')
  if (c.flow.length < 2 || c.flow.length > 4) errors.push('Visual flow needs two to four steps.')
  if (c.core.bullets.length < 2 || c.core.bullets.length > 4) errors.push('Core Idea needs two to four bullets.')
  if (c.core.keywords.length < 1 || c.core.keywords.length > 5 || c.core.keywords.some((item) => !item.trim())) errors.push('Core Idea needs one to five complete keyword chips.')
  const prose = [...c.core.bullets.map((bullet) => bullet.text), ...c.flow.map((step) => step.detail)].map(normalize).filter(Boolean)
  if (new Set(prose).size !== prose.length) errors.push('Remove repeated bullets or flow details.')
  if (c.core.bullets.some((item) => !item.text.trim())) errors.push('Bullets cannot be blank.')
  const keywords = c.core.keywords.map(normalize)
  if (new Set(keywords).size !== keywords.length) errors.push('Core Idea keywords must be unique.')
  if (SECTION_ORDER.reduce((total, key) => total + c.section_heights[key], 0) !== SECTION_HEIGHT_BUDGET) errors.push('Section heights must fill the poster exactly.')
  if (SECTION_ORDER.some((key) => c.section_heights[key] < MIN_SECTION_HEIGHTS[key])) errors.push('One or more poster sections are too short for their content.')
  if (c.flow.some((step) => !step.title.trim() || !step.detail.trim())) errors.push('Flow steps cannot be blank.')
  return errors
}
