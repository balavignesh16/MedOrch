import grpc
import time
import json
import sys
import os
from concurrent import futures
from typing import Dict, Any, TypedDict, Annotated
from operator import add

# Import the generated gRPC classes
import healthcare_analytics_pb2
import healthcare_analytics_pb2_grpc

# LangGraph imports
from langgraph.graph import StateGraph, START, END

# Define the state for our LangGraph Agents
class AgentState(TypedDict):
    query: str
    agent_type: str
    response_text: str

# ---- MOCK AGENT NODES ---- #

def triage_agent(state: AgentState) -> AgentState:
    # Simulate clinical triage logic
    query = state["query"].lower()
    if "cardiac" in query or "heart" in query:
        text = "Patient shows signs of acute cardiac distress. Immediate triage to Cardiology ICU is recommended."
    else:
        text = "Patient symptoms require standard observation. Proceed with regular intake protocols."
    return {"response_text": text}

def optimization_agent(state: AgentState) -> AgentState:
    text = "Based on current trends, ICU capacity is at 82% (Warning). Recommend reallocating 2 nurses from the general ward to maintain optimal ratios."
    return {"response_text": text}

def grc_agent(state: AgentState) -> AgentState:
    text = "Query processed under HIPAA guidelines. PII has been scrubbed from this dataset. No unauthorized access attempts detected."
    return {"response_text": text}

def predictive_agent(state: AgentState) -> AgentState:
    text = "Predictive model indicates a 15.2% increase in readmission risk over the next 30 days for this cohort. Estimated cost impact: $45,000."
    return {"response_text": text}

def default_agent(state: AgentState) -> AgentState:
    text = "I am the MedOrch Global AI Assistant. How can I help you manage your clinical operations today?"
    return {"response_text": text}

# ---- BUILD THE GRAPH ---- #

workflow = StateGraph(AgentState)

workflow.add_node("triage", triage_agent)
workflow.add_node("optimization", optimization_agent)
workflow.add_node("grc", grc_agent)
workflow.add_node("predictive", predictive_agent)
workflow.add_node("default", default_agent)

def router(state: AgentState):
    agent = state["agent_type"]
    if agent == "clinical_triage": return "triage"
    if agent == "resource_optimization": return "optimization"
    if agent == "cyber_grc": return "grc"
    if agent == "predictive_analytics": return "predictive"
    return "default"

workflow.add_conditional_edges(START, router)

workflow.add_edge("triage", END)
workflow.add_edge("optimization", END)
workflow.add_edge("grc", END)
workflow.add_edge("predictive", END)
workflow.add_edge("default", END)

app = workflow.compile()

# ---- gRPC SERVER ---- #

class AnalyticsEngineServicer(healthcare_analytics_pb2_grpc.AnalyticsEngineServicer):
    def ProcessQuery(self, request, context):
        print(f"Received query for [{request.agent_target}]: {request.natural_language_prompt}")
        
        # 1. Run the LangGraph Multi-Agent Workflow
        initial_state = {
            "query": request.natural_language_prompt,
            "agent_type": request.agent_target,
            "response_text": ""
        }
        
        final_state = app.invoke(initial_state)
        full_text = final_state["response_text"]

        # 2. Mock Data for charts
        mock_json = json.dumps({
            "metrics": {
                "readmission_risk": {"value": "15.2%", "trend": "+1.4%", "isPositive": False},
                "active_patients": {"value": 1243, "trend": "-5", "isPositive": True},
                "icu_capacity": {"value": "82%", "trend": "Warning", "isPositive": False},
                "cost_impact": {"value": "$45,000", "trend": "-$2,100", "isPositive": True}
            }
        })

        # 3. Stream the response back (Simulate LLM typing)
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
            time.sleep(0.05) # 50ms artificial delay

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    healthcare_analytics_pb2_grpc.add_AnalyticsEngineServicer_to_server(
        AnalyticsEngineServicer(), server
    )
    server.add_insecure_port('[::]:50052')
    print("Python LangGraph Engine listening on port 50052...")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
