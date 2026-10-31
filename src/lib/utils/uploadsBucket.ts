import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Server-only. Large uploads can't pass through an Amplify API route (Lambda
// rejects request bodies over 6MB), so the browser PUTs the file straight to
// this bucket with a presigned URL, and the route then pulls it from S3 and
// forwards it to the backend - Lambda's limit only applies to what comes in.
//
// Credentials come from the Amplify app's compute role. Amplify reserves the
// AWS_ prefix for env vars, hence UPLOADS_BUCKET_REGION.
const BUCKET = process.env.UPLOADS_BUCKET;
const REGION = process.env.UPLOADS_BUCKET_REGION || 'us-east-1';

// Every object we hand out lives under this prefix - routes refuse any other
// key, so a client can't point them at arbitrary objects.
export const UPLOAD_KEY_PREFIX = 'tmp-uploads/';

// Matches the backend's own attachment limit.
export const MAX_S3_UPLOAD_BYTES = 30 * 1024 * 1024;

let client: S3Client | null = null;
const s3 = () => (client ??= new S3Client({ region: REGION }));

export const isUploadsBucketConfigured = () => !!BUCKET;

export const isValidUploadKey = (key: unknown): key is string =>
  typeof key === 'string' && key.startsWith(UPLOAD_KEY_PREFIX) && !key.includes('..');

export async function createUploadUrl(filename: string, contentType: string) {
  const safeName = filename.replace(/[^\w.\-]+/g, '_').slice(-100) || 'file';
  const key = `${UPLOAD_KEY_PREFIX}${crypto.randomUUID()}/${safeName}`;
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
  return { key, url };
}

export async function readUpload(key: string) {
  const res = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) throw new Error('Uploaded file not found');
  if ((res.ContentLength ?? 0) > MAX_S3_UPLOAD_BYTES) throw new Error('Uploaded file too large');
  const bytes = await res.Body.transformToByteArray();
  return new Blob([bytes as BlobPart], { type: res.ContentType || 'application/octet-stream' });
}

export async function deleteUpload(key: string) {
  // Best effort - the bucket's lifecycle rule sweeps anything left behind.
  await s3()
    .send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    .catch(() => undefined);
}
