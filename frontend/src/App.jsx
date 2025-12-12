import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LinkShortener from './components/LinkShortener';
import MediaUpload from './components/MediaUpload';
import RedirectPage from './components/RedirectPage';
import Footer from './components/Footer';

function App() {
  const [activeTab, setActiveTab] = useState('link');

  return (
    <div className="app">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <main className="main-content">
                <div className="hero">
                  <h1>Link.io</h1>
                  <p>
                    Decentralized link shortening and media sharing powered by Web3.
                    Your links and files, stored forever on the blockchain and IPFS.
                  </p>
                </div>

                <div className="tabs">
                  <button
                    className={`tab-btn ${activeTab === 'link' ? 'active' : ''}`}
                    onClick={() => setActiveTab('link')}
                  >
                    <LinkIcon />
                    Link Shortener
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
                    onClick={() => setActiveTab('media')}
                  >
                    <MediaIcon />
                    Media Sharing
                  </button>
                </div>

                {activeTab === 'link' ? <LinkShortener /> : <MediaUpload />}
              </main>
              <Footer />
            </>
          }
        />
        <Route path="/l/:shortCode" element={<RedirectPage type="link" />} />
        <Route path="/m/:shortCode" element={<RedirectPage type="media" />} />
      </Routes>
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function MediaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export default App;
