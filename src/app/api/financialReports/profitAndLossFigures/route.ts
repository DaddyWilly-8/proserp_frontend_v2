import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const apiUrl = new URL(`${API_BASE}/accounts/profit-and-loss-figures`);

  const incoming = new URL(req.url);

  incoming.searchParams.forEach((value, key) => {
    apiUrl.searchParams.append(key, value);
  });

  const res = await fetch(apiUrl.toString(), {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
