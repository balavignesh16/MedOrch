import { readFileSync } from 'fs';
import path from 'path';
import { apiError } from '@/lib/apiResponse';
import type { AssistantCapabilitiesFile } from '@/lib/assistantTypes';

const REGISTRY_PATH = path.resolve(process.cwd(), '../config/assistant_capabilities.json');

export async function GET() {
  let raw: string;
  try {
    raw = readFileSync(REGISTRY_PATH, 'utf-8');
  } catch {
    return apiError('registry_unavailable', 'The assistant capability registry could not be loaded', 500);
  }

  let parsed: AssistantCapabilitiesFile;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return apiError('registry_invalid', 'The assistant capability registry is not valid JSON', 500);
  }

  return Response.json(parsed);
}
