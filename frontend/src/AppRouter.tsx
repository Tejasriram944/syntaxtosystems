import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import './styles.css'

const FinalPoster = lazy(() => import('./pages/FinalPoster').then((module) => ({ default: module.FinalPoster })))

export default function AppRouter() {
  return <BrowserRouter><Suspense fallback={<main className="center-message">Preparing poster animation…</main>}><Routes><Route path="/" element={<Dashboard />} /><Route path="/editor/:id" element={<Editor />} /><Route path="/poster/:id" element={<FinalPoster />} /><Route path="*" element={<Dashboard />} /></Routes></Suspense></BrowserRouter>
}
