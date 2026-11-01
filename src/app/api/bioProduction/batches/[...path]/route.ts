import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

type Params = { params: Promise<{ path: string[] }> };

// A batch has many actions beneath it (batches/{id}/mortalities, .../inputs/{eventId}, ...), all
// forwarded unchanged to the same path on the back end.
const forward = async (req: NextRequest, { params }: Params, method: string) => {
  const { path } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const query = new URL(req.url).searchParams.toString();
  const hasBody = method === 'POST' || method === 'PUT';

  const res = await fetch(`${API_BASE}/bio-production/batches/${path.join('/')}${query ? `?${query}` : ''}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(await req.json().catch(() => ({}))) : undefined,
  });

  return handleJsonResponse(res);
};

export const GET = (req: NextRequest, ctx: Params) => forward(req, ctx, 'GET');
export const POST = (req: NextRequest, ctx: Params) => forward(req, ctx, 'POST');
export const PUT = (req: NextRequest, ctx: Params) => forward(req, ctx, 'PUT');
export const DELETE = (req: NextRequest, ctx: Params) => forward(req, ctx, 'DELETE');
