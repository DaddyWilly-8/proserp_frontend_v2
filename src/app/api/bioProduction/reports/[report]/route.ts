import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;
type Params = { params: Promise<{ report: string }> };

/** The report as data (GET with the filters in the query). */
export async function GET(req: NextRequest, { params }: Params) {
  const { report } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const query = new URL(req.url).searchParams.toString();
  const res = await fetch(`${API_BASE}/bio-production/reports/${report}?${query}`, { headers });

  return handleJsonResponse(res);
}

/** The report as an Excel file (POST with the filters in the body). */
export async function POST(req: NextRequest, { params }: Params) {
  const { report } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/bio-production/reports/${report}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...(await req.json()), export: 'excel' }),
  });

  if (!res.ok) {
    return new Response(await res.text(), { status: res.status });
  }

  return new Response(await res.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${report}.xlsx"`,
    },
  });
}
