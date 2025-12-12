import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function Header() {
  return (
    <header className="header">
      <a href="/" className="logo">
        Link<span>.io</span>
      </a>

      <WalletMultiButton />
    </header>
  );
}

export default Header;
