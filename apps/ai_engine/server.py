import sys
import os
import json

# Add the 'gen' directory to sys.path to easily import the pb2 modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'gen'))

import healthcare_analytics_pb2
import healthcare_analytics_pb2_grpc
from apps.ai_engine.graph.builder import app as langgraph_app

class AnalyticsEngineServicer(healthcare_analytics_pb2_grpc.AnalyticsEngineServicer):
    def ProcessQuery(self, request, context):
        print(f"Received query request: {request.query_id} - '{request.natural_language_prompt}'")
        
        # Initial State
        state = {
            "request_id": request.query_id,
            "original_prompt": request.natural_language_prompt,
            "auth_metadata": {
                "user_id": "system",
                "role": request.user_role,
                "department_id": "all",
            },
            "sql_query_drafts": [],
            "raw_db_results": [],
            "textual_summary": "",
            "chart_data": [],
            "citations": [],
            "grc_scrubbed": False,
            "next_node": None,
            "errors": []
        }
        
        # Invoke LangGraph
        try:
            # invoke() returns the final state
            final_state = langgraph_app.invoke(state)
        except Exception as e:
            print(f"Error during LangGraph execution: {e}")
            final_state = state
            final_state["textual_summary"] = f"Internal Engine Error: {e}"
            
        # Build Response
        citations_proto = []
        for cit in final_state.get("citations", []):
            citations_proto.append(healthcare_analytics_pb2.Citation(
                title=cit.get("title", ""),
                url=cit.get("url", ""),
                snippet=cit.get("snippet", "")
            ))
            
        combined_summary = json.dumps({
            "summary": final_state.get("textual_summary", ""),
            "reasoning": final_state.get("reasoning", "")
        })
        
        response = healthcare_analytics_pb2.InsightResponse(
            response_id=final_state.get("request_id", ""),
            summary_text=combined_summary,
            visualization_data_json=json.dumps(final_state.get("chart_data", [])),
            research_citations=citations_proto,
            pii_scrubbed=final_state.get("grc_scrubbed", False)
        )
        
        return response
