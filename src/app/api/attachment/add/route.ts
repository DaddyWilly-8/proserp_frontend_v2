import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { deleteUpload, isValidUploadKey, readUpload } from '@/lib/utils/uploadsBucket';
import { NextRequest, NextResponse } from 'next/server';

// Node rather than Edge: the S3 SDK needs it. Large files no longer arrive in
// this request's body (see below), so the Edge runtime's streaming - which
// only worked around Vercel's 4.5MB body cap anyway - isn't needed.
export const runtime = 'nodejs';

const API_BASE = process.env.API_BASE_URL!;

// Two ways in:
//  - JSON { key, filename, name, attachmentable_id, attachmentable_type }: the
//    browser already PUT the file into the uploads bucket (via /upload-url),
//    so it's pulled from S3 here. This is how files past Amplify's 6MB
//    Lambda body limit get through - the limit only applies to requests
//    coming in, not to this route's own request to the backend.
//  - multipart FormData: the original direct upload, kept as the fallback
//    when no bucket is configured.
export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);

  if (response) return response;

  // ❗ Remove Content-Type for FormData
  if (headers) {
    delete headers['Content-Type'];
  }

  let formData: FormData;
  let uploadKey: string | null = null;

  if (req.headers.get('content-type')?.includes('application/json')) {
    const { key, filename, name, attachmentable_id, attachmentable_type } = await req.json();

    if (!isValidUploadKey(key)) {
      return NextResponse.json({ message: 'Invalid upload key' }, { status: 422 });
    }
    uploadKey = key;

    formData = new FormData();
    formData.append('name', name);
    formData.append('file', await readUpload(key), filename);
    formData.append('attachmentable_id', String(attachmentable_id));
    formData.append('attachmentable_type', attachmentable_type);
  } else {
    formData = await req.formData();
  }

  try {
    const res = await fetch(`${API_BASE}/attachments`, {
      method: 'POST',
      headers: headers!,
      body: formData,
    });

    return handleJsonResponse(res);
  } finally {
    if (uploadKey) await deleteUpload(uploadKey);
  }
}
