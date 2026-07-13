package main

import (
	"log"
	"net"
	"strings"
	"time"

	"google.golang.org/grpc"
	pb "github.com/medorch/gateway/pb"
)

type server struct {
	pb.UnimplementedAnalyticsEngineServer
}

func (s *server) ProcessQuery(req *pb.QueryRequest, stream pb.AnalyticsEngine_ProcessQueryServer) error {
	log.Printf("Received query [%s]: %s", req.QueryId, req.NaturalLanguagePrompt)

	// The full text we want to stream
	fullSummary := "Based on current trends, the ICU capacity is nearing a critical threshold. We recommend reallocating staff from the general ward."
	words := strings.Split(fullSummary, " ")

	// MOCK DATA for Phase 4 UI Integration
	mockJson := `{
		"metrics": {
			"readmission_risk": {"value": "15.2%", "trend": "+1.4%", "isPositive": false},
			"active_patients": {"value": 1243, "trend": "-5", "isPositive": true},
			"icu_capacity": {"value": "82%", "trend": "Warning", "isPositive": false},
			"cost_impact": {"value": "$45,000", "trend": "-$2,100", "isPositive": true}
		}
	}`

	currentSummary := ""

	// Stream the text word-by-word
	for _, word := range words {
		currentSummary += word + " "
		
		res := &pb.InsightResponse{
			ResponseId:           "resp-" + req.QueryId,
			SummaryText:          strings.TrimSpace(currentSummary),
			VisualizationDataJson: mockJson, // In a real app, send JSON only once or at the end
			PiiScrubbed:          true,
		}
		
		if err := stream.Send(res); err != nil {
			return err
		}
		
		// Artificial delay to simulate LLM token generation
		time.Sleep(50 * time.Millisecond)
	}

	return nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterAnalyticsEngineServer(s, &server{})
	
	log.Printf("API Gateway (gRPC Server Streaming) listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
