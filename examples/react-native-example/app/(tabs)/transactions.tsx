import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Client } from '@hiero-ledger/sdk';

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

function requireField(value: string | undefined, errorMsg: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) throw new Error(errorMsg);
  return trimmed;
}

function requirePositiveInt(value: string | undefined, errorMsg: string): number {
  const num = parseInt(String(value || ''), 10);
  if (isNaN(num) || num <= 0) throw new Error(errorMsg);
  return num;
}

const handleCreateAccount = async (client: Client) => {
  const result = await createAccount(client);
  if (!result.success) throw new Error(result.error);
  return [
    { label: 'Account ID', value: result.data.accountId, copyable: true },
    { label: 'Public Key', value: result.data.publicKey, copyable: true },
    { label: 'Private Key', value: result.data.privateKey, copyable: true },
  ];
};

const handleQueryBalance = async (client: Client, values: Record<string, string>) => {
  const accountId = requireField(values.accountId, 'Please enter an Account ID');
  const result = await getAccountBalance(client, accountId);
  if (!result.success) throw new Error(result.error);
  return [
    { label: 'Account ID', value: result.data.accountId, copyable: true },
    { label: 'Balance', value: result.data.balance },
  ];
};

const handleTransferHbar = async (client: Client, values: Record<string, string>) => {
  const toAccountId = requireField(values.toAccountId, 'Please enter a recipient Account ID');
  const amountStr = String(values.amount || '');
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) throw new Error('Please enter a valid amount');
  
  const result = await transferHbar(client, toAccountId, amount);
  if (!result.success) throw new Error(result.error);
  return [
    { label: 'Status', value: result.data.status },
    { label: 'Transaction ID', value: result.data.transactionId, copyable: true },
    { label: 'Transferred', value: `${amount} ℏ to ${toAccountId}` },
  ];
};

const handleCreateToken = async (client: Client, values: Record<string, string>) => {
  const name = requireField(values.name, 'Please enter a token name');
  const symbol = requireField(values.symbol, 'Please enter a token symbol');
  const supply = requirePositiveInt(values.supply, 'Please enter a valid initial supply');
  
  const result = await createFungibleToken(client, name, symbol, supply);
  if (!result.success) throw new Error(result.error);
  return [
    { label: 'Token ID', value: result.data.tokenId, copyable: true },
    { label: 'Name', value: result.data.name },
    { label: 'Symbol', value: result.data.symbol },
  ];
};

const handleTransferToken = async (client: Client, values: Record<string, string>) => {
  const tokenId = requireField(values.tokenId, 'Please enter a Token ID');
  const toAccountId = requireField(values.toAccountId, 'Please enter a recipient Account ID');
  const amount = requirePositiveInt(values.amount, 'Please enter a valid amount');
  
  const result = await transferToken(client, tokenId, toAccountId, amount);
  if (!result.success) throw new Error(result.error);
  return [
    { label: 'Status', value: result.data.status },
    { label: 'Transaction ID', value: result.data.transactionId, copyable: true },
    { label: 'Transferred', value: `${amount} of token ${result.data.tokenId} to ${toAccountId}` },
  ];
};

function TransactionCardsList({ client, isConnected }: { client: Client | null; isConnected: boolean }) {
  return (
    <>
      <TransactionCard
        title="Create Account"
        description="Generates a new ED25519 key pair and creates a Hiero account with an initial balance of 10 HBAR funded by the operator."
        buttonLabel="Create Account"
        isConnected={isConnected}
        onExecute={async () => {
          if (!client) throw new Error('Client not connected');
          return handleCreateAccount(client);
        }}
      />

      <TransactionCard
        title="Query Balance"
        description="Queries the HBAR balance of any account on the network. This is a free operation — no transaction fees are charged."
        buttonLabel="Query Balance"
        isConnected={isConnected}
        inputs={[
          { key: 'accountId', label: 'Account ID', placeholder: '0.0.12345' },
        ]}
        onExecute={async (values) => {
          if (!client) throw new Error('Client not connected');
          return handleQueryBalance(client, values);
        }}
      />

      <TransactionCard
        title="Transfer HBAR"
        description="Transfers HBAR from the operator account to another account using the double-entry accounting model (debit sender, credit receiver)."
        buttonLabel="Send HBAR"
        isConnected={isConnected}
        inputs={[
          { key: 'toAccountId', label: 'Recipient Account ID', placeholder: '0.0.12345' },
          { key: 'amount', label: 'Amount (HBAR)', placeholder: '1', keyboardType: 'decimal-pad' },
        ]}
        onExecute={async (values) => {
          if (!client) throw new Error('Client not connected');
          return handleTransferHbar(client, values);
        }}
      />

      <TransactionCard
        title="Create Token"
        description="Creates a new fungible token using the Hiero Token Service (HTS). The operator becomes the treasury and admin. No smart contracts needed!"
        buttonLabel="Create Token"
        isConnected={isConnected}
        inputs={[
          { key: 'name', label: 'Token Name', placeholder: 'My Demo Token' },
          { key: 'symbol', label: 'Token Symbol', placeholder: 'MDT' },
          { key: 'supply', label: 'Initial Supply', placeholder: '1000', keyboardType: 'numeric' },
        ]}
        onExecute={async (values) => {
          if (!client) throw new Error('Client not connected');
          return handleCreateToken(client, values);
        }}
      />

      <TransactionCard
        title="Transfer Token"
        description={"Transfers fungible tokens from the operator to another account. Note: Recipients MUST associate the token before receiving it (see https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/associate-tokens-to-an-account).\n\nIn this demo, manual TokenAssociateTransaction is skipped because we enabled auto-association during account creation."}
        buttonLabel="Transfer Tokens"
        isConnected={isConnected}
        inputs={[
          { key: 'tokenId', label: 'Token ID', placeholder: '0.0.12345' },
          { key: 'toAccountId', label: 'Recipient Account ID', placeholder: '0.0.12345' },
          { key: 'amount', label: 'Amount', placeholder: '10', keyboardType: 'numeric' },
        ]}
        onExecute={async (values) => {
          if (!client) throw new Error('Client not connected');
          return handleTransferToken(client, values);
        }}
      />
    </>
  );
}

/**
 * Transactions screen — demonstrates core Hiero SDK operations.
 *
 * This screen contains 5 interactive cards, each demonstrating
 * a common blockchain operation:
 *
 * 1. Create Account — generates a new key pair and creates an account
 * 2. Query Balance — looks up any account's HBAR balance
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
        {!isConnected ? (
          <ThemedView style={styles.warningCard}>
            <ThemedText type="defaultSemiBold">⚠️ Not Connected</ThemedText>
            <ThemedText style={styles.warningText}>
              Go to the Home tab and tap &quot;Connect to Network&quot; before running transactions.
            </ThemedText>
          </ThemedView>
        ) : null}

        <TransactionCardsList client={client} isConnected={isConnected} />
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
