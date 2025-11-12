import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, Text, View } from "react-native";
import {
    Client,
    AccountId,
    TransferTransaction,
    AccountBalanceQuery,
    AccountInfoQuery,
    PrivateKey,
    Mnemonic,
    TransactionResponse,
    AccountInfo,
    AccountBalance,
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
    const operatorId = AccountId.fromString(OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    const [transaction, setTransaction] = useState<TransactionResponse | null>(
        null,
    );
    const [info, setInfo] = useState<AccountInfo | null>(null);
    const [balance, setBalance] = useState<AccountBalance | null>(null);
    const [mnemonic, setMnemonic] = useState<Mnemonic | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const response = await new TransferTransaction()
                    .addHbarTransfer(operatorId, -1)
                    .addHbarTransfer("0.0.3", 1)
                    .execute(client);
                setTransaction(response);
            } catch (err: any) {
                Alert.alert(err.toString());
            }
            try {
                const info = await new AccountInfoQuery()
                    .setAccountId(operatorId)
                    .execute(client);

                setInfo(info);
            } catch (err: any) {
                Alert.alert(err.toString());
            }

            try {
                const balance = await new AccountBalanceQuery()
                    .setAccountId(operatorId)
                    .execute(client);

                setBalance(balance);
            } catch (err: any) {
                Alert.alert(err.toString());
            }

            try {
                const mnemonic = await Mnemonic.generate12();

                setMnemonic(mnemonic);
            } catch (err: any) {
                Alert.alert(err.toString());
            }
        };
        init();
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
