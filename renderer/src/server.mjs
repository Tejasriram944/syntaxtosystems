import express from 'express'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const app = express()
app.use(express.json({ limit: '16mb' }))

const root = path.dirname(fileURLToPath(import.meta.url))
const outputDir = process.env.RENDER_OUTPUT_DIR ?? '/tmp/poster-video-exports'
await fs.mkdir(outputDir, { recursive: true })
const serveUrl = await bundle({ entryPoint: path.join(root, 'index.tsx') })
const jobs = new Map()
const queue = []
let processing = false

const publicJob = (job) => ({ job_id: job.job_id, status: job.status, progress: job.progress, error: job.error ?? null, download_url: job.status === 'complete' ? `/renders/${job.job_id}/download` : null })
const validHeights = (heights) => heights && ['concept', 'core', 'proof', 'flow'].every((key) => Number.isInteger(heights[key])) && heights.concept + heights.core + heights.proof + heights.flow === 1635

async function processQueue() {
  if (processing || queue.length === 0) return
  processing = true
  const job = queue.shift()
  job.status = 'rendering'
  try {
    const inputProps = { image_data_url: job.image_data_url, section_heights: job.section_heights }
    const composition = await selectComposition({ serveUrl, id: 'PosterVideo', inputProps })
    await renderMedia({ composition, serveUrl, codec: 'h264', muted: true, chromiumOptions: { enableMultiProcessOnLinux: true }, outputLocation: job.output, inputProps, onProgress: ({ progress }) => { job.progress = progress } })
    job.progress = 1
    job.status = 'complete'
  } catch (error) {
    job.status = 'failed'
    job.error = error instanceof Error ? error.message : 'Unknown rendering error'
  } finally {
    processing = false
    void processQueue()
  }
}

app.get('/health', (_request, response) => response.json({ status: 'ok' }))
app.post('/renders', (request, response) => {
  const { job_id, title, content, image_data_url } = request.body ?? {}
  if (typeof job_id !== 'string' || jobs.has(job_id) || typeof image_data_url !== 'string' || !image_data_url.startsWith('data:image/png;base64,') || !validHeights(content?.section_heights)) return response.status(422).json({ error: 'Invalid render request' })
  const safeTitle = String(title ?? 'poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'poster'
  const job = { job_id, status: 'queued', progress: 0, title: safeTitle, image_data_url, section_heights: content.section_heights, output: path.join(outputDir, `${job_id}.mp4`), created_at: Date.now() }
  jobs.set(job_id, job)
  queue.push(job)
  void processQueue()
  response.status(202).json(publicJob(job))
})
app.get('/renders/:jobId', (request, response) => { const job = jobs.get(request.params.jobId); return job ? response.json(publicJob(job)) : response.status(404).json({ error: 'Video export not found' }) })
app.get('/renders/:jobId/download', async (request, response) => { const job = jobs.get(request.params.jobId); if (!job) return response.status(404).json({ error: 'Video export not found' }); if (job.status !== 'complete') return response.status(409).json({ error: 'Video export is not complete' }); return response.download(job.output, `${job.title}-animated.mp4`) })

setInterval(async () => { const cutoff = Date.now() - 60 * 60 * 1000; for (const [id, job] of jobs) if (job.created_at < cutoff && !['queued', 'rendering'].includes(job.status)) { jobs.delete(id); await fs.rm(job.output, { force: true }) } }, 10 * 60 * 1000).unref()

app.listen(Number(process.env.PORT ?? 8001), '0.0.0.0')
