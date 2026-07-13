package main

import (
	"context"
	"io"
	"log"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	pb "github.com/medorch/gateway/pb"
)

type server struct {
	pb.UnimplementedAnalyticsEngineServer
}

func (s *server) ProcessQuery(req *pb.QueryRequest, stream pb.AnalyticsEngine_ProcessQueryServer) error {
	log.Printf("API Gateway intercepting query [%s] for AGENT [%s]: %s", req.QueryId, req.AgentTarget, req.NaturalLanguagePrompt)

	// Dial the Python LangGraph Engine on port 50052
	conn, err := grpc.Dial("localhost:50052", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("Failed to connect to Python Engine: %v", err)
		return err
	}
	defer conn.Close()

	client := pb.NewAnalyticsEngineClient(conn)

	// Forward the request to Python
	pythonStream, err := client.ProcessQuery(context.Background(), req)
	if err != nil {
		log.Printf("Error calling Python Engine: %v", err)
		return err
	}

	// Receive the stream from Python and pipe it directly to Next.js
	for {
		res, err := pythonStream.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error receiving from Python stream: %v", err)
			return err
		}

		// Send the chunk back to Next.js
		if err := stream.Send(res); err != nil {
			log.Printf("Error sending to Next.js stream: %v", err)
			return err
		}
	}

	log.Printf("Successfully proxied stream for query [%s]", req.QueryId)
	return nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterAnalyticsEngineServer(s, &server{})
	
	log.Printf("API Gateway (gRPC Proxy) listening on port 50051...")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
