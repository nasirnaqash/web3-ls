import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Buffer } from 'buffer'
import App from './App'
import { Web3Provider } from './context/Web3Context'
import './index.css'

// Polyfill for Solana wallet adapters
window.Buffer = Buffer

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Web3Provider>
        <App />
      </Web3Provider>
    </BrowserRouter>
  </React.StrictMode>
)
