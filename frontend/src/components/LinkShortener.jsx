import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { createShortLink, getUserLinks, getStats } from '../utils/api';

function LinkShortener() {
  const { account, isConnected } = useWeb3();
  const [url, setUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [userLinks, setUserLinks] = useState([]);
  const [stats, setStats] = useState({ totalLinks: 0 });

  useEffect(() => {
    loadStats();
    if (account) {
      loadUserLinks();
    }
  }, [account]);

  const loadUserLinks = async () => {
    try {
      const links = await getUserLinks(account);
      setUserLinks(links.slice(0, 5));
    } catch (err) {
      console.error('Error loading user links:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats({ totalLinks: data.totalLinks });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setShortCode('');

    try {
      const linkData = await createShortLink(url, account);
      setShortCode(linkData.shortCode);
      loadStats();
      if (account) {
        loadUserLinks();
      }
      setUrl('');
    } catch (err) {
      console.error('Error creating short link:', err);
      setError(err.message || 'Failed to create short link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getFullShortUrl = (code) => {
    return `${window.location.origin}/l/${code}`;
  };

  return (
    <div className="card">
      <h2>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Shorten Your Link
      </h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Enter your long URL</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url/that/needs/shortening"
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="loading">
              <span className="spinner"></span>
              Creating Short Link...
            </span>
          ) : (
            'Shorten Link'
          )}
        </button>
      </form>

      {shortCode && (
        <div className="result-box">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Your Short Link is Ready!
          </h3>
          <div className="result-link">
            <input
              type="text"
              value={getFullShortUrl(shortCode)}
              readOnly
            />
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => copyToClipboard(getFullShortUrl(shortCode))}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Short code: <strong>{shortCode}</strong>
            {isConnected ? ' | Linked to your wallet' : ' | Share with anyone!'}
          </p>
        </div>
      )}

      {isConnected && (
        <>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalLinks}</div>
              <div className="stat-label">Total Links Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userLinks.length}</div>
              <div className="stat-label">Your Links</div>
            </div>
          </div>

          {userLinks.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Your Recent Links</h3>
              <div className="history-list">
                {userLinks.map((link) => (
                  <div key={link.shortCode} className="history-item">
                    <div>
                      <span className="short-code">/l/{link.shortCode}</span>
                      <div className="original">{link.originalUrl}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--primary)', fontWeight: '600' }}>
                        {link.clicks} clicks
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(link.createdAt * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LinkShortener;
