import type { Poster, PosterContent, PosterListItem } from '../types'
import { normalizePoster } from './posterNormalization'

export interface VideoExportJob { job_id: string; status: 'queued' | 'rendering' | 'complete' | 'failed'; progress: number; error?: string | null; download_url?: string | null }

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Request failed' }))
    const error = new Error(body.detail ?? 'Request failed') as Error & { status: number }
    error.status = response.status
    throw error
  }
  if (response.status === 204) return undefined as T
  return response.json()
}
export const api = {
  list: () => request<PosterListItem[]>('/posters'),
  get: (id: string) => request<Poster>(`/posters/${id}`).then(normalizePoster),
  create: (title: string, content: PosterContent) => request<Poster>('/posters', { method: 'POST', body: JSON.stringify({ title, content }) }).then(normalizePoster),
  update: (poster: Poster) => request<Poster>(`/posters/${poster.id}`, { method: 'PATCH', body: JSON.stringify({ title: poster.title, content: poster.content, revision: poster.revision }) }).then(normalizePoster),
  duplicate: (id: string) => request<Poster>(`/posters/${id}/duplicate`, { method: 'POST' }).then(normalizePoster),
  remove: (id: string) => request<void>(`/posters/${id}`, { method: 'DELETE' }),
  startVideoExport: (id: string, imageDataUrl: string) => request<VideoExportJob>(`/posters/${id}/video-exports`, { method: 'POST', body: JSON.stringify({ image_data_url: imageDataUrl }) }),
  getVideoExport: (jobId: string) => request<VideoExportJob>(`/video-exports/${jobId}`),
  videoDownloadUrl: (jobId: string) => `${API_URL}/video-exports/${jobId}/download`,
}
