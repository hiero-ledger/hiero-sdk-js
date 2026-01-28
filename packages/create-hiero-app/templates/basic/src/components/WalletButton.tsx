import { useWallet } from '../context/WalletContext';

export function WalletButton() {
  const { connected, accountId, isConnecting, connectWallet, disconnectWallet } = useWallet();

  if (connected && accountId) {
    return (
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div
          style={{
            padding: '8px 16px',
            background: '#f0fdf4',
            border: '1px solid #dcfce7',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#166534',
          }}
        >
          🟢 Connected: {accountId}
        </div>
        <button onClick={disconnectWallet} style={{ padding: '8px 16px' }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={connectWallet} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : '🔗 Connect Wallet'}
    </button>
  );
}
