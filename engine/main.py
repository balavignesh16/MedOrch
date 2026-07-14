import grpc
import time
import json
import sys
import os
from concurrent import futures

import healthcare_analytics_pb2
import healthcare_analytics_pb2_grpc

from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.base import create_sql_agent

NVIDIA_API_KEY = "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"
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

llm = ChatOpenAI(
    base_url=NVIDIA_BASE_URL,
    api_key=NVIDIA_API_KEY,
    model="openai/gpt-oss-20b",
    temperature=0,
    max_tokens=4096,
)

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'medorch.db'))
db = SQLDatabase.from_uri(f"sqlite:///{db_path}")

try:
    # Try to use tool calling if supported
    agent_executor = create_sql_agent(llm, db=db, agent_type="openai-tools", verbose=True, return_intermediate_steps=True)
except ValueError:
    # Fallback to standard ReAct agent if openai-tools is not supported
    agent_executor = create_sql_agent(llm, db=db, verbose=True, return_intermediate_steps=True)

class AnalyticsEngineServicer(healthcare_analytics_pb2_grpc.AnalyticsEngineServicer):
    def ProcessQuery(self, request, context):
        print(f"Received query for [{request.agent_target}]: {request.natural_language_prompt}")
        
        sql_query = None
        try:
            context_prefix = ""
            if request.agent_target == "clinical_triage":
                context_prefix = "You are a clinical triage agent. "
            elif request.agent_target == "billing":
                context_prefix = "You are a billing and finance agent. "
            
            prompt = context_prefix + request.natural_language_prompt
            result = agent_executor.invoke({"input": prompt})
            full_text = result["output"]
            
            # Extract SQL query from intermediate steps
            if "intermediate_steps" in result:
                for step, _ in result["intermediate_steps"]:
                    if step.tool == "sql_db_query":
                        sql_query = step.tool_input
                        # The tool_input might be a dict or a string depending on the agent type
                        if isinstance(sql_query, dict):
                            sql_query = sql_query.get("query", "")
                        break
        except Exception as e:
            print("Error executing SQL agent:", e)
            full_text = f"An error occurred while analyzing the database: {e}"

        mock_json_data = {
            "metrics": {
                "readmission_risk": {"value": "15.2%", "trend": "+1.4%", "isPositive": False},
                "active_patients": {"value": 1243, "trend": "-5", "isPositive": True},
                "icu_capacity": {"value": "82%", "trend": "Warning", "isPositive": False},
                "cost_impact": {"value": "$45,000", "trend": "-$2,100", "isPositive": True}
            }
        }
        if sql_query:
            mock_json_data["sql_query"] = sql_query
            
        mock_json = json.dumps(mock_json_data)

        words = full_text.split(" ")
        current_text = ""
        
        for word in words:
            current_text += word + " "
            response = healthcare_analytics_pb2.InsightResponse(
                response_id=f"resp-{request.query_id}",
                summary_text=current_text.strip(),
                visualization_data_json=mock_json,
                pii_scrubbed=True
            )
            yield response
            time.sleep(0.02)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    healthcare_analytics_pb2_grpc.add_AnalyticsEngineServicer_to_server(
        AnalyticsEngineServicer(), server
    )
    server.add_insecure_port('[::]:50052')
    print("Python LangChain Engine listening on port 50052...")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
