package main

import (
	"context"
	"io"
	"net"
	"testing"
	"time"

	pb "github.com/medorch/gateway/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
)

// fakeEngine is a minimal stand-in for the Python engine used to exercise
// the gateway's forwarding, error-propagation, and cancellation behavior
// without any external dependency.
type fakeEngine struct {
	pb.UnimplementedAnalyticsEngineServer
	responses   []*pb.InsightResponse
	failWith    error
	blockUntil  <-chan struct{}
	sawCanceled chan struct{}
}

func (f *fakeEngine) ProcessQuery(req *pb.QueryRequest, stream pb.AnalyticsEngine_ProcessQueryServer) error {
	if f.blockUntil != nil {
		select {
		case <-f.blockUntil:
		case <-stream.Context().Done():
			if f.sawCanceled != nil {
				close(f.sawCanceled)
			}
			return stream.Context().Err()
		}
	}
	for _, resp := range f.responses {
		if err := stream.Send(resp); err != nil {
			return err
		}
	}
	if f.failWith != nil {
		return f.failWith
	}
	return nil
}

func startServer(t *testing.T, engine pb.AnalyticsEngineServer) string {
	t.Helper()
	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterAnalyticsEngineServer(s, engine)
	go func() { _ = s.Serve(lis) }()
	t.Cleanup(s.Stop)
	return lis.Addr().String()
}

func dialGateway(t *testing.T, gatewayAddress string) pb.AnalyticsEngineClient {
	t.Helper()
	conn, err := grpc.NewClient(gatewayAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("failed to dial gateway: %v", err)
	}
	t.Cleanup(func() { _ = conn.Close() })
	return pb.NewAnalyticsEngineClient(conn)
}

func TestGatewayForwardsExtendedFieldsUnchangedAndTerminatesOnce(t *testing.T) {
	final := &pb.InsightResponse{
		ResponseId:      "resp-1",
		SummaryText:     "3 encounters",
		ExecutedSql:     "SELECT COUNT(*) FROM hospital_readmissions;",
		ExecutionStatus: pb.ExecutionStatus_EXECUTION_STATUS_OK,
		ModelVersion:    "test-model",
		AuditId:         "audit-1",
		IsFinal:         true,
	}
	engine := &fakeEngine{responses: []*pb.InsightResponse{
		{ResponseId: "resp-1", ExecutionStatus: pb.ExecutionStatus_EXECUTION_STATUS_ANALYZING, IsFinal: false},
		final,
	}}
	engineAddr := startServer(t, engine)

	gatewayAddr := startServer(t, &server{engineAddress: engineAddr})
	client := dialGateway(t, gatewayAddr)

	stream, err := client.ProcessQuery(context.Background(), &pb.QueryRequest{QueryId: "q-1", NaturalLanguagePrompt: "count", AgentTarget: "general"})
	if err != nil {
		t.Fatalf("ProcessQuery failed: %v", err)
	}

	var received []*pb.InsightResponse
	for {
		resp, err := stream.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("unexpected stream error: %v", err)
		}
		received = append(received, resp)
	}

	finals := 0
	for _, resp := range received {
		if resp.IsFinal {
			finals++
		}
	}
	if finals != 1 {
		t.Fatalf("expected exactly one terminal response, got %d", finals)
	}
	last := received[len(received)-1]
	if last.ExecutedSql != final.ExecutedSql || last.AuditId != final.AuditId || last.ModelVersion != final.ModelVersion {
		t.Fatalf("gateway did not forward extended fields unchanged: %+v", last)
	}
}

func TestGatewayPropagatesDownstreamFailure(t *testing.T) {
	engine := &fakeEngine{failWith: status.Error(13, "engine internal failure detail")}
	engineAddr := startServer(t, engine)
	gatewayAddr := startServer(t, &server{engineAddress: engineAddr})
	client := dialGateway(t, gatewayAddr)

	stream, err := client.ProcessQuery(context.Background(), &pb.QueryRequest{QueryId: "q-2"})
	if err != nil {
		t.Fatalf("ProcessQuery failed: %v", err)
	}
	_, recvErr := stream.Recv()
	if recvErr == nil {
		t.Fatal("expected the downstream failure to propagate to the client")
	}
}

func TestGatewayPropagatesClientCancellation(t *testing.T) {
	block := make(chan struct{})
	sawCanceled := make(chan struct{})
	engine := &fakeEngine{blockUntil: block, sawCanceled: sawCanceled}
	engineAddr := startServer(t, engine)
	gatewayAddr := startServer(t, &server{engineAddress: engineAddr})
	client := dialGateway(t, gatewayAddr)

	ctx, cancel := context.WithCancel(context.Background())
	stream, err := client.ProcessQuery(ctx, &pb.QueryRequest{QueryId: "q-3"})
	if err != nil {
		t.Fatalf("ProcessQuery failed: %v", err)
	}
	go func() { _, _ = stream.Recv() }()
	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case <-sawCanceled:
	case <-time.After(5 * time.Second):
		t.Fatal("cancellation did not propagate to the downstream engine")
	}
}
