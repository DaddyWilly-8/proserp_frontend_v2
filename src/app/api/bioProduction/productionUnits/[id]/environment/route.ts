import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

type Params = { params: Promise<{ id: string }> };

// A unit's latest readings and trends.
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const query = new URL(req.url).searchParams.toString();
  const res = await fetch(`${API_BASE}/bio-production/production-units/${id}/environment${query ? `?${query}` : ''}`, { headers });

  return handleJsonResponse(res);
}
