import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

// Vercel's Node.js Serverless Functions cap the request body at 4.5MB,
// silently returning "Request Entity Too Large" before this handler ever
// runs - an attachment upload (allowed up to 30MB by the backend) routinely
// exceeds that. The Edge runtime streams the body instead of buffering it
// up front, so it isn't subject to that same cap.
export const runtime = 'edge';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);

  if (response) return response;

  // ❗ Remove Content-Type for FormData
  if (headers) {
    delete headers['Content-Type'];
  }

  const formData = await req.formData();

  const res = await fetch(`${API_BASE}/attachments`, {
    method: 'POST',
    headers: headers!,
    body: formData,
  });

  return handleJsonResponse(res);
}
