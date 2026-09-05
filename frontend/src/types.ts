export type IconKey = 'grid' | 'braces' | 'layers' | 'network' | 'database'
export type CoreAccent = 'lime' | 'pink'
export interface CoreBullet { text: string; highlight: string; accent: CoreAccent }
export type VisualFlowMediaType = 'image/png' | 'image/jpeg' | 'image/webp'
export interface VisualFlowImage { filename: string; media_type: VisualFlowMediaType; data_url: string; width: number; height: number }
export interface SectionHeights { concept: number; core: number; proof: number; flow: number }
export interface PosterContent {
  level: string
  eyebrow: string
  section_heights: SectionHeights
  concept: { title: string; icon: IconKey; description: string }
  core: { bullets: CoreBullet[]; keywords: string[] }
  proof: { code: string }
  visual_flow: { image: VisualFlowImage | null }
}
export interface Poster { id: string; title: string; content: PosterContent; revision: number; created_at: string; updated_at: string }
export type PosterListItem = Omit<Poster, 'content'>
