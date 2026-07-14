package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	_ "github.com/lib/pq"
	pb "github.com/medorch/gateway/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var db *sql.DB

func initDB() {
	var err error
	connStr := "user=admin password=password dbname=healthcare_analytics host=localhost port=5432 sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatalf("Error connecting to db: %v", err)
	}
}

type Patient struct {
	ID                int     `json:"id"`
	FirstName         string  `json:"firstName"`
	LastName          string  `json:"lastName"`
	Age               int     `json:"age"`
	Gender            string  `json:"gender"`
	BaselineRiskScore float64 `json:"baselineRiskScore"`
}

// Request structure expected from Next.js
type QueryPayload struct {
	Prompt string `json:"prompt"`
}

type LoginPayload struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

type ApiResponse struct {
	SummaryText  string      `json:"summary"`
	Reasoning    string      `json:"reasoning"`
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

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*180)
	defer cancel()

	// Build gRPC Request
	req := &pb.QueryRequest{
		QueryId: "proxy-req-1",
		NaturalLanguagePrompt:    payload.Prompt,
		UserRole:         "admin",
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
	if res.VisualizationDataJson != "" {
		_ = json.Unmarshal([]byte(res.VisualizationDataJson), &chartData)
	}

	// Unmarshal summary to extract reasoning
	var summaryData map[string]string
	_ = json.Unmarshal([]byte(res.SummaryText), &summaryData)

	// Build Response for Next.js
	apiRes := ApiResponse{
		SummaryText: summaryData["summary"],
		Reasoning:   summaryData["reasoning"],
		Metrics:     chartData,
		PiiScrubbed: res.PiiScrubbed,
		Citations:   res.ResearchCitations,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apiRes)
}

func patientsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT id, first_name, last_name, age, gender, baseline_risk_score FROM patients LIMIT 100")
	if err != nil {
		log.Printf("DB query error: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var patients []Patient
	for rows.Next() {
		var p Patient
		if err := rows.Scan(&p.ID, &p.FirstName, &p.LastName, &p.Age, &p.Gender, &p.BaselineRiskScore); err != nil {
			log.Printf("Row scan error: %v", err)
			continue
		}
		patients = append(patients, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(patients)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var payload LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	// Hardcoded dummy authentication for prototype
	if payload.Username == "admin" && payload.Password == "password" {
		json.NewEncoder(w).Encode(LoginResponse{Token: "dummy-jwt-token-medorch"})
	} else {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
	}
}

func addPatientHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var p Patient
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := db.QueryRow("INSERT INTO patients (first_name, last_name, age, gender, baseline_risk_score) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		p.FirstName, p.LastName, p.Age, p.Gender, p.BaselineRiskScore).Scan(&p.ID)
	if err != nil {
		log.Printf("Error inserting patient: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func updatePatientHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Just use query param or parse path manually for ID
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing patient ID", http.StatusBadRequest)
		return
	}

	var p Patient
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	_, err := db.Exec("UPDATE patients SET first_name=$1, last_name=$2, age=$3, gender=$4, baseline_risk_score=$5 WHERE id=$6",
		p.FirstName, p.LastName, p.Age, p.Gender, p.BaselineRiskScore, idStr)
	if err != nil {
		log.Printf("Error updating patient: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func main() {
	initDB()
	http.HandleFunc("/api/query", enableCORS(queryHandler))
	http.HandleFunc("/api/patients", enableCORS(patientsHandler))
	http.HandleFunc("/api/patients/add", enableCORS(addPatientHandler))
	http.HandleFunc("/api/patients/update", enableCORS(updatePatientHandler))
	http.HandleFunc("/api/login", enableCORS(loginHandler))

	log.Println("Go API Gateway running on port 8080. Forwarding to AI Engine on 50051.")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
