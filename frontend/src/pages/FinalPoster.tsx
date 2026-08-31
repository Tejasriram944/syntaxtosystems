import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react'
import { toPng } from 'html-to-image'
import { Player } from '@remotion/player'
import { api, type VideoExportJob } from '../lib/api'
import { PNG_EXPORT_OPTIONS } from '../lib/pngExport'
import { PosterCanvas, type PosterMotion } from '../components/PosterCanvas'
import { PosterVideo } from '../components/PosterVideo'
import type { Poster } from '../types'

export function FinalPoster() {
  const { id = '' } = useParams()
  const [poster, setPoster] = useState<Poster | null>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [videoJob, setVideoJob] = useState<VideoExportJob | null>(null)
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [exportMotion, setExportMotion] = useState<PosterMotion>('still')
  const posterRef = useRef<HTMLDivElement>(null)
  useEffect(() => { api.get(id).then(setPoster).catch((e) => setError(e.message)) }, [id])
  const activeVideoJobId = videoJob && ['queued', 'rendering'].includes(videoJob.status) ? videoJob.job_id : null
  useEffect(() => {
    if (!activeVideoJobId) return
    const timer = window.setInterval(() => api.getVideoExport(activeVideoJobId).then((job) => { setVideoJob(job); if (job.status === 'complete') { window.clearInterval(timer); const link = document.createElement('a'); link.href = api.videoDownloadUrl(job.job_id); link.click() } }).catch((requestError) => setVideoJob((current) => current ? { ...current, status: 'failed', error: (requestError as Error).message } : current)), 800)
    return () => window.clearInterval(timer)
  }, [activeVideoJobId])
  async function download() {
    if (!posterRef.current || !poster) return
    setExporting(true)
    try {
      await document.fonts.ready
      setExportMotion('still')
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const dataUrl = await toPng(posterRef.current, PNG_EXPORT_OPTIONS)
      const link = document.createElement('a')
      link.download = `${poster.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
      link.href = dataUrl
      link.click()
    } finally { setExporting(false) }
  }
  async function downloadVideo() {
    if (!poster || videoJob?.status === 'queued' || videoJob?.status === 'rendering') return
    try {
      if (!posterRef.current) return
      await document.fonts.ready
      setExportMotion('base')
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const imageDataUrl = await toPng(posterRef.current, PNG_EXPORT_OPTIONS)
      setVideoJob(await api.startVideoExport(poster.id, imageDataUrl))
    }
    catch (requestError) { setVideoJob({ job_id: '', status: 'failed', progress: 0, error: (requestError as Error).message }) }
    finally { setExportMotion('still') }
  }
  if (error) return <main className="center-message"><h1>{error}</h1><Link to="/">Back to dashboard</Link></main>
  if (!poster) return <main className="center-message">Preparing final poster…</main>
  const videoBusy = videoJob?.status === 'queued' || videoJob?.status === 'rendering'
  return <main className="final-page"><header><Link to={`/editor/${poster.id}`}><ArrowLeft /> Back to editor</Link><div className="final-title"><span>FINAL POSTER</span><b>{poster.title}</b></div><div className="export-actions"><button className="secondary-button" onClick={download} disabled={exporting}>{exporting ? <LoaderCircle className="spin" /> : <Download />}{exporting ? 'Exporting…' : 'PNG'}</button><button className="primary-button" onClick={downloadVideo} disabled={videoBusy}>{videoBusy ? <LoaderCircle className="spin" /> : <Download />}{videoBusy ? `${Math.round((videoJob?.progress ?? 0) * 100)}%` : videoJob?.status === 'failed' ? 'Retry MP4' : 'MP4'}</button></div></header>{videoJob?.status === 'failed' && <div className="video-error">Video export failed: {videoJob.error ?? 'Please retry.'}</div>}<div className="final-stage"><div className="final-poster"><Player component={PosterVideo} inputProps={{ content: poster.content, title: poster.title }} durationInFrames={180} compositionWidth={1080} compositionHeight={1920} fps={30} controls autoPlay={!reduceMotion} loop style={{ width: '100%', height: '100%' }} /></div></div><div className="export-still" aria-hidden="true"><PosterCanvas ref={posterRef} content={poster.content} title={poster.title} motion={exportMotion} /></div></main>
}
