from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.upload import router as upload_router
from app.routes.search import router as search_router

app = FastAPI(title="Kahua Drawing Search")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")
app.include_router(search_router, prefix="/api")

uploads_dir = Path("data/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)

app.mount("/files", StaticFiles(directory=str(uploads_dir)), name="files")


@app.get("/")
def root():
    return {"message": "Kahua Drawing Search API running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
