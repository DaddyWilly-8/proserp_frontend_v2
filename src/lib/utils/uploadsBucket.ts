import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Server-only. Large uploads can't pass through an API route (Vercel rejects
// request bodies over 4.5MB, Amplify's Lambda over 6MB), so the browser PUTs
// the file straight to this bucket with a presigned URL, and the route then
// pulls it from S3 and forwards it to the backend - the limit only applies to
// what comes in.
//
// Amplify and Vercel both reserve the AWS_ prefix for env vars, hence the
// UPLOADS_ names. On Amplify the app's compute role supplies credentials and
// the key vars stay unset; Vercel has no such role, so it needs an IAM user's
// keys.
const BUCKET = process.env.UPLOADS_BUCKET;
const REGION = process.env.UPLOADS_BUCKET_REGION || 'us-east-1';
const ACCESS_KEY_ID = process.env.UPLOADS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.UPLOADS_SECRET_ACCESS_KEY;

// Every object we hand out lives under this prefix - routes refuse any other
// key, so a client can't point them at arbitrary objects.
export const UPLOAD_KEY_PREFIX = 'tmp-uploads/';

// Matches the backend's own attachment limit.
export const MAX_S3_UPLOAD_BYTES = 30 * 1024 * 1024;

let client: S3Client | null = null;
const s3 = () =>
  (client ??= new S3Client({
    region: REGION,
    ...(ACCESS_KEY_ID && SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: SECRET_ACCESS_KEY,
          },
        }
      : {}),
  }));

export const isUploadsBucketConfigured = () => !!BUCKET;

export const isValidUploadKey = (key: unknown): key is string =>
  typeof key === 'string' &&
  key.startsWith(UPLOAD_KEY_PREFIX) &&
  !key.includes('..');

export async function createUploadUrl(filename: string, contentType: string) {
  const safeName = filename.replace(/[^\w.\-]+/g, '_').slice(-100) || 'file';
  const key = `${UPLOAD_KEY_PREFIX}${crypto.randomUUID()}/${safeName}`;
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  );
  return { key, url };
}

export async function readUpload(key: string) {
  const res = await s3().send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  if (!res.Body) throw new Error('Uploaded file not found');
  if ((res.ContentLength ?? 0) > MAX_S3_UPLOAD_BYTES)
    throw new Error('Uploaded file too large');
  const bytes = await res.Body.transformToByteArray();
  return new Blob([bytes as BlobPart], {
    type: res.ContentType || 'application/octet-stream',
  });
}

export async function deleteUpload(key: string) {
  // Best effort - the bucket's lifecycle rule sweeps anything left behind.
  await s3()
    .send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    .catch(() => undefined);
}
