// Set this to the max file size you want to allow (currently 10MB for resume uploads).
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/*',
  'video/quicktime',
  'video/mp4',
] as const;
