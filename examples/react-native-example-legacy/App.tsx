// Polyfill crypto.getRandomValues — must be imported before the SDK
import "react-native-get-random-values";

import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, Text, View } from "react-native";
import {
    Client,
    AccountId,
    TransferTransaction,
    MirrorNodeAccountBalanceQuery,
    AccountInfoQuery,
    PrivateKey,
    Mnemonic,
    TransactionResponse,
    AccountInfo,
    MirrorNodeAccountBalance,
    Long,
} from "@hiero-ledger/sdk";

import { OPERATOR_ID, OPERATOR_KEY } from "@env";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
        padding: 20,
    },
});

const App = () => {
    const [transaction, setTransaction] = useState<TransactionResponse | null>(
        null,
    );
    const [info, setInfo] = useState<AccountInfo | null>(null);
    const [balance, setBalance] = useState<MirrorNodeAccountBalance | null>(
        null,
    );
    const [mnemonic, setMnemonic] = useState<Mnemonic | null>(null);

    useEffect(() => {
        // Keep the SDK client scoped to the effect so every mounted instance
        // owns exactly one network-update timer and closes it on cleanup.
        const operatorId = AccountId.fromString(OPERATOR_ID);
        const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
        const client = Client.forTestnet().setOperator(operatorId, operatorKey);
        let active = true;
        const init = async () => {
            try {
                const recipientId = AccountId.fromString("0.0.3");
                const recipientBefore =
                    await new MirrorNodeAccountBalanceQuery()
                        .setAccountId(recipientId)
                        .execute(client);
                const response = await new TransferTransaction()
                    .addHbarTransfer(operatorId, -1)
                    .addHbarTransfer(recipientId, 1)
                    .execute(client);
                await response.getReceipt(client);
                await waitForMirrorBalance(
                    client,
                    recipientId,
                    recipientBefore.hbars.toTinybars().add(100_000_000),
                );
                if (active) setTransaction(response);

                // Reaching the recipient's minimum balance above proves this
                // transaction is visible before displaying the sender balance.
                const currentBalance = await new MirrorNodeAccountBalanceQuery()
                    .setAccountId(operatorId)
                    .execute(client);
                if (active) setBalance(currentBalance);
            } catch (err: any) {
                if (active) Alert.alert(err.toString());
            }
            try {
                const info = await new AccountInfoQuery()
                    .setAccountId(operatorId)
                    .execute(client);

                if (active) setInfo(info);
            } catch (err: any) {
                if (active) Alert.alert(err.toString());
            }

            try {
                const mnemonic = await Mnemonic.generate12();

                if (active) setMnemonic(mnemonic);
            } catch (err: any) {
                if (active) Alert.alert(err.toString());
            }
        };
        void init();
        return () => {
            active = false;
            client.close();
        };
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            {transaction && (
                <Text testID="transactionId">
                    TransactionId: {transaction.transactionId.toString()}
                </Text>
            )}
            {info && (
                <Text testID="info">Info: {info.accountId.toString()}</Text>
            )}

            {balance && (
                <Text testID="balance">
                    Balance: {balance.hbars.toString()}
                </Text>
            )}

            {mnemonic && (
                <Text testID="mnemonic">
                    Mnemonic: {mnemonic._mnemonic.toString()}
                </Text>
            )}

            <StatusBar style="auto" />
        </View>
    );
};

export default App;

async function waitForMirrorBalance(
    client: Client,
    accountId: AccountId,
    expectedTinybars: Long,
): Promise<MirrorNodeAccountBalance> {
    const deadline = Date.now() + 60_000;
    for (;;) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
            throw new Error("mirror node did not ingest in time");
        }
        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client, remaining);
        // 0.0.3 is a node account and can receive other node fees while this
        // app runs, so the transfer is visible once the minimum is reached.
        if (balance.hbars.toTinybars().greaterThanOrEqual(expectedTinybars)) {
            return balance;
        }
        const delay = Math.min(2_000, Math.max(0, deadline - Date.now()));
        if (delay === 0) {
            throw new Error("mirror node did not ingest in time");
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}
