import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  // due_date/customer_reference/terms_and_instructions, when this org generates a real Customer
  // Invoice for the claim — see ProjectClaimInvoiceDialog. Tolerate an empty body (older callers).
  const body = await req.text();

  const res = await fetch(`${API_BASE}/project-payment-claims/${id}/invoice`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: body || undefined,
  });

  return handleJsonResponse(res);
}
