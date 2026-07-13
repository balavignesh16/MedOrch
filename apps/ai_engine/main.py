import grpc
from concurrent import futures
import sys
import os
import time

# Add the 'gen' directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'gen'))

import healthcare_analytics_pb2_grpc
from apps.ai_engine.server import AnalyticsEngineServicer

def serve():
    # Create gRPC server with max workers
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    
    # Register Servicer
    healthcare_analytics_pb2_grpc.add_AnalyticsEngineServicer_to_server(
        AnalyticsEngineServicer(), server
    )
    
    # Listen on port 50051
    port = "50051"
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    print(f"AI Engine gRPC Server running on port {port}")
    
    # Block thread
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == "__main__":
    serve()
