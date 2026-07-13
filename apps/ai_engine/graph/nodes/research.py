def research_node(state: dict) -> dict:
    """
    Simulates a RAG lookup against Qdrant.
    """
    citations = state.get("citations", [])
    
    # Mock RAG lookup
    citations.append({
        "source_id": "doc_123",
        "title": "Hospital Resource Allocation in Peak Seasons",
        "abstract": "A study on how to manage ICU beds during sudden readmission spikes.",
        "url": "https://example.com/medical-journal/123",
        "relevance_score": 0.95
    })
    
    return {"citations": citations}
