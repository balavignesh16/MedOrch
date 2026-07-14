import re

def grc_firewall_node(state: dict) -> dict:
    """
    Acts as a firewall to scrub PII (like synthetic SSNs) before returning.
    """
    summary = state.get("textual_summary", "")
    chart_data = state.get("chart_data", [])
    scrubbed = False
    
    # Regex patterns
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'
    
    if re.search(ssn_pattern, summary):
        summary = re.sub(ssn_pattern, "[REDACTED_SSN]", summary)
        scrubbed = True
    if re.search(phone_pattern, summary):
        summary = re.sub(phone_pattern, "[REDACTED_PHONE]", summary)
        scrubbed = True
    if re.search(email_pattern, summary):
        summary = re.sub(email_pattern, "[REDACTED_EMAIL]", summary)
        scrubbed = True
        
    # Check chart data recursively (simplified for mock)
    for row in chart_data:
        if isinstance(row, dict):
            for k, v in row.items():
                if isinstance(v, str):
                    if re.search(ssn_pattern, v):
                        row[k] = "[REDACTED_SSN]"
                        scrubbed = True
                    if re.search(phone_pattern, v):
                        row[k] = "[REDACTED_PHONE]"
                        scrubbed = True
                    if re.search(email_pattern, v):
                        row[k] = "[REDACTED_EMAIL]"
                        scrubbed = True
                
    return {
        "textual_summary": summary,
        "chart_data": chart_data,
        "grc_scrubbed": scrubbed
    }
