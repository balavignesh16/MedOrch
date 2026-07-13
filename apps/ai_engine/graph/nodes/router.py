from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
import json

def router_node(state: dict) -> dict:
    """
    Analyzes the incoming prompt and decides which specialist node should handle it.
    Options: 'predictive', 'resource', 'health_econ'
    """
    prompt = state.get("original_prompt", "").lower()
    
    # We can use a simple keyword router or an LLM
    if "cost" in prompt or "financial" in prompt or "impact" in prompt:
        next_node = "health_econ"
    elif "bed" in prompt or "staff" in prompt or "resource" in prompt:
        next_node = "resource"
    else:
        next_node = "predictive"
        
    return {"next_node": next_node}
