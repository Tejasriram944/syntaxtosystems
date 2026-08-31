# Python Neon Poster Studio

A local full-stack editor for reusable 9:16 Python interview posters. The React interface talks to a FastAPI REST API backed by PostgreSQL, with a private Remotion service for six-second animated MP4 exports.

## Start locally

Docker Desktop (or another Docker Compose runtime) is required.

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api alembic upgrade head
docker compose exec api python -m app.seed
```

Open [http://localhost:5173](http://localhost:5173). API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Common commands

```bash
# See running services
docker compose ps

# Run backend tests
docker compose exec api pytest

# Build the frontend
docker compose exec frontend npm run build

# Test the video renderer
docker compose exec renderer npm test

# Stop the stack
docker compose down

# Stop and remove database data
docker compose down -v
```

The seed command is explicit and idempotent: it adds the supplied Hash Table example only when the poster table is empty. MP4 jobs are temporary, processed one at a time, and cleared automatically; they are not stored in PostgreSQL.
