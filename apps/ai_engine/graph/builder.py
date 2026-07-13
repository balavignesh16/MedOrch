from langgraph.graph import StateGraph, END
from apps.ai_engine.graph.state import AgentState
from apps.ai_engine.graph.nodes.router import router_node
from apps.ai_engine.graph.nodes.specialists import predictive_node, resource_node, health_econ_node
from apps.ai_engine.graph.nodes.research import research_node
from apps.ai_engine.graph.nodes.grc_firewall import grc_firewall_node

def route_to_specialist(state: AgentState):
    """Conditional edge from router to specialist"""
    return state.get("next_node", "predictive")

def build_graph():
    """Builds and compiles the LangGraph StateGraph"""
    workflow = StateGraph(AgentState)
    
    # Add Nodes
    workflow.add_node("router", router_node)
    workflow.add_node("predictive", predictive_node)
    workflow.add_node("resource", resource_node)
    workflow.add_node("health_econ", health_econ_node)
    workflow.add_node("research", research_node)
    workflow.add_node("grc_firewall", grc_firewall_node)
    
    # Add Edges
    workflow.set_entry_point("router")
    
    # Conditional routing from router to specialists
    workflow.add_conditional_edges(
        "router",
        route_to_specialist,
        {
            "predictive": "predictive",
            "resource": "resource",
            "health_econ": "health_econ"
        }
    )
    
    # All specialists route to research
    workflow.add_edge("predictive", "research")
    workflow.add_edge("resource", "research")
    workflow.add_edge("health_econ", "research")
    
    # Research routes to GRC Firewall
    workflow.add_edge("research", "grc_firewall")
    
    # GRC Firewall is the final node
    workflow.add_edge("grc_firewall", END)
    
    return workflow.compile()

# Global graph instance
app = build_graph()
