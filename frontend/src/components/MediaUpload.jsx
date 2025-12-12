import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { uploadToIPFS, getIpfsUrl } from '../utils/ipfs';
import { saveMediaMetadata, getUserMedia, getStats } from '../utils/api';
import { formatFileSize, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../utils/contract';

function MediaUpload() {
  const { account, isConnected } = useWeb3();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [shortCode, setShortCode] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [userMedia, setUserMedia] = useState([]);
  const [stats, setStats] = useState({ totalMedia: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadStats();
    if (account) {
      loadUserMedia();
    }
  }, [account]);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview(null);
  }, [file]);

  const loadUserMedia = async () => {
    try {
      const media = await getUserMedia(account);
      setUserMedia(media.slice(0, 5));
    } catch (err) {
      console.error('Error loading user media:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats({ totalMedia: data.totalMedia });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError('');
    setShortCode('');
    setIpfsHash('');

    if (!selectedFile) return;

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload images, videos, audio, or PDF files.');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 50MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress('Uploading to IPFS...');

    try {
      // Upload to IPFS
      const ipfsResult = await uploadToIPFS(file);
      setIpfsHash(ipfsResult.hash);
      setUploadProgress('Saving metadata...');

      // Save metadata to backend
      const mediaData = await saveMediaMetadata(
        ipfsResult.hash,
        file.name,
        file.type,
        file.size,
        account
      );

      setShortCode(mediaData.shortCode);
      loadStats();
      if (account) {
        loadUserMedia();
      }
      setUploadProgress('');
    } catch (err) {
      console.error('Error uploading media:', err);
      setError(err.message || 'Failed to upload media');
      setUploadProgress('');
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

  const getFullMediaUrl = (code) => {
    return `${window.location.origin}/m/${code}`;
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    return '📁';
  };

  return (
    <div className="card">
      <h2>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Upload & Share Media
      </h2>

      {error && <div className="error-message">{error}</div>}

      <div
        className={`file-upload ${dragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files[0])}
          accept={SUPPORTED_FILE_TYPES.join(',')}
        />
        <div className="file-upload-icon">📤</div>
        <p>
          Drag and drop your file here, or{' '}
          <span className="browse-link">browse</span>
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Supports images, videos, audio, and PDFs up to 50MB
        </p>
      </div>

      {file && (
        <div className="file-info">
          <span className="file-icon">{getFileIcon(file.type)}</span>
          <div className="file-details">
            <div className="file-name">{file.name}</div>
            <div className="file-size">{formatFileSize(file.size)}</div>
          </div>
          <button className="remove-file" onClick={removeFile}>×</button>
        </div>
      )}

      {preview && file?.type.startsWith('image/') && (
        <div className="media-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {preview && file?.type.startsWith('video/') && (
        <div className="media-preview">
          <video src={preview} controls />
        </div>
      )}

      <button
        className="submit-btn"
        onClick={handleUpload}
        disabled={isLoading || !file}
        style={{ marginTop: '1.5rem' }}
      >
        {isLoading ? (
          <span className="loading">
            <span className="spinner"></span>
            {uploadProgress || 'Uploading...'}
          </span>
        ) : (
          'Upload to IPFS'
        )}
      </button>

      {shortCode && (
        <div className="result-box">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Your Media Link is Ready!
          </h3>
          <div className="result-link">
            <input
              type="text"
              value={getFullMediaUrl(shortCode)}
              readOnly
            />
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => copyToClipboard(getFullMediaUrl(shortCode))}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Short code: <strong>{shortCode}</strong> | IPFS: <code style={{ fontSize: '0.75rem' }}>{ipfsHash.slice(0, 12)}...</code>
            {isConnected ? ' | Linked to your wallet' : ' | Share with anyone!'}
          </p>
          <a
            href={getIpfsUrl(ipfsHash)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', fontSize: '0.875rem' }}
          >
            View on IPFS Gateway
          </a>
        </div>
      )}

      {isConnected && (
        <>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalMedia}</div>
              <div className="stat-label">Total Media Uploaded</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userMedia.length}</div>
              <div className="stat-label">Your Uploads</div>
            </div>
          </div>

          {userMedia.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Your Recent Uploads</h3>
              <div className="history-list">
                {userMedia.map((item) => (
                  <div key={item.shortCode} className="history-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{getFileIcon(item.fileType)}</span>
                      <div>
                        <span className="short-code">/m/{item.shortCode}</span>
                        <div className="original">{item.fileName}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--primary)', fontWeight: '600' }}>
                        {item.views} views
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(item.fileSize)}
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

export default MediaUpload;
