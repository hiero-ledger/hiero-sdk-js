import { Client, AccountId, PrivateKey, LedgerId } from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to construct and configure a client in different ways.
 *
 * A client has a network and an operator.
 *
 * A Hedera network is made up of nodes — individual servers who participate
 * in the process of reaching consensus on the order and validity of transactions
 * on the network. Three networks you likely know of are previewnet, testnet, and mainnet.
 *
 * For the purpose of connecting to it, each node has an IP address or URL and a port number.
 * Each node also has an AccountId used to refer to that node for several purposes,
 * including the paying of fees to that node when a client submits requests to it.
 *
 * You can configure what network you want a client to use — in other words, you can specify
 * a list of URLs and port numbers with associated account IDs, and
 * when that client is used to execute queries and transactions, the client will
 * submit requests only to nodes in that list.
 *
 * A Client has an operator, which has an AccountId and a PublicKey, and which can
 * sign requests. A client's operator can also be configured.
 */

const HEDERA_NETWORK = "testnet";

// See .env.sample in the examples folder root for how to specify values below
// or set environment variables with the same names.
const CONFIG_FILE = process.env.CONFIG_FILE ?? null;

/**
 *
 */
async function main() {
    console.log("Construct Client Example Start!");

    // Here's the simplest way to construct a client.
    // These clients' networks are filled with default lists of nodes that are baked into the SDK.
    // Their operators are not yet set, and trying to use them now will result in exceptions.
    const testnetClient = Client.forTestnet();
    const previewnetClient = Client.forPreviewnet();
    const mainnetClient = Client.forMainnet();

    // We can also construct a client for testnet, previewnet or mainnet depending on the value of a
    // network name string. If, for example, the input string equals "testnet", this client will be
    // configured to connect to testnet.
    const namedNetworkClient = Client.forName(HEDERA_NETWORK);

    // Let's set the operator on testnetClient.
    // (The AccountId and PrivateKey here are fake, this is just an example.)
    testnetClient.setOperator(
        AccountId.fromString("0.0.3"),
        PrivateKey.fromStringDer(
            "302e020100300506032b657004220420db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10",
        ),
    );

    // Let's create a client with a custom network.
    const customNetwork = {
        "2.testnet.hedera.com:50211": new AccountId(0, 0, 5),
        "3.testnet.hedera.com:50211": new AccountId(0, 0, 6),
    };
    const customClient = Client.forNetwork(customNetwork);

    // Since our customClient's network is in this case a subset of testnet, we should set the
    // ledger ID to testnet. If we don't do this, checksum validation won't work.
    // See ValidateChecksumExample.
    customClient.setLedgerId(LedgerId.TESTNET);

    // Let's generate a client from a config.json file.
    // A config file may specify a network by name, or it may provide a custom network
    // in the form of a list of nodes.
    // The config file should specify the operator, so you can use a client constructed
    // using fromConfigFile() immediately.
    if (CONFIG_FILE != null) {
        const configClient = await Client.fromConfigFile(CONFIG_FILE);
        configClient.close();
    }

    // Always close a client when you're done with it.
    testnetClient.close();
    previewnetClient.close();
    mainnetClient.close();
    namedNetworkClient.close();
    customClient.close();

    console.log("Construct Client Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
