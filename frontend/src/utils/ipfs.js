// IPFS Gateway URLs
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

// Get IPFS URL from hash
export function getIpfsUrl(hash) {
  // Use first gateway by default
  return `${IPFS_GATEWAYS[0]}${hash}`;
}

// Get multiple gateway URLs for fallback
export function getIpfsUrls(hash) {
  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}

/**
 * Upload file to IPFS using Pinata
 * You need to set PINATA_API_KEY and PINATA_SECRET_KEY in your .env
 */
export async function uploadToIPFS(file) {
  const apiKey = import.meta.env.VITE_PINATA_API_KEY;
  const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    // Fallback to local simulation for demo purposes
    console.warn('Pinata API keys not configured. Using simulated upload.');
    return simulateUpload(file);
  }

  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      type: file.type,
      size: file.size.toString()
    }
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 1
  });
  formData.append('pinataOptions', options);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload to IPFS');
    }

    const result = await response.json();
    return {
      hash: result.IpfsHash,
      url: getIpfsUrl(result.IpfsHash),
      size: file.size,
      name: file.name,
      type: file.type
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Upload using Web3.Storage (alternative to Pinata)
 * Requires VITE_WEB3_STORAGE_TOKEN
 */
export async function uploadToWeb3Storage(file) {
  const token = import.meta.env.VITE_WEB3_STORAGE_TOKEN;

  if (!token) {
    console.warn('Web3.Storage token not configured.');
    return simulateUpload(file);
  }

  try {
    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-NAME': file.name
      },
      body: file
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Web3.Storage');
    }

    const result = await response.json();
    return {
      hash: result.cid,
      url: getIpfsUrl(result.cid),
      size: file.size,
      name: file.name,
      type: file.type
    };
  } catch (error) {
    console.error('Web3.Storage upload error:', error);
    throw error;
  }
}

/**
 * Simulate IPFS upload for demo/testing
 * Generates a fake CID that looks realistic
 */
function simulateUpload(file) {
  return new Promise((resolve) => {
    // Simulate upload delay
    setTimeout(() => {
      // Generate a realistic-looking CID
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const hash = 'Qm' + Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 44);

      resolve({
        hash,
        url: getIpfsUrl(hash),
        size: file.size,
        name: file.name,
        type: file.type
      });
    }, 1500);
  });
}

/**
 * Check if an IPFS hash/CID is valid
 */
export function isValidCid(cid) {
  // Basic validation for CIDv0 (Qm...) and CIDv1 (ba...)
  if (!cid || typeof cid !== 'string') return false;
  if (cid.startsWith('Qm') && cid.length === 46) return true;
  if (cid.startsWith('ba') && cid.length >= 59) return true;
  return false;
}

/**
 * Fetch file from IPFS with fallback gateways
 */
export async function fetchFromIPFS(hash) {
  const urls = getIpfsUrls(hash);

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return url;
    } catch (error) {
      console.warn(`Gateway failed: ${url}`);
      continue;
    }
  }

  // Return first gateway as fallback
  return urls[0];
}
