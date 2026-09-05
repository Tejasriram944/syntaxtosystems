import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models import Base
from app.seed_data import HASH_TABLE_CONTENT


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not TEST_DATABASE_URL, reason="TEST_DATABASE_URL is not configured")


@pytest.mark.asyncio
async def test_crud_and_revision_conflict_against_postgres():
    engine = create_async_engine(TEST_DATABASE_URL)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async def override_db():
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            created = await client.post("/api/posters", json={"title": "Integration", "content": HASH_TABLE_CONTENT})
            assert created.status_code == 201
            poster = created.json()

            missing_image_export = await client.post(
                f"/api/posters/{poster['id']}/video-exports",
                json={"image_data_url": "data:image/png;base64," + "A" * 100},
            )
            assert missing_image_export.status_code == 409

            updated = await client.patch(
                f"/api/posters/{poster['id']}",
                json={"title": "Updated", "content": poster["content"], "revision": poster["revision"]},
            )
            assert updated.status_code == 200
            assert updated.json()["revision"] == 2

            conflict = await client.patch(
                f"/api/posters/{poster['id']}",
                json={"title": "Stale", "content": poster["content"], "revision": 1},
            )
            assert conflict.status_code == 409

            duplicated = await client.post(f"/api/posters/{poster['id']}/duplicate")
            assert duplicated.status_code == 201

            deleted = await client.delete(f"/api/posters/{poster['id']}")
            assert deleted.status_code == 204
    finally:
        app.dependency_overrides.clear()
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await engine.dispose()
