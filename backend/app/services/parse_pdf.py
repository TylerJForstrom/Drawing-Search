from pathlib import Path
import fitz


def extract_pdf_text(file_path: str) -> list[dict]:
    path = Path(file_path)
    doc = fitz.open(path)
    pages = []

    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if text:
            pages.append(
                {
                    "page": i + 1,
                    "text": text,
                    "source": path.name,
                }
            )

    doc.close()
    return pages
