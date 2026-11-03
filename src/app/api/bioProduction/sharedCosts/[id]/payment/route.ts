import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

/** Posts the payment of a shared cost that was saved unpaid. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/bio-production/shared-costs/${id}/payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify(await req.json()),
  });

  return handleJsonResponse(res);
}
