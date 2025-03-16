import { useEffect } from "react";

import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    TransferTransaction,
    Logger,
    LogLevel,
} from "@hashgraph/sdk";

function App() {
    const transferTransaction = async () => {
        /**
         * 1. Setup operatorId and operatorKey
         */
        const operatorId = AccountId.fromString(
            process.env.REACT_APP_OPERATOR_ID,
        );
        const operatorKey = PrivateKey.fromStringECDSA(
            process.env.REACT_APP_OPERATOR_KEY,
        );

        /**
         * 2. Create a custom network with GRPC web proxies
         */
        const nodes = {
            "https://testnet-node02-00-grpc.hedera.com:443": new AccountId(5),
            "https://testnet-node03-00-grpc.hedera.com:443": new AccountId(6),
            "https://testnet-node04-00-grpc.hedera.com:443": new AccountId(7),
        };

        /**
         * 3. Setup the client using "Client"
         */
        const client = Client.forNetwork(nodes);

        client.setOperator(operatorId, operatorKey);
        const debugLogger = new Logger(LogLevel.Debug);
        client.setLogger(debugLogger);

        const newAccountId = new AccountId(2672318);

        /**
         * 4. Execute transfer transaction
         */
        await new TransferTransaction()
            .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) // Sending account
            .addHbarTransfer(newAccountId, Hbar.fromTinybars(1)) //Receiving account
            .execute(client);
    };

    useEffect(() => {
        // triggers the transaction when the page is loaded
        transferTransaction();
    }, []);

    return (
        <div className="App">
            <h1>Custom gRPC web proxies network example</h1>
            <p>Check the console for the transaction details.</p>
        </div>
    );
}

export default App;
