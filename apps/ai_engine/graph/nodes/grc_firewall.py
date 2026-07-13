import re

def grc_firewall_node(state: dict) -> dict:
    """
    Acts as a firewall to scrub PII (like synthetic SSNs) before returning.
    """
    summary = state.get("textual_summary", "")
    chart_data = state.get("chart_data", [])
    scrubbed = False
    
    # Simple regex to find SSN-like patterns (XXX-XX-XXXX)
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    
    if re.search(ssn_pattern, summary):
        summary = re.sub(ssn_pattern, "[REDACTED_SSN]", summary)
        scrubbed = True
        
    # Check chart data recursively (simplified for mock)
    for row in chart_data:
        for k, v in row.items():
            if isinstance(v, str) and re.search(ssn_pattern, v):
                row[k] = "[REDACTED_SSN]"
                scrubbed = True
                
    return {
        "textual_summary": summary,
        "chart_data": chart_data,
        "grc_scrubbed": scrubbed
    }
