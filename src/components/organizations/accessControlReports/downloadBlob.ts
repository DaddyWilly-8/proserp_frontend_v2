export function downloadBlob(data: BlobPart, mimeType: string, filename: string) {
  const blob = new Blob([data], { type: mimeType });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(link.href);
}

export const MIME_TYPES = {
  pdf: 'application/pdf',
};
