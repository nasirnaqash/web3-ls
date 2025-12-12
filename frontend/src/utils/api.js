// API service for backend communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============ LINK FUNCTIONS ============

// Create a short link
export async function createShortLink(originalUrl, walletAddress = null) {
  const response = await fetch(`${API_URL}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalUrl,
      creator: walletAddress || 'anonymous'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create short link');
  }

  return response.json();
}

// Get link data by short code
export async function getLinkData(shortCode) {
  const response = await fetch(`${API_URL}/links/${shortCode}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to get link data');
  }

  return response.json();
}

// Get link and increment clicks (for redirect)
export async function getLinkForRedirect(shortCode) {
  const response = await fetch(`${API_URL}/links/${shortCode}/redirect`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to get link');
  }

  return response.json();
}

// Get user's links
export async function getUserLinks(walletAddress) {
  if (!walletAddress) return [];

  const response = await fetch(`${API_URL}/users/${walletAddress}/links`);

  if (!response.ok) {
    throw new Error('Failed to get user links');
  }

  return response.json();
}

// ============ MEDIA FUNCTIONS ============

// Save media metadata
export async function saveMediaMetadata(ipfsHash, fileName, fileType, fileSize, walletAddress = null) {
  const response = await fetch(`${API_URL}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ipfsHash,
      fileName,
      fileType,
      fileSize,
      creator: walletAddress || 'anonymous'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save media metadata');
  }

  return response.json();
}

// Get media data by short code
export async function getMediaData(shortCode) {
  const response = await fetch(`${API_URL}/media/${shortCode}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to get media data');
  }

  return response.json();
}

// Get media and increment views
export async function getMediaForView(shortCode) {
  const response = await fetch(`${API_URL}/media/${shortCode}/view`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to get media');
  }

  return response.json();
}

// Get user's media
export async function getUserMedia(walletAddress) {
  if (!walletAddress) return [];

  const response = await fetch(`${API_URL}/users/${walletAddress}/media`);

  if (!response.ok) {
    throw new Error('Failed to get user media');
  }

  return response.json();
}

// ============ STATS FUNCTIONS ============

export async function getStats() {
  const response = await fetch(`${API_URL}/stats`);

  if (!response.ok) {
    throw new Error('Failed to get stats');
  }

  return response.json();
}

// Check if API is available
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
