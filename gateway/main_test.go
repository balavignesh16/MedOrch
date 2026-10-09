package main

import "testing"

func TestEnvOrDefault(t *testing.T) {
	t.Setenv("MEDORCH_TEST_ADDRESS", "engine:50052")
	if got := envOrDefault("MEDORCH_TEST_ADDRESS", "fallback"); got != "engine:50052" {
		t.Fatalf("expected configured value, got %q", got)
	}

	if got := envOrDefault("MEDORCH_MISSING_ADDRESS", "fallback"); got != "fallback" {
		t.Fatalf("expected fallback value, got %q", got)
	}
}
