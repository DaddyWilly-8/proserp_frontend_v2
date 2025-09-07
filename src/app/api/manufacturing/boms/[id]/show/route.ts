// File: /app/api/manufacturing/boms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest, context: any) {
  try {
    const { params } = context;
    const bomId = params.id; // This gets the dynamic [id] from the route
    
    const { headers, response } = await getAuthHeaders(request);
    if (response) return response;

    // Forward to your Laravel backend
    const res = await fetch(`${API_BASE}/boms/${params.id}`, {
      headers,
      credentials: 'include',
    });

    return handleJsonResponse(res);
  } catch (error) {
    console.error('BOM fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BOM' },
      { status: 500 }
    );
  }
}