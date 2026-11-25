// SPDX-License-Identifier: Apache-2.0

import Executable from "../../src/Executable.js";
import Transaction from "../../src/transaction/Transaction.js";
import Query from "../../src/query/Query.js";
import Client from "../../src/client/Client.js";
import ManagedNetwork from "../../src/client/ManagedNetwork.js";
import Channel from "../../src/channel/Channel.js";
import EthereumTransactionData from "../../src/EthereumTransactionData.js";
import CustomFee from "../../src/token/CustomFee.js";
import Key from "../../src/Key.js";
import ManagedNode from "../../src/ManagedNode.js";
import RegisteredServiceEndpoint from "../../src/node/RegisteredServiceEndpoint.js";
import ClprTransaction from "../../src/clpr/ClprTransaction.js";
import MirrorNodeContractQuery from "../../src/query/MirrorNodeContractQuery.js";
import AccountId from "../../src/account/AccountId.js";

describe("AbstractMethods", function () {
    /** @type {Client[]} */
    let clients = [];

    /**
     * @returns {Client}
     */
    function createClient() {
        const client = new Client({ scheduleNetworkUpdate: false });
        clients.push(client);
        return client;
    }

    afterEach(function () {
        for (const client of clients) {
            client.close();
        }
        clients = [];
    });

    /** @type {[string, () => unknown, string][]} */
    const cases = [
        [
            "Executable._beforeExecute",
            () => new Executable()._beforeExecute(),
            "not implemented",
        ],
        [
            "Executable._makeRequestAsync",
            () => new Executable()._makeRequestAsync(),
            "not implemented",
        ],
        [
            "Executable._mapStatusError",
            () => new Executable()._mapStatusError(),
            "not implemented",
        ],
        [
            "Executable._mapResponse",
            () => new Executable()._mapResponse(),
            "not implemented",
        ],
        [
            "Executable._execute",
            () => new Executable()._execute(),
            "not implemented",
        ],
        [
            "Executable._getTransactionId",
            () => new Executable()._getTransactionId(),
            "not implemented",
        ],
        [
            "Executable._getLogId",
            () => new Executable()._getLogId(),
            "not implemented",
        ],
        [
            "Executable._requestToBytes",
            () => new Executable()._requestToBytes(),
            "not implemented",
        ],
        [
            "Executable._responseToBytes",
            () => new Executable()._responseToBytes(),
            "not implemented",
        ],
        [
            "Executable._getStatusAndExecutionState",
            () => new Executable()._getStatusAndExecutionState(),
            "not implemented",
        ],
        [
            "Executable.toBytes",
            () => new Executable().toBytes(),
            "not implemented",
        ],
        [
            "Transaction._getTransactionDataCase",
            () => new Transaction()._getTransactionDataCase(),
            "not implemented",
        ],
        [
            "Transaction._makeTransactionData",
            () => new Transaction()._makeTransactionData(),
            "not implemented",
        ],
        [
            "Query._mapResponseHeader",
            () => new Query()._mapResponseHeader(),
            "not implemented",
        ],
        [
            "Query._onMakeRequest",
            () => new Query()._onMakeRequest(),
            "not implemented",
        ],
        [
            "Client.setNetwork",
            () => createClient().setNetwork(),
            "not implemented",
        ],
        [
            "Client.setMirrorNetwork",
            () => createClient().setMirrorNetwork(),
            "not implemented",
        ],
        [
            "Client._createNetworkChannel",
            () => createClient()._createNetworkChannel()("address"),
            "not implemented",
        ],
        [
            "Client._createMirrorNetworkChannel",
            () => createClient()._createMirrorNetworkChannel()("address"),
            "not implemented",
        ],
        [
            "ManagedNetwork._createNodeFromNetworkEntry",
            () => new ManagedNetwork()._createNodeFromNetworkEntry(),
            "not implemented",
        ],
        [
            "ManagedNetwork._getNodesToRemove",
            () => new ManagedNetwork()._getNodesToRemove(),
            "not implemented",
        ],
        ["Channel.close", () => new Channel().close(), "not implemented"],
        [
            "Channel._createUnaryClient",
            () => new Channel()._createUnaryClient(),
            "not implemented",
        ],
        [
            "EthereumTransactionData.toBytes",
            () => new EthereumTransactionData({}).toBytes(),
            "not implemented",
        ],
        [
            "EthereumTransactionData.sign",
            () => new EthereumTransactionData({}).sign(),
            "not implemented",
        ],
        [
            "EthereumTransactionData.toString",
            () => new EthereumTransactionData({}).toString(),
            "not implemented",
        ],
        [
            "EthereumTransactionData.toJSON",
            () => new EthereumTransactionData({}).toJSON(),
            "not implemented",
        ],
        [
            "CustomFee._fromProtobuf",
            () => CustomFee._fromProtobuf(),
            "not implemented",
        ],
        [
            "CustomFee._toProtobuf",
            () => new CustomFee()._toProtobuf(),
            "not implemented",
        ],
        [
            "Key._toProtobufKey",
            () => new Key()._toProtobufKey(),
            "not implemented",
        ],
        [
            "ManagedNode.getKey",
            () => {
                const client = createClient();
                client._network.setNetwork({ "127.0.0.1:50211": "0.0.3" });
                const node = client._network.getNode(new AccountId(3));
                return ManagedNode.prototype.getKey.call(node);
            },
            "not implemented",
        ],
        [
            "RegisteredServiceEndpoint._toProtobuf",
            () => new RegisteredServiceEndpoint()._toProtobuf(),
            "not implemented",
        ],
        [
            "ClprTransaction._getRequiredFields",
            () => new ClprTransaction()._getRequiredFields(),
            "not implemented",
        ],
        [
            "MirrorNodeContractQuery.JSONPayload",
            () => new MirrorNodeContractQuery().JSONPayload,
            "JSONPayload getter is not implemented. Please implement this method in the subclass.",
        ],
    ];

    for (const [name, call, message] of cases) {
        it(`${name} throws`, function () {
            expect(call).to.throw(message);
        });
    }
});
