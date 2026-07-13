from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    request_id: str
    original_prompt: str
    auth_metadata: dict
    
    # Execution State
    sql_query_drafts: List[str]
    raw_db_results: List[Dict[str, Any]]
    
    # Final Payload State
    textual_summary: str
    chart_data: List[Dict[str, Any]]
    citations: List[dict]
    grc_scrubbed: bool
    
    # Internal Routing State
    next_node: Optional[str]
    errors: List[str]
