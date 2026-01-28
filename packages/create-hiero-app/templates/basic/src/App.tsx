import { useState, useEffect } from 'react';
import {
  Client,
  AccountBalanceQuery,
  AccountCreateTransaction,
  TransferTransaction,
  Hbar,
} from '@hashgraph/sdk';
import { useWallet } from './context/WalletContext';
import { WalletButton } from './components/WalletButton';
import './App.css';

const NETWORK = import.meta.env.VITE_HIERO_NETWORK || 'testnet';

function App() {
  const [connectionStatus, setConnectionStatus] = useState('Please connect your wallet to get started');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [networkInfo, setNetworkInfo] = useState({ network: '', accountId: '' });

  // Wallet hook
  const wallet = useWallet();

  // Account operations
  const [accountResult, setAccountResult] = useState<string>('');
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Transfer operations
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [transferResult, setTransferResult] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);


  // Update connection status when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.accountId) {
      setConnectionStatus('✅ Wallet connected!');
      setStatusType('success');
      setNetworkInfo({ network: NETWORK, accountId: wallet.accountId });
    } else {
      setConnectionStatus('Please connect your wallet to get started');
      setStatusType('info');
      setNetworkInfo({ network: NETWORK, accountId: '' });
    }
  }, [wallet.connected, wallet.accountId]);

  const checkBalance = async () => {
    if (!wallet.connected || !wallet.accountId) {
      setAccountResult('Please connect your wallet first');
      return;
    }

    setIsCheckingBalance(true);
    try {
      // Create a read-only client for queries
      let queryClient: Client;
      switch (NETWORK.toLowerCase()) {
        case 'mainnet':
          queryClient = Client.forMainnet();
          break;
        case 'previewnet':
          queryClient = Client.forPreviewnet();
          break;
        default:
          queryClient = Client.forTestnet();
      }

      const balance = await new AccountBalanceQuery()
        .setAccountId(wallet.accountId)
        .execute(queryClient);

      const result = {
        accountId: wallet.accountId,
        hbarBalance: balance.hbars.toString(),
        tokens: balance.tokens ? balance.tokens.toString() : 'No tokens',
      };

      setAccountResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Balance check failed:', error);
      setAccountResult(`Error: ${(error as Error).message}`);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const createAccount = async () => {
    if (!wallet.connected) {
      setAccountResult('Please connect your wallet first');
      return;
    }

    setIsCreatingAccount(true);
    try {
      const { PrivateKey } = await import('@hashgraph/sdk');
      const newPrivateKey = PrivateKey.generateED25519();
      const newPublicKey = newPrivateKey.publicKey;

      const transaction = new AccountCreateTransaction()
        .setKey(newPublicKey)
        .setInitialBalance(new Hbar(10))
        .setMaxTransactionFee(new Hbar(2));

      // Use wallet - will prompt user to approve
      const signer = wallet.getSigner();
      if (!signer) throw new Error('Wallet signer not available');

      // Freeze the transaction with the signer
      const frozenTx = await transaction.freezeWithSigner(signer);

      // Use signer.call to execute (this handles signing and submission)
      const txResponse = await signer.call(frozenTx);

      // Get receipt
      const receipt = await txResponse.getReceiptWithSigner(signer);

      const result = {
        status: 'Account created successfully!',
        accountId: receipt.accountId?.toString(),
        publicKey: newPublicKey.toStringDer(),
        privateKey: newPrivateKey.toStringDer(),
        initialBalance: '10 HBAR',
        transactionId: txResponse.transactionId.toString(),
        warning: '⚠️ Save the private key securely!',
      };

      setAccountResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Account creation failed:', error);
      setAccountResult(`Error: ${(error as Error).message}`);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const transferHbar = async () => {
    if (!wallet.connected || !wallet.accountId) {
      setTransferResult('Please connect your wallet first');
      return;
    }

    if (!recipientId || !amount || parseFloat(amount) <= 0) {
      setTransferResult('Please enter valid recipient ID and amount');
      return;
    }

    setIsTransferring(true);
    try {
      const transaction = new TransferTransaction()
        .addHbarTransfer(wallet.accountId, new Hbar(-parseFloat(amount)))
        .addHbarTransfer(recipientId, new Hbar(parseFloat(amount)))
        .setMaxTransactionFee(new Hbar(1));

      // Use wallet signer - properly execute through WalletConnect
      const signer = wallet.getSigner();
      if (!signer) throw new Error('Wallet signer not available');

      // Freeze the transaction with the signer
      const frozenTx = await transaction.freezeWithSigner(signer);

      // Use signer.call to execute (this handles signing and submission)
      const txResponse = await signer.call(frozenTx);

      // Get receipt
      const receipt = await txResponse.getReceiptWithSigner(signer);

      const result = {
        status: 'Transfer successful!',
        from: wallet.accountId,
        to: recipientId,
        amount: `${amount} HBAR`,
        transactionId: txResponse.transactionId.toString(),
        transactionStatus: receipt.status.toString(),
      };

      setTransferResult(JSON.stringify(result, null, 2));
      setRecipientId('');
      setAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
      setTransferResult(`Error: ${(error as Error).message}`);
    } finally {
      setIsTransferring(false);
    }
  };


  return (
    <>
      <div className="header">
        <h1>🚀 Hiero SDK Starter</h1>
        <p>Build decentralized applications on the Hiero network</p>
        <div style={{ marginTop: '24px' }}>
          <WalletButton />
        </div>
      </div>

      {/* Connection Status */}
      <div className="card">
        <h2>🔌 Connection Status</h2>
        <div className={`status ${statusType}`}>{connectionStatus}</div>
        {networkInfo.accountId && (
          <div>
            <div className="info-item">
              <label>Network:</label>
              <span className="value">{networkInfo.network}</span>
            </div>
            <div className="info-item">
              <label>Account:</label>
              <span className="value">{networkInfo.accountId}</span>
            </div>
          </div>
        )}
        {!wallet.connected && (
          <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#6b7280' }}>
            💡 Connect your wallet using WalletConnect to interact with the Hiero network. Your wallet will prompt you to approve each transaction.
          </div>
        )}
      </div>

      <div className="grid">
        {/* Account Operations */}
        <div className="card">
          <h2>👤 Account Operations</h2>
          <div className="button-group">
            <button onClick={checkBalance} disabled={isCheckingBalance}>
              {isCheckingBalance ? 'Checking...' : 'Check Balance'}
            </button>
            <button onClick={createAccount} disabled={isCreatingAccount}>
              {isCreatingAccount ? 'Creating...' : 'Create Account'}
            </button>
          </div>
          {accountResult && (
            <div className="result">
              <pre>{accountResult}</pre>
            </div>
          )}
        </div>

        {/* Transfer Operations */}
        <div className="card">
          <h2>💸 Transfer HBAR</h2>
          <div className="form-group">
            <label htmlFor="recipientId">Recipient Account ID:</label>
            <input
              type="text"
              id="recipientId"
              placeholder="0.0.12345"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount (HBAR):</label>
            <input
              type="number"
              id="amount"
              placeholder="10"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <button onClick={transferHbar} disabled={isTransferring}>
            {isTransferring ? 'Sending...' : 'Send HBAR'}
          </button>
          {wallet.connected && (
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#6b7280' }}>
              💡 Your wallet will prompt you to approve this transaction
            </div>
          )}
          {transferResult && (
            <div className="result">
              <pre>{transferResult}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
