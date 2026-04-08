import json
import re
from pathlib import Path
from urllib.parse import quote

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


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def query_terms(query: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9]+", query.lower())
    return [w for w in words if len(w) > 2]


def keyword_score(text: str, terms: list[str]) -> tuple[float, list[str]]:
    lowered = text.lower()
    matched = []
    score = 0.0

    for term in terms:
        count = lowered.count(term)
        if count > 0:
            matched.append(term)
            score += min(count, 3) * 0.12

    if len(matched) >= 2:
        score += 0.15

    return min(score, 0.6), matched


def text_preview_with_match(text: str, terms: list[str], preview_len: int = 320) -> str:
    clean = normalize_text(text)
    lower = clean.lower()

    hit_index = -1
    for term in terms:
        idx = lower.find(term)
        if idx != -1:
            hit_index = idx
            break

    if hit_index == -1:
        return clean[:preview_len]

    start = max(0, hit_index - 90)
    end = min(len(clean), hit_index + preview_len - 90)
    snippet = clean[start:end]

    if start > 0:
        snippet = "..." + snippet
    if end < len(clean):
        snippet = snippet + "..."

    return snippet


def build_file_urls(filename: str, page: int):
    safe_name = quote(filename)
    base_url = f"http://127.0.0.1:8000/files/{safe_name}"
    page_url = f"{base_url}#page={page}"
    return base_url, page_url


def search_documents(query: str, top_k: int = 8):
    index = load_index()
    metadata = load_metadata()

    if index is None or not metadata:
        return []

    q_embedding = embed_query(query).astype(np.float32)
    search_k = min(max(top_k * 4, 20), len(metadata))

    distances, indices = index.search(q_embedding, search_k)
    terms = query_terms(query)

    rescored = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1 or idx >= len(metadata):
            continue

        item = metadata[idx]
        semantic_score = 1.0 / (1.0 + float(dist))
        k_score, matched_terms = keyword_score(item["text"], terms)
        final_score = semantic_score * 0.75 + k_score * 0.25
        file_url, page_url = build_file_urls(item["source"], item["page"])

        rescored.append(
            {
                "file": item["source"],
                "page": item["page"],
                "text_preview": text_preview_with_match(item["text"], terms),
                "semantic_score": round(semantic_score, 4),
                "keyword_score": round(k_score, 4),
                "score": round(final_score, 4),
                "matched_terms": matched_terms,
                "match_reason": (
                    f"Semantic similarity + keyword match ({', '.join(matched_terms[:4])})"
                    if matched_terms
                    else "Semantic similarity"
                ),
                "file_url": file_url,
                "page_url": page_url,
            }
        )

    rescored.sort(key=lambda x: x["score"], reverse=True)
    return rescored[:top_k]
