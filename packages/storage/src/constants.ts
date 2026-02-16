export const R2_PATHS = {
  UPLOADS: 'uploads/',
  RESULTS: 'results/',
  QUARANTINE: 'quarantine/',
} as const;

export const PRESIGNED_URL_EXPIRY = 15 * 60; // 15 minutes in seconds
export const DOWNLOAD_URL_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
