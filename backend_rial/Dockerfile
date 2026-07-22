# ─────────────────────────────────────────────────────────────
# ForgeAI Backend — Production Dockerfile
#
# Build context: repo ROOT (e.g. `docker build -f backend_rial/Dockerfile .`)
# The image is deployed to Railway / Render / Fly.io.
#
# WHY both backend_rial and backend_ai are copied:
#   ai_client.py resolves backend_ai/ai/client.py at runtime via sys.path.
#   Both directories must be present inside the container.
# ─────────────────────────────────────────────────────────────

FROM python:3.11-slim

# Keeps Python from generating .pyc files on the drive
ENV PYTHONDONTWRITEBYTECODE=1
# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first (layer-cached independently of source changes)
COPY backend_rial/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend_rial source
COPY backend_rial/ ./backend_rial/

# Copy backend_ai so ai_client.py can resolve its sys.path import
COPY backend_ai/ ./backend_ai/

# Working directory is the FastAPI app
WORKDIR /app/backend_rial

# Create the sessions directory (file-based session storage)
RUN mkdir -p sessions

EXPOSE 8000

# Railway injects the PORT env var; fall back to 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
