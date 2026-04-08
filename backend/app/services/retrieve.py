import json
from pathlib import Path

import faiss
import numpy as np

from app.services.embed import embed_query, embed_texts

INDEX_DIR = Path("data/index")
INDEX_PATH = INDEX_DIR / "drawings.index"
META_PATH = INDEX_DIR / "metadata.json"


def _ensure_dirs():
    INDEX_DIR.mkdir(parents=True, exist_ok=True)


def load_metadata():
    if not META_PATH.exists():
        return []
    return json.loads(META_PATH.read_text())


def save_metadata(metadata):
    META_PATH.write_text(json.dumps(metadata, indent=2))


def create_empty_index(dim: int):
    return faiss.IndexFlatL2(dim)


def load_index():
    if not INDEX_PATH.exists():
        return None
    return faiss.read_index(str(INDEX_PATH))


def save_index(index):
    faiss.write_index(index, str(INDEX_PATH))


def add_documents(docs: list[dict]):
    _ensure_dirs()

    texts = [doc["text"] for doc in docs]
    embeddings = embed_texts(texts).astype(np.float32)

    index = load_index()
    metadata = load_metadata()

    if index is None:
        index = create_empty_index(embeddings.shape[1])

    index.add(embeddings)
    metadata.extend(docs)

    save_index(index)
    save_metadata(metadata)

    return len(docs)


def search_documents(query: str, top_k: int = 5):
    index = load_index()
    metadata = load_metadata()

    if index is None or not metadata:
        return []

    query_embedding = embed_query(query).astype(np.float32)
    distances, indices = index.search(query_embedding, top_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1 or idx >= len(metadata):
            continue
        item = metadata[idx]
        results.append(
            {
                "file": item["source"],
                "page": item["page"],
                "text_preview": item["text"][:400],
                "score": float(dist),
            }
        )

    return results
