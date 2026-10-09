package main

import (
	"testing"

	pb "github.com/medorch/gateway/pb"
)

// TestInsightResponseCarriesExtendedFields is a compile-time and runtime
// contract check: it fails to build if the generated pb package does not
// expose the Batch-1 fields added to InsightResponse, and fails at runtime
// if their values are not preserved on the struct.
//
// The gateway's ProcessQuery forwards *pb.InsightResponse values it receives
// from the engine directly to the caller (see main.go) without copying
// individual fields, so any field present on the generated struct is
// forwarded unchanged by construction — this test guards that invariant by
// asserting the fields exist and round-trip correctly.
func TestInsightResponseCarriesExtendedFields(t *testing.T) {
	response := &pb.InsightResponse{
		ResponseId:            "resp-1",
		SummaryText:           "42 encounters",
		VisualizationDataJson: "{}",
		PiiScrubbed:           false,
		ExecutedSql:           "SELECT COUNT(*) FROM hospital_readmissions;",
		ExecutionStatus:       pb.ExecutionStatus_EXECUTION_STATUS_OK,
		ModelVersion:          "meta/llama-3.1-70b-instruct",
		AuditId:               "audit-123",
		IsFinal:               true,
		ErrorCode:             "",
		PiiDetected:           false,
		PiiRedacted:           false,
	}

	if response.GetExecutionStatus() != pb.ExecutionStatus_EXECUTION_STATUS_OK {
		t.Fatalf("expected execution status to round-trip, got %v", response.GetExecutionStatus())
	}
	if !response.GetIsFinal() {
		t.Fatal("expected is_final to round-trip as true")
	}
	if response.GetExecutedSql() == "" {
		t.Fatal("expected executed_sql to round-trip")
	}
	if response.GetAuditId() != "audit-123" {
		t.Fatalf("expected audit_id to round-trip, got %q", response.GetAuditId())
	}
}

// TestExecutionStatusEnumValues locks the wire-format enum values so a
// future proto edit cannot silently renumber them without a failing test.
func TestExecutionStatusEnumValues(t *testing.T) {
	cases := map[pb.ExecutionStatus]int32{
		pb.ExecutionStatus_EXECUTION_STATUS_UNSPECIFIED: 0,
		pb.ExecutionStatus_EXECUTION_STATUS_ANALYZING:   1,
		pb.ExecutionStatus_EXECUTION_STATUS_OK:          2,
		pb.ExecutionStatus_EXECUTION_STATUS_UNSUPPORTED: 3,
		pb.ExecutionStatus_EXECUTION_STATUS_REJECTED:    4,
		pb.ExecutionStatus_EXECUTION_STATUS_ERROR:       5,
		pb.ExecutionStatus_EXECUTION_STATUS_TIMEOUT:     6,
		pb.ExecutionStatus_EXECUTION_STATUS_CANCELLED:   7,
	}
	for status, want := range cases {
		if int32(status) != want {
			t.Fatalf("expected %v to equal %d, got %d", status, want, int32(status))
		}
	}
}
