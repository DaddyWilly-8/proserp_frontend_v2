import { getAuthHeaders } from '@/lib/utils/apiUtils';
import {
  createUploadUrl,
  isUploadsBucketConfigured,
  MAX_S3_UPLOAD_BYTES,
} from '@/lib/utils/uploadsBucket';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Step 1 of a large upload: hands the browser a short-lived URL to PUT the
// file straight into S3. Answers 501 when no bucket is configured (e.g. local
// dev), and the client then falls back to sending the file to /add directly.
export async function POST(req: NextRequest) {
  const { response } = await getAuthHeaders(req);
  if (response) return response;

  if (!isUploadsBucketConfigured()) {
    return NextResponse.json({ message: 'Uploads bucket not configured' }, { status: 501 });
  }

  const { filename, contentType, size } = await req.json();

  if (typeof filename !== 'string' || typeof contentType !== 'string') {
    return NextResponse.json({ message: 'filename and contentType are required' }, { status: 422 });
  }
  if (typeof size !== 'number' || size > MAX_S3_UPLOAD_BYTES) {
    return NextResponse.json({ message: 'File is too large' }, { status: 413 });
  }

  return NextResponse.json(await createUploadUrl(filename, contentType));
}
