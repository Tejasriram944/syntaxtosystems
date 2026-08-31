from contextlib import asynccontextmanager
from uuid import UUID, uuid4

import httpx
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .database import get_db
from .models import Poster
from .schemas import PosterCreate, PosterListItem, PosterResponse, PosterUpdate, VideoExportCreate, VideoExportJob


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title="Python Neon Poster Studio API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
async def health(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/posters", response_model=list[PosterListItem])
async def list_posters(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(Poster).order_by(Poster.updated_at.desc()))
    return list(result)


@app.post("/api/posters", response_model=PosterResponse, status_code=status.HTTP_201_CREATED)
async def create_poster(payload: PosterCreate, db: AsyncSession = Depends(get_db)):
    poster = Poster(title=payload.title, content=payload.content.model_dump(mode="json"))
    db.add(poster)
    await db.commit()
    await db.refresh(poster)
    return poster


async def get_poster_or_404(poster_id: UUID, db: AsyncSession) -> Poster:
    poster = await db.get(Poster, poster_id)
    if poster is None:
        raise HTTPException(status_code=404, detail="Poster not found")
    return poster


@app.get("/api/posters/{poster_id}", response_model=PosterResponse)
async def get_poster(poster_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_poster_or_404(poster_id, db)


@app.patch("/api/posters/{poster_id}", response_model=PosterResponse)
async def update_poster(poster_id: UUID, payload: PosterUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        update(Poster)
        .where(Poster.id == poster_id, Poster.revision == payload.revision)
        .values(
            title=payload.title,
            content=payload.content.model_dump(mode="json"),
            revision=Poster.revision + 1,
        )
        .returning(Poster)
    )
    poster = result.scalar_one_or_none()
    if poster is None:
        exists = await db.scalar(select(Poster.id).where(Poster.id == poster_id))
        if exists is None:
            raise HTTPException(status_code=404, detail="Poster not found")
        raise HTTPException(status_code=409, detail="This poster changed in another editor")
    await db.commit()
    await db.refresh(poster)
    return poster


@app.post("/api/posters/{poster_id}/duplicate", response_model=PosterResponse, status_code=201)
async def duplicate_poster(poster_id: UUID, db: AsyncSession = Depends(get_db)):
    source = await get_poster_or_404(poster_id, db)
    poster = Poster(title=f"{source.title} Copy"[:80], content=source.content)
    db.add(poster)
    await db.commit()
    await db.refresh(poster)
    return poster


@app.delete("/api/posters/{poster_id}", status_code=204)
async def delete_poster(poster_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(delete(Poster).where(Poster.id == poster_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Poster not found")
    await db.commit()
    return Response(status_code=204)


async def renderer_request(method: str, path: str, **kwargs) -> httpx.Response:
    try:
        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.request(method, f"{settings.renderer_url}{path}", **kwargs)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Video renderer is unavailable") from exc
    if response.status_code >= 400:
        detail = response.json().get("error", "Video renderer request failed") if response.headers.get("content-type", "").startswith("application/json") else "Video renderer request failed"
        raise HTTPException(status_code=response.status_code, detail=detail)
    return response


@app.post("/api/posters/{poster_id}/video-exports", response_model=VideoExportJob, status_code=202)
async def start_video_export(poster_id: UUID, payload: VideoExportCreate, db: AsyncSession = Depends(get_db)):
    poster = await get_poster_or_404(poster_id, db)
    job_id = uuid4()
    response = await renderer_request("POST", "/renders", json={
        "job_id": str(job_id),
        "title": poster.title,
        "content": PosterResponse.model_validate(poster).content.model_dump(mode="json"),
        "image_data_url": payload.image_data_url,
    })
    return response.json()


@app.get("/api/video-exports/{job_id}", response_model=VideoExportJob)
async def get_video_export(job_id: UUID):
    response = await renderer_request("GET", f"/renders/{job_id}")
    return response.json()


@app.get("/api/video-exports/{job_id}/download")
async def download_video_export(job_id: UUID):
    response = await renderer_request("GET", f"/renders/{job_id}/download")
    headers = {"Content-Disposition": response.headers.get("content-disposition", f'attachment; filename="poster-{job_id}-animated.mp4"')}
    return Response(content=response.content, media_type="video/mp4", headers=headers)
