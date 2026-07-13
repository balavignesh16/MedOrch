import json
from apps.ai_engine.tools.sql_executor import execute_sql

def _base_specialist(state: dict, role: str) -> dict:
    """
    Base function for specialist nodes. 
    In a real implementation, this would use an LLM agent to generate SQL based on the prompt.
    For now, it returns dummy SQL execution depending on the role.
    """
    prompt = state.get("original_prompt", "")
    
    # Mock SQL generation based on role
    if role == "predictive":
        sql = "SELECT department, COUNT(*) as readmissions FROM admissions WHERE readmission_status = TRUE GROUP BY department LIMIT 10;"
    elif role == "resource":
        sql = "SELECT department, total_beds, occupied_beds, (total_beds - occupied_beds) as available_beds FROM resources;"
    elif role == "health_econ":
        sql = "SELECT SUM(base_cost * complication_multiplier) as total_impact FROM financials;"
    else:
        sql = "SELECT 1;"
        
    results = execute_sql(sql)
    
    # Mock textual summary and chart data formatting from the LLM
    textual_summary = f"{role.capitalize()} Agent processed the query. Found {len(results)} records."
    chart_data = results
    
    return {
        "sql_query_drafts": [sql],
        "raw_db_results": results,
        "textual_summary": textual_summary,
        "chart_data": chart_data
    }

def predictive_node(state: dict) -> dict:
    return _base_specialist(state, "predictive")

def resource_node(state: dict) -> dict:
    return _base_specialist(state, "resource")

def health_econ_node(state: dict) -> dict:
    return _base_specialist(state, "health_econ")
