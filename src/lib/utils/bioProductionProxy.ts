import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

/**
 * Forwards a Next route to the same-shaped Bio Production endpoint on the
 * back end (bio-production/{resource}), so each resource's route files stay
 * two lines long.
 */
export const bioProductionCollection = (resource: string) => ({
  async GET(req: NextRequest) {
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const query = new URL(req.url).searchParams.toString();
    const res = await fetch(`${API_BASE}/bio-production/${resource}?${query}`, { headers });

    return handleJsonResponse(res);
  },

  async POST(req: NextRequest) {
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const res = await fetch(`${API_BASE}/bio-production/${resource}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(await req.json()),
    });

    return handleJsonResponse(res);
  },
});

type Params = { params: Promise<{ id: string }> };

export const bioProductionItem = (resource: string) => {
  const forward = async (req: NextRequest, { params }: Params, method: string) => {
    const { id } = await params;
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const res = await fetch(`${API_BASE}/bio-production/${resource}/${id}`, {
      method,
      headers,
      body: method === 'PUT' ? JSON.stringify(await req.json()) : undefined,
    });

    return handleJsonResponse(res);
  };

  return {
    GET: (req: NextRequest, ctx: Params) => forward(req, ctx, 'GET'),
    PUT: (req: NextRequest, ctx: Params) => forward(req, ctx, 'PUT'),
    DELETE: (req: NextRequest, ctx: Params) => forward(req, ctx, 'DELETE'),
  };
};

/**
 * Forwards everything beneath bio-production/{resource}/... (any depth, any method) unchanged, for
 * resources whose endpoints are many and shallow, such as the daily-record sheets.
 */
export const bioProductionTree = (resource: string) => {
  type TreeParams = { params: Promise<{ path: string[] }> };

  const forward = async (req: NextRequest, { params }: TreeParams, method: string) => {
    const { path } = await params;
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const query = new URL(req.url).searchParams.toString();
    const hasBody = method === 'POST' || method === 'PUT';

    const res = await fetch(`${API_BASE}/bio-production/${resource}/${path.join('/')}${query ? `?${query}` : ''}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(await req.json().catch(() => ({}))) : undefined,
    });

    return handleJsonResponse(res);
  };

  return {
    GET: (req: NextRequest, ctx: TreeParams) => forward(req, ctx, 'GET'),
    POST: (req: NextRequest, ctx: TreeParams) => forward(req, ctx, 'POST'),
    PUT: (req: NextRequest, ctx: TreeParams) => forward(req, ctx, 'PUT'),
    DELETE: (req: NextRequest, ctx: TreeParams) => forward(req, ctx, 'DELETE'),
  };
};
