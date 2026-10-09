import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function apiError(code: string, message: string, status: number): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: { code, message } }, { status });
}
