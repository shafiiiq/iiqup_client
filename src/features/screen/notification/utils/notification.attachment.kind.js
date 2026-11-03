const EXTENSION_KINDS = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  heic: 'image',
  mp4: 'video',
  mov: 'video',
  mkv: 'video',
  webm: 'video',
  '3gp': 'video',
  m4a: 'audio',
  mp3: 'audio',
  wav: 'audio',
};

export const resolvePreviewKind = (mimeType, fileName) => {
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  if (mimeType?.startsWith('audio/')) return 'audio';
  const extension = fileName?.split('.').pop()?.toLowerCase();
  return EXTENSION_KINDS[extension] ?? 'document';
};