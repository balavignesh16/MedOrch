import { requireSession } from '@/lib/auth/guard';
import { apiError } from '@/lib/apiResponse';
import { getDb } from '@/lib/analytics/cache';
import { computeScenario, validateScenarioInput } from '@/lib/ml/scenario';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const guard = requireSession(request);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('invalid_request', 'Request body must be valid JSON', 400);
  }

  const validation = validateScenarioInput(body);
  if (!validation.ok) return apiError('invalid_request', validation.error, 400);

  try {
    return Response.json(computeScenario(getDb(), validation.value));
  } catch (error) {
    console.error('Scenario calculation failed:', error);
    return apiError('scenario_failed', 'The scenario could not be calculated. Has the model scored the database?', 500);
  }
}
