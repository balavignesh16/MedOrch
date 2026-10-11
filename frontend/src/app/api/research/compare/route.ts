import { requireSession } from '@/lib/auth/guard';
import { apiError } from '@/lib/apiResponse';
import { getDb } from '@/lib/analytics/cache';
import { ComparisonError, runCohortComparison, validateComparisonRequest } from '@/lib/analytics/cohortComparison';

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

  const validation = validateComparisonRequest(body);
  if (!validation.ok) return apiError('invalid_request', validation.error, 400);

  try {
    return Response.json(runCohortComparison(getDb(), validation.value));
  } catch (error) {
    if (error instanceof ComparisonError) return apiError('comparison_unavailable', error.message, 422);
    console.error('Cohort comparison failed:', error);
    return apiError('comparison_failed', 'The comparison could not be completed', 500);
  }
}
