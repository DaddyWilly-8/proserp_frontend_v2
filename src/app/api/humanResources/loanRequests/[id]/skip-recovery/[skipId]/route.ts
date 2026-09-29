import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; skipId: string }> }
) {
  const { id, skipId } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(
    `${API_BASE}/loan-requests/${id}/skip-recovery/${skipId}`,
    { method: 'DELETE', headers, credentials: 'include' }
  );

  return handleJsonResponse(res);
}
