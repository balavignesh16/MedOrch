import { NextRequest } from 'next/server';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.resolve(process.cwd(), '../protos/healthcare_analytics.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// @ts-ignore
const analyticsProto = protoDescriptor.healthcare_analytics;

export async function POST(req: NextRequest) {
  const { prompt, agent_target } = await req.json();

  // @ts-ignore
  const client = new analyticsProto.AnalyticsEngine(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  const request = {
    query_id: `q-${Date.now()}`,
    natural_language_prompt: prompt,
    user_role: "admin",
    agent_target: agent_target || "global"
  };

  const stream = new ReadableStream({
    start(controller) {
      const call = client.ProcessQuery(request);

      call.on('data', (response: any) => {
        // Format as Server-Sent Events (SSE)
        const chunk = `data: ${JSON.stringify({
          summaryText: response.summary_text,
          visualizationDataJson: response.visualization_data_json
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(chunk));
      });

      call.on('end', () => {
        controller.close();
      });

      call.on('error', (error: any) => {
        console.error('gRPC Stream Error:', error);
        controller.error(error);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
