import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionCard } from '@/components/transaction-card';
import { useHiero } from '@/hooks/use-hiero';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  createAccount,
  getAccountBalance,
  transferHbar,
  createFungibleToken,
  transferToken,
} from '@/services';

/**
 * Transactions screen — demonstrates core Hiero SDK operations.
 *
 * This screen contains 5 interactive cards, each demonstrating
 * a common blockchain operation:
 *
 * 1. Create Account — generates a new key pair and creates an account
 * 2. Query Balance — looks up any account&apos;s HBAR balance
 * 3. Transfer HBAR — sends HBAR from operator to another account
 * 4. Create Token — creates a new fungible token via HTS
 * 5. Transfer Token — sends tokens to another account
 *
 * Each card uses the TransactionCard component for consistent UI,
 * and calls the corresponding service function from @/services.
 *
 * The SDK client is obtained from the useHiero() context — the user
 * must connect from the Home screen before transactions will work.
 */
export default function TransactionsScreen() {
  const { client, isConnected } = useHiero();
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Transactions</ThemedText>
          <ThemedText style={[styles.subtitle, { color: iconColor }]}>
            Try common SDK operations
          </ThemedText>
        </ThemedView>

        {/* Not connected warning */}
        {!isConnected && (
          <ThemedView style={styles.warningCard}>
            <ThemedText type="defaultSemiBold">⚠️ Not Connected</ThemedText>
            <ThemedText style={styles.warningText}>
              Go to the Home tab and tap &quot;Connect to Network&quot; before running transactions.
            </ThemedText>
          </ThemedView>
        )}

        {/* ─── Card 1: Create Account ─────────────────────────── */}
        <TransactionCard
          title="Create Account"
          description="Generates a new ED25519 key pair and creates a Hiero account with an initial balance of 10 HBAR funded by the operator."
          buttonLabel="Create Account"
          isConnected={isConnected}
          onExecute={async () => {
            if (!client) throw new Error('Client not connected');

            // Call the service layer function
            const result = await createAccount(client);

            if (!result.success) {
              throw new Error(result.error);
            }

            // Format the result for display
            return [
              `Account ID: ${result.data.accountId}`,
              `Public Key: ${result.data.publicKey.substring(0, 40)}...`,
              `Private Key: ${result.data.privateKey.substring(0, 40)}...`,
              '',
              '💡 Save the Account ID — you can use it in the other operations below.',
            ].join('\n');
          }}
        />

        {/* ─── Card 2: Query Balance ─────────────────────────── */}
        <TransactionCard
          title="Query Balance"
          description="Queries the HBAR balance of any account on the network. This is a free operation — no transaction fees are charged."
          buttonLabel="Query Balance"
          isConnected={isConnected}
          inputs={[
            {
              key: 'accountId',
              label: 'Account ID',
              placeholder: '0.0.12345',
            },
          ]}
          onExecute={async (values) => {
            if (!client) throw new Error('Client not connected');

            const accountId = values.accountId?.trim();
            if (!accountId) throw new Error('Please enter an Account ID');

            const result = await getAccountBalance(client, accountId);

            if (!result.success) {
              throw new Error(result.error);
            }

            return `Account ${result.data.accountId}\nBalance: ${result.data.balance}`;
          }}
        />

        {/* ─── Card 3: Transfer HBAR ─────────────────────────── */}
        <TransactionCard
          title="Transfer HBAR"
          description="Transfers HBAR from the operator account to another account using the double-entry accounting model (debit sender, credit receiver)."
          buttonLabel="Send HBAR"
          isConnected={isConnected}
          inputs={[
            {
              key: 'toAccountId',
              label: 'Recipient Account ID',
              placeholder: '0.0.12345',
            },
            {
              key: 'amount',
              label: 'Amount (HBAR)',
              placeholder: '1',
              keyboardType: 'decimal-pad',
            },
          ]}
          onExecute={async (values) => {
            if (!client) throw new Error('Client not connected');

            const toAccountId = values.toAccountId?.trim();
            const amount = parseFloat(values.amount ?? '');

            if (!toAccountId) throw new Error('Please enter a recipient Account ID');
            if (isNaN(amount) || amount <= 0) throw new Error('Please enter a valid amount');

            const result = await transferHbar(client, toAccountId, amount);

            if (!result.success) {
              throw new Error(result.error);
            }

            return [
              `Status: ${result.data.status}`,
              `Transaction ID: ${result.data.transactionId}`,
              `Sent ${amount} ℏ to ${toAccountId}`,
            ].join('\n');
          }}
        />

        {/* ─── Card 4: Create Fungible Token ─────────────────── */}
        <TransactionCard
          title="Create Token"
          description="Creates a new fungible token using the Hiero Token Service (HTS). The operator becomes the treasury and admin. No smart contracts needed!"
          buttonLabel="Create Token"
          isConnected={isConnected}
          inputs={[
            {
              key: 'name',
              label: 'Token Name',
              placeholder: 'My Demo Token',
            },
            {
              key: 'symbol',
              label: 'Token Symbol',
              placeholder: 'MDT',
            },
            {
              key: 'supply',
              label: 'Initial Supply',
              placeholder: '1000',
              keyboardType: 'numeric',
            },
          ]}
          onExecute={async (values) => {
            if (!client) throw new Error('Client not connected');

            const name = values.name?.trim();
            const symbol = values.symbol?.trim();
            const supply = parseInt(values.supply ?? '', 10);

            if (!name) throw new Error('Please enter a token name');
            if (!symbol) throw new Error('Please enter a token symbol');
            if (isNaN(supply) || supply <= 0) throw new Error('Please enter a valid initial supply');

            const result = await createFungibleToken(client, name, symbol, supply);

            if (!result.success) {
              throw new Error(result.error);
            }

            return [
              `Token ID: ${result.data.tokenId}`,
              `Name: ${result.data.name}`,
              `Symbol: ${result.data.symbol}`,
              '',
              '💡 Save the Token ID — you can use it to transfer tokens below.',
            ].join('\n');
          }}
        />

        {/* ─── Card 5: Transfer Token ────────────────────────── */}
        <TransactionCard
          title="Transfer Token"
          description="Transfers fungible tokens from the operator to another account. The recipient must be associated with the token first (handled automatically if a private key is provided)."
          buttonLabel="Transfer Tokens"
          isConnected={isConnected}
          inputs={[
            {
              key: 'tokenId',
              label: 'Token ID',
              placeholder: '0.0.12345',
            },
            {
              key: 'toAccountId',
              label: 'Recipient Account ID',
              placeholder: '0.0.12345',
            },
            {
              key: 'amount',
              label: 'Amount',
              placeholder: '10',
              keyboardType: 'numeric',
            },
            {
              key: 'recipientKey',
              label: 'Recipient Private Key (for token association)',
              placeholder: '302e020100300506032b6570...',
            },
          ]}
          onExecute={async (values) => {
            if (!client) throw new Error('Client not connected');

            const tokenId = values.tokenId?.trim();
            const toAccountId = values.toAccountId?.trim();
            const amount = parseInt(values.amount ?? '', 10);
            const recipientKey = values.recipientKey?.trim() || undefined;

            if (!tokenId) throw new Error('Please enter a Token ID');
            if (!toAccountId) throw new Error('Please enter a recipient Account ID');
            if (isNaN(amount) || amount <= 0) throw new Error('Please enter a valid amount');

            const result = await transferToken(client, tokenId, toAccountId, amount, recipientKey);

            if (!result.success) {
              throw new Error(result.error);
            }

            return [
              `Status: ${result.data.status}`,
              `Transaction ID: ${result.data.transactionId}`,
              `Transferred ${amount} of token ${result.data.tokenId} to ${toAccountId}`,
            ].join('\n');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    gap: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
  },
  warningCard: {
    gap: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    backgroundColor: 'rgba(255, 149, 0, 0.06)',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
