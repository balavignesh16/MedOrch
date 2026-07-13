"use server";

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// We need to point to the .proto file which is one level up in the monorepo
const PROTO_PATH = path.resolve(process.cwd(), '../protos/healthcare_analytics.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// @ts-ignore - Dynamic proto loading loses exact types without a generator
const analyticsProto = protoDescriptor.healthcare_analytics;

export async function submitAnalyticsQuery(prompt: string) {
  return new Promise((resolve, reject) => {
    // Connect to the Go Gateway at localhost:50051
    // @ts-ignore
    const client = new analyticsProto.AnalyticsEngine(
      'localhost:50051',
      grpc.credentials.createInsecure()
    );

    const request = {
      query_id: `q-${Date.now()}`,
      natural_language_prompt: prompt,
      user_id: "admin-123",
      session_id: "session-xyz"
    };

    client.ProcessQuery(request, (error: any, response: any) => {
      if (error) {
        console.error("gRPC Error:", error);
        reject(error.message || "Failed to connect to AI Gateway");
        return;
      }
      
      // Parse the JSON string payload from the Go Server
      try {
        const data = JSON.parse(response.visualization_data_json);
        resolve({
          summaryText: response.summary_text,
          data: data
        });
      } catch (e) {
        console.error("Failed to parse Gateway JSON:", e);
        reject("Invalid data format from Gateway");
      }
    });
  });
}
