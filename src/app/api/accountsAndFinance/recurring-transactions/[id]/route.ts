import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/accounts/recurring_transactions/${id}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/accounts/recurring_transactions/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/accounts/recurring_transactions/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
