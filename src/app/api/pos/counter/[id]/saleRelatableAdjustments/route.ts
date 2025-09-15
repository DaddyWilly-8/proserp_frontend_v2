import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const res = await fetch(`${API_BASE}/relatable-adjustment-notes/sale/${params.id}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
