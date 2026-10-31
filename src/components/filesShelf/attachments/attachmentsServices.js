import axios from "@/lib/services/config";

const attachmentsServices = {};

// Uploads the file straight to the S3 uploads bucket, then has /add pull it
// from there - the only way past Amplify's 6MB Lambda request limit.
// Returns null when no bucket is configured (501), so the caller falls back
// to the direct multipart upload.
const uploadViaBucket = async (postData) => {
  const { file } = postData;
  const contentType = file.type || 'application/octet-stream';

  let upload;
  try {
    ({ data: upload } = await axios.post('/api/attachment/upload-url', {
      filename: file.name,
      contentType,
      size: file.size,
    }));
  } catch (error) {
    if (error?.response?.status === 501) return null;
    throw error;
  }

  // Plain fetch, not the shared axios instance: its default headers and
  // withCredentials would break S3's CORS preflight and the URL's signature.
  const put = await fetch(upload.url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!put.ok) {
    throw new Error(`Upload to storage failed (${put.status})`);
  }

  const { data } = await axios.post('/api/attachment/add', {
    key: upload.key,
    filename: file.name,
    name: postData.name,
    attachmentable_id: postData.attachmentable_id,
    attachmentable_type: postData.attachmentable_type,
  });
  return data;
};

attachmentsServices.addAttachment = async(postData) => {
  const viaBucket = await uploadViaBucket(postData);
  if (viaBucket) return viaBucket;

  const formData = new FormData();
  formData.append('name', postData.name);
  formData.append('file', postData.file);
  formData.append('attachmentable_id', postData.attachmentable_id);
  formData.append('attachmentable_type', postData.attachmentable_type);

  // The shared axios instance defaults Content-Type to 'application/json'
  // (see lib/services/config.js). Left as-is, axios' own FormData handling
  // treats that as "the caller wants JSON" and actually JSON.stringifies
  // the FormData instead of sending it as a real multipart body — which is
  // why 'file' was showing up as '{}' (a File has no enumerable properties,
  // so it serializes to nothing) and Laravel never saw an uploaded file at
  // all. Explicitly unsetting it (not just omitting it) overrides that
  // instance default and lets the browser generate the correct
  // 'multipart/form-data; boundary=...' header itself.
  const { data } = await axios.post('/api/attachment/add', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

attachmentsServices.attachments = async(params) => {
  const {data} = await axios.get(`/api/attachment/getAttachments`,{
    params
  });
  return data;
}

attachmentsServices.deleteAttachment = async (id) => {
  const {data} = await axios.delete(`/api/attachment/${id}/delete`);
  return data;
};

attachmentsServices.updateAttachment = async(attachment) => {
  const {data} = await axios.put(`/api/attachment/${attachment.id}/update`,attachment)
  return data;
}

export default attachmentsServices;
