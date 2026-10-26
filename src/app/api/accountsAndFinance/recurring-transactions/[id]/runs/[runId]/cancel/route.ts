import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const { id, runId } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/accounts/recurring_transactions/${id}/runs/${runId}/cancel`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}
