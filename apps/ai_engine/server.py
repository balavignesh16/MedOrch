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
        print(f"Received query request: {request.request_id} - '{request.prompt}'")
        
        # Initial State
        state = {
            "request_id": request.request_id,
            "original_prompt": request.prompt,
            "auth_metadata": {
                "user_id": request.auth_metadata.user_id,
                "role": request.auth_metadata.role,
                "department_id": request.auth_metadata.department_id,
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
                source_id=cit.get("source_id", ""),
                title=cit.get("title", ""),
                abstract=cit.get("abstract", ""),
                url=cit.get("url", ""),
                relevance_score=float(cit.get("relevance_score", 0.0))
            ))
            
        response = healthcare_analytics_pb2.InsightResponse(
            request_id=final_state.get("request_id", ""),
            textual_summary=final_state.get("textual_summary", ""),
            chart_data_json=json.dumps(final_state.get("chart_data", [])),
            citations=citations_proto,
            grc_scrubbed=final_state.get("grc_scrubbed", False)
        )
        
        return response
