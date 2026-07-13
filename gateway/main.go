package main

import (
	"context"
	"log"
	"net"

	"google.golang.org/grpc"
	pb "github.com/medorch/gateway/pb"
)

type server struct {
	pb.UnimplementedAnalyticsEngineServer
}

func (s *server) ProcessQuery(ctx context.Context, req *pb.QueryRequest) (*pb.InsightResponse, error) {
	log.Printf("Received query [%s]: %s", req.QueryId, req.NaturalLanguagePrompt)

	// MOCK DATA for Phase 4 UI Integration
	mockJson := `{
		"metrics": {
			"readmission_risk": {"value": "15.2%", "trend": "+1.4%", "isPositive": false},
			"active_patients": {"value": 1243, "trend": "-5", "isPositive": true},
			"icu_capacity": {"value": "82%", "trend": "Warning", "isPositive": false},
			"cost_impact": {"value": "$45,000", "trend": "-$2,100", "isPositive": true}
		}
	}`

	return &pb.InsightResponse{
		ResponseId:           "resp-" + req.QueryId,
		SummaryText:          "Based on current trends, the ICU capacity is nearing a critical threshold.",
		VisualizationDataJson: mockJson,
		PiiScrubbed:          true,
	}, nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterAnalyticsEngineServer(s, &server{})
	
	log.Printf("API Gateway (gRPC) listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
