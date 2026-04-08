from pathlib import Path
import shutil

from fastapi import APIRouter, File, UploadFile, HTTPException

from app.services.parse_pdf import extract_pdf_text
from app.services.retrieve import add_documents

router = APIRouter()
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = UPLOAD_DIR / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pages = extract_pdf_text(str(file_path))
    if not pages:
        raise HTTPException(status_code=400, detail="No readable text found in PDF.")

    count = add_documents(pages)

    return {
        "message": "Upload successful",
        "file": file.filename,
        "pages_indexed": count,
        "pages_found": len(pages),
    }
