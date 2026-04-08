from fastapi import APIRouter

from app.models.schemas import SearchRequest
from app.services.retrieve import search_documents

router = APIRouter()


@router.post("/search")
def search(request: SearchRequest):
    results = search_documents(request.query, request.top_k)
    return {"results": results}
