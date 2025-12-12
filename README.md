# Link.io - Web3 Link Shortener & Media Sharing

A decentralized link shortening and media sharing platform built on Ethereum and IPFS. Your links and files are stored forever on the blockchain.

## Features

- **Link Shortener**: Paste any URL and get a short link (`/l/abc123`)
- **Media Sharing**: Upload images, videos, audio, or PDFs and get a shareable link (`/m/xyz789`)
- **Decentralized Storage**: Media files stored on IPFS
- **On-chain Records**: All links and metadata stored on Ethereum
- **Analytics**: Track clicks and views for your content
- **Wallet Integration**: Connect with MetaMask or any Web3 wallet

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Frontend**: React 18, Vite, ethers.js v6
- **Storage**: IPFS (Pinata/Web3.Storage)
- **Blockchain**: Ethereum (Sepolia testnet for development)

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- (Optional) Pinata or Web3.Storage account for IPFS

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   cd frontend && npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Root directory - for smart contract deployment
   cp .env.example .env
   # Edit .env with your private key and RPC URL

   # Frontend directory - for the web app
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with contract address and IPFS keys
   ```

### Local Development

1. **Start local blockchain**:
   ```bash
   npm run node
   ```

2. **Deploy contract** (in a new terminal):
   ```bash
   npm run deploy:local
   ```
   Copy the deployed contract address.

3. **Update frontend config**:
   Edit `frontend/.env` and set `VITE_CONTRACT_ADDRESS` to the deployed address.

4. **Start frontend**:
   ```bash
   npm run dev
   ```

5. **Connect MetaMask** to localhost:8545

### Testnet Deployment (Sepolia)

1. Get Sepolia ETH from a faucet
2. Configure `.env` with your private key and Sepolia RPC URL
3. Deploy:
   ```bash
   npm run deploy:sepolia
   ```
4. Update `frontend/.env` with the deployed contract address

## Project Structure

```
link-io-web3/
├── contracts/
│   └── LinkIO.sol          # Main smart contract
├── scripts/
│   └── deploy.js           # Deployment script
├── test/
│   └── LinkIO.test.js      # Contract tests
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Web3 context provider
│   │   ├── utils/          # Contract ABI, IPFS helpers
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   └── index.html
├── hardhat.config.js       # Hardhat configuration
└── package.json
```

## Smart Contract

The `LinkIO` contract provides:

- `createShortLink(url)` - Create a short link, returns short code
- `uploadMedia(ipfsHash, fileName, fileType, fileSize)` - Store media metadata
- `getLink(shortCode)` - Get original URL (increments click count)
- `getMedia(shortCode)` - Get media data (increments view count)
- `getLinkData(shortCode)` - View link data without incrementing
- `getMediaData(shortCode)` - View media data without incrementing
- `getUserLinks(address)` - Get all links created by a user
- `getUserMedia(address)` - Get all media uploaded by a user

## URL Format

- **Short links**: `https://your-domain.com/l/{shortCode}`
- **Media links**: `https://your-domain.com/m/{shortCode}`

Short codes are 6 characters using alphanumeric characters.

## IPFS Configuration

Choose one of these IPFS providers:

### Pinata (Recommended)
1. Create account at [pinata.cloud](https://pinata.cloud)
2. Generate API keys
3. Add to `frontend/.env`:
   ```
   VITE_PINATA_API_KEY=your_key
   VITE_PINATA_SECRET_KEY=your_secret
   ```

### Web3.Storage
1. Create account at [web3.storage](https://web3.storage)
2. Generate API token
3. Add to `frontend/.env`:
   ```
   VITE_WEB3_STORAGE_TOKEN=your_token
   ```

## Testing

Run smart contract tests:
```bash
npm test
```

## License

MIT
