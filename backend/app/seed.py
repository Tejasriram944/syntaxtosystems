import asyncio

from sqlalchemy import func, select

from .database import SessionLocal
from .models import Poster
from .seed_data import HASH_TABLE_CONTENT


async def seed() -> None:
    async with SessionLocal() as db:
        count = await db.scalar(select(func.count()).select_from(Poster))
        if count:
            print("Posters already exist; seed skipped.")
            return
        db.add(Poster(title="Python Hash Table", content=HASH_TABLE_CONTENT))
        await db.commit()
        print("Seeded Python Hash Table poster.")


if __name__ == "__main__":
    asyncio.run(seed())

