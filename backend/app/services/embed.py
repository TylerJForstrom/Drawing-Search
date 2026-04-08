from sentence_transformers import SentenceTransformer

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_texts(texts: list[str]):
    model = get_model()
    return model.encode(texts, convert_to_numpy=True)


def embed_query(text: str):
    model = get_model()
    return model.encode([text], convert_to_numpy=True)
