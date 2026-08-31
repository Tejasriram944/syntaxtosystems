import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ChevronRight, Eye, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { validatePoster } from '../lib/validation'
import { PosterPreview } from '../components/PosterCanvas'
import type { CoreBullet, IconKey, Poster, PosterContent } from '../types'
import { DEFAULT_SECTION_HEIGHTS, MIN_SECTION_HEIGHTS, SECTION_HEIGHT_BUDGET, SECTION_LABELS, SECTION_ORDER, setSectionHeight } from '../lib/layout'

type SaveState = 'saved' | 'saving' | 'error' | 'conflict'
function Field({ label, value, max, onChange, multiline = false }: { label: string; value: string; max: number; onChange: (v: string) => void; multiline?: boolean }) {
  return <label className="field"><span>{label}<small>{value.length}/{max}</small></span>{multiline ? <textarea value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} /> : <input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />}</label>
}
function CoreBulletList({ values, onChange }: { values: CoreBullet[]; onChange: (v: CoreBullet[]) => void }) {
  return <div className="list-editor core-bullet-editor"><span className="field-label">Technical points<small>{values.length}/4</small></span>{values.map((bullet, index) => <div className="core-bullet-fields" key={index}>
    <div className="core-bullet-head"><b>Bullet {index + 1}</b><button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))} disabled={values.length <= 2} aria-label={`Remove bullet ${index + 1}`}><Trash2 /></button></div>
    <input value={bullet.text} maxLength={100} placeholder="Complete technical point" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, text: e.target.value } : v))} />
    <div className="highlight-fields"><input value={bullet.highlight} maxLength={32} placeholder="Exact phrase to highlight" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, highlight: e.target.value } : v))} /><select value={bullet.accent} aria-label={`Bullet ${index + 1} highlight color`} onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, accent: e.target.value as CoreBullet['accent'] } : v))}><option value="lime">Lime</option><option value="pink">Pink</option></select></div>
  </div>)}<button type="button" className="add-row" disabled={values.length >= 4} onClick={() => onChange([...values, { text: '', highlight: '', accent: 'lime' }])}><Plus /> Add bullet</button></div>
}
export function Editor() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [poster, setPoster] = useState<Poster | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [loadError, setLoadError] = useState('')
  useEffect(() => { api.get(id).then(setPoster).catch((e) => setLoadError(e.message)) }, [id])
  useEffect(() => {
    if (!dirty || !poster || saveState === 'conflict' || saveState === 'error') return
    const snapshot = poster
    const timer = window.setTimeout(async () => {
      setSaveState('saving')
      try {
        const saved = await api.update(snapshot)
        setPoster((current) => {
          if (current === snapshot) { setDirty(false); return saved }
          return current ? { ...current, revision: saved.revision } : saved
        })
        setSaveState('saved')
      } catch (e) {
        setSaveState((e as Error & { status?: number }).status === 409 ? 'conflict' : 'error')
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [poster, dirty, saveState])
  function update(mutator: (content: PosterContent) => PosterContent, title?: string) {
    setPoster((current) => current ? { ...current, title: title ?? current.title, content: mutator(current.content) } : current)
    setDirty(true)
    if (saveState !== 'conflict') setSaveState('saving')
  }
  async function reloadServerCopy() { const data = await api.get(id); setPoster(data); setDirty(false); setSaveState('saved') }
  if (loadError) return <main className="center-message"><AlertTriangle /><h1>{loadError}</h1><Link to="/">Back to dashboard</Link></main>
  if (!poster) return <main className="center-message">Loading editor…</main>
  const errors = validatePoster(poster)
  const content = poster.content
  const updateHeights = (section_heights: PosterContent['section_heights']) => update((c) => ({ ...c, section_heights }))
  return <main className="editor-page">
    <header className="editor-topbar"><button onClick={() => navigate('/')}><ArrowLeft /> Dashboard</button><div className={`save-status ${saveState}`}><span />{saveState === 'conflict' ? 'Editing conflict' : saveState === 'error' ? 'Save failed' : saveState === 'saving' ? 'Saving…' : 'All changes saved'}</div><button className="final-button" disabled={errors.length > 0 || saveState === 'conflict'} onClick={() => navigate(`/poster/${poster.id}`)}><Eye /> Final view <ChevronRight /></button></header>
    {saveState === 'conflict' && <div className="conflict-bar"><AlertTriangle />This poster changed elsewhere. Your draft is still visible.<button onClick={reloadServerCopy}><RotateCcw /> Load server copy</button></div>}
    <div className="editor-layout"><aside className="editor-panel">
      <div className="editor-intro"><span>POSTER CONTENT</span><h1>Edit the system.</h1><p>Keep every idea concise. Your preview updates as you type.</p></div>
      {errors.length > 0 && <div className="validation-box"><AlertTriangle /><div><b>{errors.length} detail{errors.length > 1 ? 's' : ''} to resolve</b>{errors.map((error) => <span key={error}>{error}</span>)}</div></div>}
      <details open><summary><b>00</b> Header <ChevronRight /></summary><div className="form-section"><Field label="Dashboard title" value={poster.title} max={80} onChange={(value) => update((c) => c, value)} /><div className="two-fields"><Field label="Level" value={content.level} max={18} onChange={(value) => update((c) => ({ ...c, level: value }))} /><Field label="Eyebrow" value={content.eyebrow} max={32} onChange={(value) => update((c) => ({ ...c, eyebrow: value }))} /></div></div></details>
      <details open><summary><b>↕</b> Section heights <ChevronRight /></summary><div className="form-section"><div className="height-budget"><span>Fixed poster budget</span><b>{SECTION_HEIGHT_BUDGET} px</b></div><div className="height-fields">{SECTION_ORDER.map((key) => <label key={key}><span>{SECTION_LABELS[key]}<small>min {MIN_SECTION_HEIGHTS[key]}</small></span><input type="number" min={MIN_SECTION_HEIGHTS[key]} value={content.section_heights[key]} onChange={(event) => updateHeights(setSectionHeight(content.section_heights, key, Number(event.target.value)))} /></label>)}</div><button type="button" className="reset-layout" onClick={() => updateHeights({ ...DEFAULT_SECTION_HEIGHTS })}><RotateCcw /> Reset layout</button><p className="height-help">Drag the neon separators in Live Preview or enter exact pixel heights.</p></div></details>
      <details open><summary><b>01</b> Concept <ChevronRight /></summary><div className="form-section"><Field label="Concept title" value={content.concept.title} max={32} onChange={(value) => update((c) => ({ ...c, concept: { ...c.concept, title: value } }))} /><label className="field"><span>Icon</span><select value={content.concept.icon} onChange={(e) => update((c) => ({ ...c, concept: { ...c.concept, icon: e.target.value as IconKey } }))}><option value="grid">Grid</option><option value="braces">Braces</option><option value="layers">Layers</option><option value="network">Network</option><option value="database">Database</option></select></label><Field label="Short introduction" value={content.concept.description} max={140} multiline onChange={(value) => update((c) => ({ ...c, concept: { ...c.concept, description: value } }))} /></div></details>
      <details open><summary><b>02</b> Core idea <ChevronRight /></summary><div className="form-section">
        <CoreBulletList values={content.core.bullets} onChange={(bullets) => update((c) => ({ ...c, core: { ...c.core, bullets } }))} />
        <div className="list-editor keyword-editor"><span className="field-label">Keyword chips<small>{content.core.keywords.length}/5</small></span><div className="keyword-fields">{content.core.keywords.map((keyword, index) => <div className="keyword-field" key={index}><input value={keyword} maxLength={18} placeholder={`Keyword ${index + 1}`} aria-label={`Core Idea keyword ${index + 1}`} onChange={(e) => update((c) => ({ ...c, core: { ...c.core, keywords: c.core.keywords.map((value, i) => i === index ? e.target.value : value) } }))} /><button type="button" disabled={content.core.keywords.length <= 1} aria-label={`Remove keyword ${index + 1}`} onClick={() => update((c) => ({ ...c, core: { ...c.core, keywords: c.core.keywords.filter((_, i) => i !== index) } }))}><Trash2 /></button></div>)}</div><button type="button" className="add-row" disabled={content.core.keywords.length >= 5} onClick={() => update((c) => ({ ...c, core: { ...c.core, keywords: [...c.core.keywords, ''] } }))}><Plus /> Add chip</button></div>
      </div></details>
      <details open><summary><b>03</b> Code proof <ChevronRight /></summary><div className="form-section"><Field label="Code proof (12 lines max)" value={content.proof.code} max={500} multiline onChange={(code) => update((c) => ({ ...c, proof: { ...c.proof, code } }))} /></div></details>
      <details open><summary><b>04</b> Visual flow <ChevronRight /></summary><div className="form-section"><div className="list-editor">{content.flow.map((step, index) => <div className="flow-fields" key={index}><span>{index + 1}</span><input value={step.title} maxLength={28} placeholder="Step title" onChange={(e) => update((c) => ({ ...c, flow: c.flow.map((v, i) => i === index ? { ...v, title: e.target.value } : v) }))} /><input value={step.detail} maxLength={52} placeholder="Step detail" onChange={(e) => update((c) => ({ ...c, flow: c.flow.map((v, i) => i === index ? { ...v, detail: e.target.value } : v) }))} /><button disabled={content.flow.length <= 2} onClick={() => update((c) => ({ ...c, flow: c.flow.filter((_, i) => i !== index) }))}><Trash2 /></button></div>)}<button className="add-row" disabled={content.flow.length >= 4} onClick={() => update((c) => ({ ...c, flow: [...c.flow, { title: 'New step', detail: 'Describe what happens' }] }))}><Plus /> Add step</button></div></div></details>
    </aside><section className="preview-panel"><div className="preview-label"><span>LIVE PREVIEW</span><small>1080 × 1920</small></div><PosterPreview content={content} title={poster.title} onHeightsChange={updateHeights} /></section></div>
  </main>
}
