import {
    FileId,
    PrivateKey,
    PublicKey,
    Client,
    Wallet,
    LocalProvider,
} from "../../src/index.js";
import path from "path";
import fs from "fs";
import * as grpc from "@grpc/grpc-js";
import * as loader from "@grpc/proto-loader";
import { proto } from "@hiero-ledger/proto";

/**
 * @template {*} RequestType
 * @template {*} ResponseType
 * @typedef {import("grpc").handleUnaryCall<RequestType, ResponseType>} grpc.handleUnaryCall<RequestType, ResponseType>
 */

/**
 * @namespace com
 * @typedef {import("@hiero-ledger/proto").com.hedera.mirror.api.proto.IConsensusTopicResponse} com.hedera.mirror.api.proto.IConsensusTopicResponse
 */

export const PRIVATE_KEY = PrivateKey.fromString(
    "302e020100300506032b657004220420d45e1557156908c967804615af59a000be88c7aa7058bfcbe0f46b16c28f887d",
);

/**
 * Find all proto files in a directory recursively
 * @param {string} directory - The directory to search in
 * @returns {string[]} - Array of proto file paths
 */
function findProtoFiles(directory) {
    const protoFiles = [];

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith(".proto")) {
                protoFiles.push(filePath);
            }
        }
    }

    scanDirectory(directory);
    return protoFiles;
}

const PROTOS = findProtoFiles("./packages/proto/src/proto");

export const ABORTED = {
    name: "ABORTED",
    message: "no response found",
    code: 10,
};

export const UNAVAILABLE = {
    name: "UNAVAILABLE",
    message: "node is UNAVAILABLE",
    code: 14,
};

export const INTERNAL = {
    name: "INTERNAL",
    message: "Received RST_STREAM with code 0",
    code: 13,
};

/**
 * @namespace {proto}
 * @typedef {import("@hiero-ledger/proto").Response} proto.Response
 * @typedef {import("@hiero-ledger/proto").Query} proto.Query
 * @typedef {import("@hiero-ledger/proto").TransactionResponse} proto.TransactionResponse
 */

const fileId = FileId.fromString("0.0.141");
const contractId = FileId.fromString("0.0.142");

export const TRANSACTION_RECEIPT_SUCCESS_RESPONSE = {
    transactionGetReceipt: {
        header: {
            nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
        },
        receipt: {
            status: proto.ResponseCodeEnum.SUCCESS,
            fileID: fileId._toProtobuf(),
            contractID: contractId._toProtobuf(),
        },
    },
};

export const TRANSACTION_RECEIPT_FAILED_RESPONSE = {
    transactionGetReceipt: {
        header: {
            nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
        },
        receipt: {
            status: proto.ResponseCodeEnum.INVALID_FILE_ID,
        },
    },
};

/**
 * @typedef {object} Response
 * @property {(request: proto.Transaction | proto.Query, index?: number) => proto.Response | proto.TransactionResponse} [call]
 * @property {proto.Response | proto.TransactionResponse | com.hedera.mirror.api.proto.IConsensusTopicResponse} [response]
 * @property {grpc.ServiceError} [error]
 */

class GrpcServer {
    /**
     * @param {string | string[]} paths
     * @param {string} name
     */
    constructor(paths) {
        this.server = new grpc.Server();

        const pkgs = /** @type {grpc.GrpcObject} */ (
            grpc.loadPackageDefinition(loader.loadSync(paths))
        );

        const proto = /** @type {grpc.GrpcObject} */ (pkgs.proto);
        const mirror = /** @type {grpc.GrpcObject} */ (
            pkgs.com.hedera.mirror.api.proto
        );

        this.services = [];

        function addPackageServices(services, pkg) {
            for (const [key, value] of Object.entries(pkg)) {
                if (typeof value !== "function") {
                    continue;
                }

                const service =
                    /** @type {grpc.ServiceDefinition<grpc.UntypedServiceImplementation>} */ (
                        /** @type {grpc.GrpcObject} */ (pkg[key])["service"]
                    );

                if (service == null) {
                    continue;
                }

                services.push(service);
            }
        }

        addPackageServices(this.services, mirror);
        addPackageServices(this.services, proto);

        Object.freeze(this);
    }

    /**
     * Adds a service to the gRPC server
     *
     * @param {?Response[]} responses
     * @returns {this}
     */
    addResponses(responses) {
        /** @type {grpc.UntypedServiceImplementation} */
        const router = {};

        let index = 0;

        for (const service of this.services) {
            for (const key of Object.keys(service)) {
                router[key] =
                    /** @type {grpc.handleUnaryCall<any, any> | grpc.handleServerStreamingCall<any, any>} */ (
                        call,
                        callback,
                    ) => {
                        if (
                            index >= responses.length ||
                            responses[index] == null
                        ) {
                            if (callback != null) {
                                callback(
                                    {
                                        name: "ABORTED",
                                        message: `no response found for index ${index}`,
                                        code: 10,
                                    },
                                    null,
                                );
                            } else {
                                call.end();
                            }

                            return;
                        }

                        const request = call.request;
                        const response = responses[index];

                        let value = null;
                        let error = null;

                        if (response.response != null) {
                            value = response.response;
                        }

                        if (response.call != null) {
                            try {
                                const result = response.call(request, index);
                                // Handle both sync and async responses
                                if (result instanceof Promise) {
                                    result
                                        .then((resolvedValue) => {
                                            value = resolvedValue;
                                            if (callback != null) {
                                                callback(error, value);
                                            } else {
                                                call.write(value);
                                            }
                                        })
                                        .catch((err) => {
                                            callback(
                                                {
                                                    name: "ABORTED",
                                                    message: `responses[${index}].call failed with error: ${err.toString()} and stack trace: ${
                                                        err.stack
                                                    }`,
                                                    code: 10,
                                                },
                                                null,
                                            );
                                        });
                                    return; // Don't continue with sync processing
                                } else {
                                    value = result;
                                }
                            } catch (err) {
                                callback(
                                    {
                                        name: "ABORTED",
                                        message: `responses[${index}].call failed with error: ${err.toString()} and stack trace: ${
                                            err.stack
                                        }`,
                                        code: 10,
                                    },
                                    null,
                                );
                                return;
                            }
                        }

                        if (response.error != null) {
                            error = response.error;
                        } else if (value == null) {
                            error = ABORTED;
                        }

                        if (callback != null) {
                            callback(error, value);
                        } else {
                            call.write(value);
                        }

                        index += 1;

                        if (index == responses.length && callback == null) {
                            call.end();
                        }
                    };
            }

            this.server.addService(service, router);
        }

        return this;
    }

    /**
     * @param {string} port
     * @param {grpc.ServerCredentials} creds
     * @returns {Promise<this>}
     */
    listen(port, creds = grpc.ServerCredentials.createInsecure()) {
        return new Promise((resolve, reject) =>
            this.server.bindAsync(port, creds, (error) => {
                if (error != null) {
                    reject(error);
                    return;
                }

                this.server.start();
                resolve(this);
            }),
        );
    }

    close() {
        this.server.forceShutdown();
    }
}

export default class Mocker {
    /**
     * Creates a mock server and client with the given responses
     *
     * @param {?Response[][]} responses
     * @returns {Promise<{servers: GrpcServers, client: NodeClient}>}
     */
    static async withResponses(responses) {
        const servers = new GrpcServers();

        for (const response of responses) {
            servers.addServer(response);
        }

        const client = await servers.listen();
        const operatorId = "0.0.1854";
        client.setOperator(operatorId, PRIVATE_KEY);

        const provider = LocalProvider.fromClient(client);
        const wallet = new Wallet(operatorId, PRIVATE_KEY, provider);

        return { client, wallet, servers };
    }

    /**
     * @param {proto.ISignedTransaction | null | undefined} signedTransaction
     * @returns {boolean}
     */
    static verifySignatures(signedTransaction) {
        if (
            signedTransaction.bodyBytes == null ||
            signedTransaction.sigMap == null ||
            signedTransaction.sigMap.sigPair == null ||
            signedTransaction.sigMap.sigPair.length === 0
        ) {
            return false;
        }

        for (const sigPair of signedTransaction.sigMap.sigPair) {
            let verified = false;

            if (sigPair.ed25519 != null) {
                verified = PublicKey.fromBytesED25519(
                    sigPair.pubKeyPrefix,
                ).verify(signedTransaction.bodyBytes, sigPair.ed25519);
            } else if (sigPair.ECDSASecp256k1 != null) {
                verified = PublicKey.fromBytesECDSA(
                    sigPair.pubKeyPrefix,
                ).verify(signedTransaction.bodyBytes, sigPair.ECDSASecp256k1);
            }

            if (!verified) {
                return false;
            }
        }

        return true;
    }
}

class GrpcServers {
    constructor() {
        /** @type {GrpcServer[]} */
        this._servers = [];

        /** @type {string[]} */
        this._addresses = [];

        /** @type {string[]} */
        this._nodeAccountIds = [];

        this._nodeIndex = 0;

        this.GRPC_PORT_OFFSET_MULTIPLIER = 30;
    }

    /**
     * @param {Response[]} responses
     * @returns {this}
     */
    addServer(responses) {
        const port = this.getNextGrpcPort();
        const address = `0.0.0.0:${port}`;
        const nodeAccountId = `0.0.${3 + this._nodeIndex}`;
        const server = new GrpcServer(PROTOS).addResponses(responses);

        this._servers.push(server);
        this._addresses.push(address);
        this._nodeAccountIds.push(nodeAccountId);

        this._nodeIndex += 1;

        return this;
    }

    /**
     * @returns {number}
     */
    getNextGrpcPortOffset() {
        const vitestWorkerId = process.env.VITEST_WORKER_ID || 0;

        return (
            vitestWorkerId * this.GRPC_PORT_OFFSET_MULTIPLIER + this._nodeIndex
        );
    }

    getNextGrpcPort() {
        return 50213 + this.getNextGrpcPortOffset();
    }

    /**
     * @returns {Promise<Client>}
     */
    async listen() {
        const network = {};

        for (let i = 0; i < this._servers.length; i++) {
            const server = this._servers[i];
            const address = this._addresses[i];
            network[address] = this._nodeAccountIds[i];

            await server.listen(address);
        }

        return new Client({ network, scheduleNetworkUpdate: false })
            .setMirrorNetwork(Object.keys(network))
            .setNodeMinBackoff(0)
            .setNodeMaxBackoff(0)
            .setNodeMinReadmitPeriod(0)
            .setNodeMaxReadmitPeriod(0);
    }

    close() {
        for (const server of this._servers) {
            server.close();
        }
    }
}
