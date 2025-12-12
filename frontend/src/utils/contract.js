// Base URL for short links
export const BASE_URL = 'link.io';

// Generate full short URL
export function getShortUrl(shortCode) {
  return `${window.location.origin}/${shortCode}`;
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Supported file types for media upload
export const SUPPORTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'application/pdf'
];

// Max file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
