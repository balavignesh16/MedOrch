package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	pb "github.com/medorch/gateway/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// Request structure expected from Next.js
type QueryPayload struct {
	Prompt string `json:"prompt"`
}

// Response structure to send back to Next.js
type ApiResponse struct {
	SummaryText  string      `json:"summary"`
	Metrics      interface{} `json:"metrics"`
	PiiScrubbed  bool        `json:"piiScrubbed"`
	Citations    interface{} `json:"citations"`
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins for dev
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func queryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}

	var payload QueryPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	
	log.Printf("Received proxy request for prompt: %s", payload.Prompt)

	// Connect to Python Engine gRPC Server
	conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("Did not connect to gRPC server: %v", err)
		http.Error(w, "Internal AI Engine Offline", http.StatusServiceUnavailable)
		return
	}
	defer conn.Close()

	client := pb.NewAnalyticsEngineClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()

	// Build gRPC Request
	req := &pb.QueryRequest{
		RequestId: "proxy-req-1",
		Prompt:    payload.Prompt,
		AuthMetadata: &pb.AuthMetadata{
			UserId:       "admin-1",
			Role:         "Administrator",
			DepartmentId: "sys-0",
		},
	}

	// Call Python Engine
	res, err := client.ProcessQuery(ctx, req)
	if err != nil {
		log.Printf("Could not process query via gRPC: %v", err)
		http.Error(w, "AI Engine Error", http.StatusInternalServerError)
		return
	}

	// Unmarshal chart data back into a Go map so it serializes properly as JSON (not a string)
	var chartData interface{}
	if res.ChartDataJson != "" {
		_ = json.Unmarshal([]byte(res.ChartDataJson), &chartData)
	}

	// Build Response for Next.js
	apiRes := ApiResponse{
		SummaryText: res.TextualSummary,
		Metrics:     chartData,
		PiiScrubbed: res.GrcScrubbed,
		Citations:   res.Citations,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apiRes)
}

func main() {
	http.HandleFunc("/api/query", enableCORS(queryHandler))

	log.Println("Go API Gateway running on port 8080. Forwarding to AI Engine on 50051.")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
