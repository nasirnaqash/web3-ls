// Local storage service for links and media
// This allows features to work without wallet connection

const LINKS_KEY = 'linkio_links';
const MEDIA_KEY = 'linkio_media';
const STATS_KEY = 'linkio_stats';

// Generate a random short code
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Get all links from storage
export function getLinks() {
  try {
    const links = localStorage.getItem(LINKS_KEY);
    return links ? JSON.parse(links) : {};
  } catch {
    return {};
  }
}

// Get all media from storage
export function getMedia() {
  try {
    const media = localStorage.getItem(MEDIA_KEY);
    return media ? JSON.parse(media) : {};
  } catch {
    return {};
  }
}

// Get stats from storage
export function getStats() {
  try {
    const stats = localStorage.getItem(STATS_KEY);
    return stats ? JSON.parse(stats) : { totalLinks: 0, totalMedia: 0 };
  } catch {
    return { totalLinks: 0, totalMedia: 0 };
  }
}

// Save stats to storage
function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Create a short link
export function createShortLink(originalUrl, walletAddress = null) {
  const links = getLinks();
  const stats = getStats();

  // Generate unique short code
  let shortCode = generateShortCode();
  while (links[shortCode]) {
    shortCode = generateShortCode();
  }

  const linkData = {
    shortCode,
    originalUrl,
    creator: walletAddress || 'anonymous',
    createdAt: Math.floor(Date.now() / 1000),
    clicks: 0
  };

  links[shortCode] = linkData;
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));

  // Update stats
  stats.totalLinks++;
  saveStats(stats);

  return linkData;
}

// Get link data by short code
export function getLinkData(shortCode) {
  const links = getLinks();
  return links[shortCode] || null;
}

// Check if link exists
export function linkExists(shortCode) {
  const links = getLinks();
  return !!links[shortCode];
}

// Increment link clicks
export function incrementLinkClicks(shortCode) {
  const links = getLinks();
  if (links[shortCode]) {
    links[shortCode].clicks++;
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  }
}

// Get user's links (by wallet address or all if anonymous)
export function getUserLinks(walletAddress = null) {
  const links = getLinks();
  const allLinks = Object.values(links);

  if (walletAddress) {
    return allLinks
      .filter(link => link.creator === walletAddress)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Return all links for anonymous users (their session)
  return allLinks
    .filter(link => link.creator === 'anonymous')
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Upload media metadata
export function saveMediaMetadata(ipfsHash, fileName, fileType, fileSize, walletAddress = null) {
  const media = getMedia();
  const stats = getStats();

  // Generate unique short code
  let shortCode = generateShortCode();
  while (media[shortCode]) {
    shortCode = generateShortCode();
  }

  const mediaData = {
    shortCode,
    ipfsHash,
    fileName,
    fileType,
    fileSize,
    creator: walletAddress || 'anonymous',
    createdAt: Math.floor(Date.now() / 1000),
    views: 0
  };

  media[shortCode] = mediaData;
  localStorage.setItem(MEDIA_KEY, JSON.stringify(media));

  // Update stats
  stats.totalMedia++;
  saveStats(stats);

  return mediaData;
}

// Get media data by short code
export function getMediaData(shortCode) {
  const media = getMedia();
  return media[shortCode] || null;
}

// Check if media exists
export function mediaExists(shortCode) {
  const media = getMedia();
  return !!media[shortCode];
}

// Increment media views
export function incrementMediaViews(shortCode) {
  const media = getMedia();
  if (media[shortCode]) {
    media[shortCode].views++;
    localStorage.setItem(MEDIA_KEY, JSON.stringify(media));
  }
}

// Get user's media (by wallet address or all if anonymous)
export function getUserMedia(walletAddress = null) {
  const media = getMedia();
  const allMedia = Object.values(media);

  if (walletAddress) {
    return allMedia
      .filter(item => item.creator === walletAddress)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Return all media for anonymous users (their session)
  return allMedia
    .filter(item => item.creator === 'anonymous')
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Get total links count
export function getTotalLinks() {
  return getStats().totalLinks;
}

// Get total media count
export function getTotalMedia() {
  return getStats().totalMedia;
}
