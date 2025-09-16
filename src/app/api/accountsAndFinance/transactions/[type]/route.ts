import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest, context: any) {
  const { params } = context as { params: { type: string } };
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Remove "type" from query params to avoid duplication
  searchParams.delete('type');

  const query = searchParams.toString();

  // Special handling for debit/credit
  let endpoint: string;
  if (params.type === 'debit' || params.type === 'credit') {
    endpoint = `${API_BASE}/accounts/adjustment-notes/${params.type}`;
  } else {
    endpoint = `${API_BASE}/accounts/${params.type}`;
  }

  const res = await fetch(`${endpoint}${query ? `?${query}` : ''}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
