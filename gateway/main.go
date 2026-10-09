package main

import (
	"io"
	"log"
	"net"
	"os"

	pb "github.com/medorch/gateway/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type server struct {
	pb.UnimplementedAnalyticsEngineServer
	engineAddress string
}

func (s *server) ProcessQuery(req *pb.QueryRequest, stream pb.AnalyticsEngine_ProcessQueryServer) error {
	log.Printf("API Gateway intercepting query [%s] for AGENT [%s]: %s", req.QueryId, req.AgentTarget, req.NaturalLanguagePrompt)

	// Dial the Python LangGraph Engine on port 50052
	conn, err := grpc.NewClient(s.engineAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("Failed to connect to Python Engine: %v", err)
		return err
	}
	defer conn.Close()

	client := pb.NewAnalyticsEngineClient(conn)

	// Forward the request to Python
	pythonStream, err := client.ProcessQuery(stream.Context(), req)
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
	gatewayAddress := envOrDefault("GATEWAY_ADDRESS", ":50051")
	engineAddress := envOrDefault("ANALYTICS_ENGINE_ADDRESS", "127.0.0.1:50052")
	lis, err := net.Listen("tcp", gatewayAddress)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterAnalyticsEngineServer(s, &server{engineAddress: engineAddress})

	log.Printf("API Gateway listening on %s and proxying to %s", gatewayAddress, engineAddress)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
