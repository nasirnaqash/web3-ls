import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLinkForRedirect, getMediaForView } from '../utils/api';
import { getIpfsUrl } from '../utils/ipfs';

function RedirectPage({ type }) {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mediaData, setMediaData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (type === 'link') {
          const data = await getLinkForRedirect(shortCode);

          if (!data) {
            setError('Link not found');
            setLoading(false);
            return;
          }

          // Redirect to the original URL
          window.location.href = data.originalUrl;
        } else if (type === 'media') {
          const data = await getMediaForView(shortCode);

          if (!data) {
            setError('Media not found');
            setLoading(false);
            return;
          }

          setMediaData({
            ...data,
            url: getIpfsUrl(data.ipfsHash)
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [shortCode, type]);

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="redirect-page">
        <div className="loading">
          <span className="spinner"></span>
          {type === 'link' ? 'Redirecting...' : 'Loading media...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="redirect-page">
        <h2>Oops!</h2>
        <p>{error}</p>
        <button className="submit-btn" style={{ maxWidth: '200px' }} onClick={() => navigate('/')}>
          Go Home
        </button>
      </div>
    );
  }

  if (type === 'media' && mediaData) {
    return (
      <div className="app">
        <header className="header">
          <a href="/" className="logo">
            Link<span>.io</span>
          </a>
        </header>

        <main className="main-content">
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ wordBreak: 'break-word' }}>{mediaData.fileName}</h2>

            <div className="media-preview" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              {mediaData.fileType.startsWith('image/') && (
                <img
                  src={mediaData.url}
                  alt={mediaData.fileName}
                  style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' }}
                />
              )}

              {mediaData.fileType.startsWith('video/') && (
                <video
                  src={mediaData.url}
                  controls
                  style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' }}
                />
              )}

              {mediaData.fileType.startsWith('audio/') && (
                <div style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎵</div>
                  <audio src={mediaData.url} controls style={{ width: '100%' }} />
                </div>
              )}

              {mediaData.fileType === 'application/pdf' && (
                <div style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
                  <a
                    href={mediaData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submit-btn"
                    style={{ display: 'inline-block', textDecoration: 'none' }}
                  >
                    View PDF
                  </a>
                </div>
              )}
            </div>

            <div className="stats" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-value">{mediaData.views}</div>
                <div className="stat-label">Views</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatFileSize(mediaData.fileSize)}</div>
                <div className="stat-label">File Size</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1rem' }}>{formatDate(mediaData.createdAt)}</div>
                <div className="stat-label">Uploaded</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href={mediaData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="submit-btn"
                style={{ flex: 1, textAlign: 'center', textDecoration: 'none', minWidth: '150px' }}
              >
                Open in IPFS
              </a>
              <a
                href={mediaData.url}
                download={mediaData.fileName}
                className="submit-btn"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  textDecoration: 'none',
                  minWidth: '150px',
                  background: 'var(--secondary)'
                }}
              >
                Download
              </a>
            </div>

            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              wordBreak: 'break-all'
            }}>
              IPFS Hash: {mediaData.ipfsHash}
            </p>
          </div>
        </main>

        <footer className="footer">
          <p>Powered by <a href="/">Link.io</a> - Decentralized on IPFS & Solana</p>
        </footer>
      </div>
    );
  }

  return null;
}

export default RedirectPage;
