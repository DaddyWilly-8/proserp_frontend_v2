import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const force = req.nextUrl.searchParams.get('force');

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(
    `${API_BASE}/employer-contribution-types/${id}${force ? `?force=${force}` : ''}`,
    { method: 'DELETE', headers }
  );

  return handleJsonResponse(res);
}
