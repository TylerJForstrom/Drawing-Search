from fastapi import APIRouter, HTTPException

from app.models.schemas import SearchRequest
from app.services.retrieve import search_documents

router = APIRouter()


@router.post("/search")
def search(request: SearchRequest):
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    results = search_documents(query, request.top_k)
    return {
        "query": query,
        "count": len(results),
        "results": results,
    }
