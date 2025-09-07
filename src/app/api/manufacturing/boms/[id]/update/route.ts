// File: /app/api/manufacturing/boms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function PUT(req: NextRequest, context: any) {
  const { params } = context;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/boms/${params.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}

export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/boms/${params.id}`, {
    method: 'GET',
    headers,
  });

  return handleJsonResponse(res);
}