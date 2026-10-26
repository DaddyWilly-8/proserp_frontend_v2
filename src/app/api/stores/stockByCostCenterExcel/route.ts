import { NextRequest } from 'next/server';
import { getAuthHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();

  const res = await fetch(`${API_BASE}/stock_by_cost_center`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, export: 'excel' }),
  });

  if (!res.ok) {
    return new Response(await res.text(), { status: res.status });
  }

  const arrayBuffer = await res.arrayBuffer();

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="stock_by_cost_center.xlsx"',
    },
  });
}
