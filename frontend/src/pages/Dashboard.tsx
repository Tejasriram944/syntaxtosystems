import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Copy, FilePlus2, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { sampleContent } from '../lib/sample'
import type { PosterListItem } from '../types'

export function Dashboard() {
  const navigate = useNavigate()
  const [posters, setPosters] = useState<PosterListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => api.list().then(setPosters).catch((e) => setError(e.message)).finally(() => setLoading(false))
  useEffect(() => { void load() }, [])

  async function createPoster() {
    try { const poster = await api.create('Untitled Python Poster', sampleContent); navigate(`/editor/${poster.id}`) }
    catch (e) { setError((e as Error).message) }
  }
  async function duplicate(id: string) {
    try { await api.duplicate(id); load() } catch (e) { setError((e as Error).message) }
  }
  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return
    try { await api.remove(id); setPosters((items) => items.filter((item) => item.id !== id)) }
    catch (e) { setError((e as Error).message) }
  }

  return <main className="dashboard page-shell">
    <nav className="topbar"><a className="brand" href="/"><span>Py</span> POSTER STUDIO</a><button className="primary-button" onClick={createPoster}><FilePlus2 /> New poster</button></nav>
    <section className="dashboard-hero"><div className="eyebrow"><Sparkles /> PYTHON INTERVIEW PREP</div><h1>Turn syntax into<br /><em>visual systems.</em></h1><p>Create focused, high-impact Python concept posters in a reusable neon format.</p><div className="stat-row"><div><strong>{posters.length.toString().padStart(2, '0')}</strong><span>POSTERS</span></div><div><strong>9:16</strong><span>FORMAT</span></div><div><strong>1080P</strong><span>EXPORT</span></div></div></section>
    <section className="library-head"><div><span>YOUR LIBRARY</span><h2>Poster projects</h2></div><p>Autosaved to PostgreSQL</p></section>
    {error && <div className="notice error">{error}. Make sure the FastAPI service is running.</div>}
    {loading ? <div className="empty-state">Loading poster studio…</div> : posters.length === 0 ? <button className="empty-state create-empty" onClick={createPoster}><FilePlus2 /><b>Create your first poster</b><span>Start from the editable Hash Table example.</span></button> :
      <div className="poster-grid">{posters.map((poster, index) => <article className="poster-card" key={poster.id}><div className="card-preview"><span className="card-index">{String(index + 1).padStart(2, '0')}</span><div className="mini-poster"><b>PYTHON</b><i>LEVEL 2 • INTERVIEW IMPORTANT</i><strong>{poster.title}</strong><span /><span /><span /></div><button aria-label={`Open ${poster.title}`} onClick={() => navigate(`/editor/${poster.id}`)}><ArrowUpRight /></button></div><div className="card-copy"><small>UPDATED {new Date(poster.updated_at).toLocaleDateString()}</small><h3>{poster.title}</h3><div className="card-actions"><button onClick={() => navigate(`/editor/${poster.id}`)}><Pencil /> Edit</button><button onClick={() => duplicate(poster.id)}><Copy /> Duplicate</button><button className="danger" onClick={() => remove(poster.id, poster.title)} aria-label={`Delete ${poster.title}`}><Trash2 /></button></div></div></article>)}</div>}
  </main>
}
