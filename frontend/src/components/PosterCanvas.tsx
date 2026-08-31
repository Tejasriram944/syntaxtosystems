import { forwardRef, useEffect, useRef, useState } from 'react'
import { Braces, Database, Grid3X3, Layers3, Network, ArrowDown } from 'lucide-react'
import type { CoreBullet, IconKey, PosterContent, SectionHeights } from '../types'
import { splitHighlight } from '../lib/coreIdea'
import { resizeAdjacent, type SectionKey } from '../lib/layout'
import { neonFrameState } from '../lib/neonAnimation'

const icons = { grid: Grid3X3, braces: Braces, layers: Layers3, network: Network, database: Database }

function HighlightedBullet({ bullet }: { bullet: CoreBullet }) {
  const parts = splitHighlight(bullet.text, bullet.highlight)
  return <li>{parts ? <>{parts[0]}<mark className={`core-mark ${bullet.accent}`}>{parts[1]}</mark>{parts[2]}</> : bullet.text}</li>
}

export type PosterMotion = 'loop' | 'still' | 'base' | 'frame'

function NeonBorder({ color, index, motion, frame = 0 }: { color: string; index: number; motion: PosterMotion; frame?: number }) {
  const { active, progress } = neonFrameState(index, frame)
  const frameStyle = motion === 'frame' ? { opacity: active ? 1 : 0, strokeDashoffset: 100 - progress * 100 } : undefined
  return <svg className={`neon-border neon-mode-${motion}`} aria-hidden="true" style={{ color }}>
    <rect className="neon-base" x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="16" pathLength="100" vectorEffect="non-scaling-stroke" style={{ stroke: color }} />
    <rect className="neon-trace" x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="16" pathLength="100" vectorEffect="non-scaling-stroke" style={{ stroke: color, animationDelay: `${index * 1.5}s`, ...frameStyle }} />
  </svg>
}

export const PosterCanvas = forwardRef<HTMLDivElement, { content: PosterContent; title: string; motion?: PosterMotion; frame?: number }>(function PosterCanvas({ content, title, motion = 'loop', frame = 0 }, ref) {
  const ConceptIcon = icons[content.concept.icon as IconKey] ?? Grid3X3
  return <div className="poster-canvas" ref={ref} data-poster-title={title}>
    <header className="poster-header" data-animate="header">
      <div className="python-mark"><span>⌁</span><span>⌁</span></div>
      <div><h1>PYTHON</h1><p>{content.level} <i>•</i> {content.eyebrow}</p></div>
    </header>
    <section className="poster-section concept-section" style={{ height: content.section_heights.concept }} id="poster-concept" data-animate="section">
      <NeonBorder color="#ff4fa0" index={0} motion={motion} frame={frame} />
      <div className="section-heading"><h2>{content.concept.title}</h2></div>
      <p>{content.concept.description}</p><ConceptIcon className="concept-icon" strokeWidth={1.6} aria-hidden="true" />
    </section>
    <section className="poster-section core-section" style={{ height: content.section_heights.core }} id="poster-core" data-animate="section">
      <NeonBorder color="#a6e900" index={1} motion={motion} frame={frame} />
      <div className="section-heading"><h2>CORE IDEA</h2></div>
      <div className="core-main"><ul className="core-bullets">{content.core.bullets.map((bullet, index) => <HighlightedBullet bullet={bullet} key={index} />)}</ul></div>
      <div className="core-keywords">{content.core.keywords.map((keyword, index) => <span key={index}>{keyword}</span>)}</div>
    </section>
    <section className="poster-section proof-section" style={{ height: content.section_heights.proof }} id="poster-proof" data-animate="section">
      <NeonBorder color="#ff4fa0" index={2} motion={motion} frame={frame} />
      <div className="section-heading"><h2>CODE PROOF</h2></div>
      <div className="proof-grid"><div className="code-proof"><pre>{content.proof.code}</pre></div></div>
    </section>
    <section className="poster-section flow-section" style={{ height: content.section_heights.flow }} id="poster-flow" data-animate="section">
      <NeonBorder color="#11d8ff" index={3} motion={motion} frame={frame} />
      <div className="section-heading"><h2>VISUAL FLOW</h2></div>
      <div className="flow-row">{content.flow.map((step, index) => <div className="flow-wrap" key={`${step.title}-${index}`}><div className="flow-card"><b>{index + 1}. {step.title}</b><ArrowDown aria-hidden="true" /><span>{step.detail}</span></div>{index < content.flow.length - 1 && <span className="flow-arrow">→</span>}</div>)}</div>
    </section>
    <footer><span>PYTHON {content.level}</span><i>•</i><span>{content.eyebrow}</span><i>•</i><span>EASY TO UNDERSTAND</span><b>9:16&nbsp; • &nbsp;1080 × 1920</b></footer>
  </div>
})

const HANDLE_PAIRS: [SectionKey, SectionKey][] = [['concept', 'core'], ['core', 'proof'], ['proof', 'flow']]

export function PosterPreview({ content, title, className = '', onHeightsChange }: { content: PosterContent; title: string; className?: string; onHeightsChange?: (heights: SectionHeights) => void }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.35)
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const resize = () => setScale(frame.clientWidth / 1080)
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])
  const tops = [159 + content.section_heights.concept, 173 + content.section_heights.concept + content.section_heights.core, 187 + content.section_heights.concept + content.section_heights.core + content.section_heights.proof]
  function startResize(event: React.PointerEvent<HTMLButtonElement>, index: number) {
    if (!onHeightsChange) return
    event.preventDefault()
    const startY = event.clientY
    const initial = content.section_heights
    const [upper, lower] = HANDLE_PAIRS[index]
    const move = (moveEvent: PointerEvent) => onHeightsChange(resizeAdjacent(initial, upper, lower, (moveEvent.clientY - startY) / scale))
    const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }
  function keyboardResize(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!onHeightsChange || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const [upper, lower] = HANDLE_PAIRS[index]
    onHeightsChange(resizeAdjacent(content.section_heights, upper, lower, event.key === 'ArrowDown' ? 5 : -5))
  }
  return <div className={`poster-frame ${className}`} ref={frameRef}>
    <div style={{ transform: `scale(${scale})` }}><PosterCanvas content={content} title={title} /></div>
    {onHeightsChange && tops.map((top, index) => <button type="button" key={index} className="section-resizer" style={{ top: `${top / 19.2}%` }} role="separator" aria-orientation="horizontal" aria-label={`Resize ${HANDLE_PAIRS[index][0]} and ${HANDLE_PAIRS[index][1]} sections`} aria-valuenow={content.section_heights[HANDLE_PAIRS[index][0]]} onPointerDown={(event) => startResize(event, index)} onKeyDown={(event) => keyboardResize(event, index)}><span /></button>)}
  </div>
}
