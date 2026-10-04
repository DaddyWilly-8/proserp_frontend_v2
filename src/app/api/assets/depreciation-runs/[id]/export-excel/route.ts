import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/assets/depreciation-runs/${id}/export-excel`, {
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ message: 'Failed to generate the depreciation run export' }),
      { status: res.status }
    );
  }

  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': res.headers.get('content-disposition') || 'attachment; filename="Depreciation Run.xlsx"',
    },
  });
}
