import {
    FileId,
    PrivateKey,
    PublicKey,
    Client,
    Wallet,
    LocalProvider,
} from "../../src/index.js";
import * as grpc from "@grpc/grpc-js";
import * as loader from "@grpc/proto-loader";
import { proto } from "@hashgraph/proto";

/**
 * @template {*} RequestType
 * @template {*} ResponseType
 * @typedef {import("grpc").handleUnaryCall<RequestType, ResponseType>} grpc.handleUnaryCall<RequestType, ResponseType>
 */

/**
 * @namespace com
 * @typedef {import("@hashgraph/proto").com.hedera.mirror.api.proto.IConsensusTopicResponse} com.hedera.mirror.api.proto.IConsensusTopicResponse
 */

export const PRIVATE_KEY = PrivateKey.fromString(
    "302e020100300506032b657004220420d45e1557156908c967804615af59a000be88c7aa7058bfcbe0f46b16c28f887d",
);

const PROTOS = [
    "./packages/proto/src/proto/mirror/consensus_service.proto",
    "./packages/proto/src/proto/mirror/mirror_network_service.proto",
    "./packages/proto/src/proto/sdk/transaction_list.proto",
    "./packages/proto/src/proto/services/basic_types.proto",
    "./packages/proto/src/proto/services/consensus_create_topic.proto",
    "./packages/proto/src/proto/services/consensus_delete_topic.proto",
    "./packages/proto/src/proto/services/consensus_get_topic_info.proto",
    "./packages/proto/src/proto/services/consensus_service.proto",
    "./packages/proto/src/proto/services/consensus_submit_message.proto",
    "./packages/proto/src/proto/services/consensus_topic_info.proto",
    "./packages/proto/src/proto/services/consensus_update_topic.proto",
    "./packages/proto/src/proto/services/contract_call.proto",
    "./packages/proto/src/proto/services/contract_call_local.proto",
    "./packages/proto/src/proto/services/contract_create.proto",
    "./packages/proto/src/proto/services/contract_delete.proto",
    "./packages/proto/src/proto/services/contract_get_bytecode.proto",
    "./packages/proto/src/proto/services/contract_get_info.proto",
    "./packages/proto/src/proto/services/contract_get_records.proto",
    "./packages/proto/src/proto/services/contract_update.proto",
    "./packages/proto/src/proto/services/crypto_add_live_hash.proto",
    "./packages/proto/src/proto/services/crypto_adjust_allowance.proto",
    "./packages/proto/src/proto/services/crypto_approve_allowance.proto",
    "./packages/proto/src/proto/services/crypto_create.proto",
    "./packages/proto/src/proto/services/crypto_delete.proto",
    "./packages/proto/src/proto/services/crypto_delete_live_hash.proto",
    "./packages/proto/src/proto/services/crypto_get_account_balance.proto",
    "./packages/proto/src/proto/services/crypto_get_account_records.proto",
    "./packages/proto/src/proto/services/crypto_get_info.proto",
    "./packages/proto/src/proto/services/crypto_get_live_hash.proto",
    "./packages/proto/src/proto/services/crypto_get_stakers.proto",
    "./packages/proto/src/proto/services/crypto_service.proto",
    "./packages/proto/src/proto/services/crypto_transfer.proto",
    "./packages/proto/src/proto/services/crypto_update.proto",
    "./packages/proto/src/proto/services/custom_fees.proto",
    "./packages/proto/src/proto/services/duration.proto",
    "./packages/proto/src/proto/services/exchange_rate.proto",
    "./packages/proto/src/proto/services/file_append.proto",
    "./packages/proto/src/proto/services/file_create.proto",
    "./packages/proto/src/proto/services/file_delete.proto",
    "./packages/proto/src/proto/services/file_get_contents.proto",
    "./packages/proto/src/proto/services/file_get_info.proto",
    "./packages/proto/src/proto/services/file_service.proto",
    "./packages/proto/src/proto/services/file_update.proto",
    "./packages/proto/src/proto/services/freeze.proto",
    "./packages/proto/src/proto/services/freeze_service.proto",
    "./packages/proto/src/proto/services/freeze_type.proto",
    "./packages/proto/src/proto/services/history_proof_key_publication.proto",
    "./packages/proto/src/proto/services/history_proof_signature.proto",
    "./packages/proto/src/proto/services/history_proof_vote.proto",
    "./packages/proto/src/proto/services/freeze_type.proto",
    "./packages/proto/src/proto/services/freeze_type.proto",
    "./packages/proto/src/proto/services/get_by_key.proto",
    "./packages/proto/src/proto/services/get_by_solidity_id.proto",
    "./packages/proto/src/proto/services/network_get_execution_time.proto",
    "./packages/proto/src/proto/services/network_get_version_info.proto",
    "./packages/proto/src/proto/services/network_service.proto",
    "./packages/proto/src/proto/services/query.proto",
    "./packages/proto/src/proto/services/query_header.proto",
    "./packages/proto/src/proto/services/response.proto",
    "./packages/proto/src/proto/services/response_code.proto",
    "./packages/proto/src/proto/services/response_header.proto",
    "./packages/proto/src/proto/services/schedulable_transaction_body.proto",
    "./packages/proto/src/proto/services/schedule_create.proto",
    "./packages/proto/src/proto/services/schedule_delete.proto",
    "./packages/proto/src/proto/services/schedule_get_info.proto",
    "./packages/proto/src/proto/services/schedule_service.proto",
    "./packages/proto/src/proto/services/schedule_sign.proto",
    "./packages/proto/src/proto/services/smart_contract_service.proto",
    "./packages/proto/src/proto/services/system_delete.proto",
    "./packages/proto/src/proto/services/system_undelete.proto",
    "./packages/proto/src/proto/services/throttle_definitions.proto",
    "./packages/proto/src/proto/services/timestamp.proto",
    "./packages/proto/src/proto/services/token_associate.proto",
    "./packages/proto/src/proto/services/token_burn.proto",
    "./packages/proto/src/proto/services/token_create.proto",
    "./packages/proto/src/proto/services/token_delete.proto",
    "./packages/proto/src/proto/services/token_dissociate.proto",
    "./packages/proto/src/proto/services/token_fee_schedule_update.proto",
    "./packages/proto/src/proto/services/token_freeze_account.proto",
    "./packages/proto/src/proto/services/token_get_account_nft_infos.proto",
    "./packages/proto/src/proto/services/token_get_info.proto",
    "./packages/proto/src/proto/services/token_get_nft_info.proto",
    "./packages/proto/src/proto/services/token_get_nft_infos.proto",
    "./packages/proto/src/proto/services/token_grant_kyc.proto",
    "./packages/proto/src/proto/services/token_mint.proto",
    "./packages/proto/src/proto/services/token_pause.proto",
    "./packages/proto/src/proto/services/token_revoke_kyc.proto",
    "./packages/proto/src/proto/services/token_service.proto",
    "./packages/proto/src/proto/services/token_unfreeze_account.proto",
    "./packages/proto/src/proto/services/token_unpause.proto",
    "./packages/proto/src/proto/services/token_update.proto",
    "./packages/proto/src/proto/services/token_wipe_account.proto",
    "./packages/proto/src/proto/services/transaction.proto",
    "./packages/proto/src/proto/services/transaction_contents.proto",
    "./packages/proto/src/proto/services/transaction_get_fast_record.proto",
    "./packages/proto/src/proto/services/transaction_get_receipt.proto",
    "./packages/proto/src/proto/services/transaction_get_record.proto",
    "./packages/proto/src/proto/services/transaction_receipt.proto",
    "./packages/proto/src/proto/services/transaction_record.proto",
    "./packages/proto/src/proto/services/transaction_response.proto",
    "./packages/proto/src/proto/services/unchecked_submit.proto",
    "./packages/proto/src/proto/services/event_consensus_data.proto",
    "./packages/proto/src/proto/services/event_core.proto",
    "./packages/proto/src/proto/services/event_descriptor.proto",
    "./packages/proto/src/proto/services/event_transaction.proto",
    "./packages/proto/src/proto/services/gossip_event.proto",
    "./packages/proto/src/proto/services/state_signature_transaction.proto",
    "./packages/proto/src/proto/services/state/entity/entity_counts.proto",
];

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
 * @typedef {import("@hashgraph/proto").Response} proto.Response
 * @typedef {import("@hashgraph/proto").Query} proto.Query
 * @typedef {import("@hashgraph/proto").TransactionResponse} proto.TransactionResponse
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
                                value = response.call(request, index);
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

        this._index = 0;
    }

    /**
     * @param {Response[]} responses
     * @returns {this}
     */
    addServer(responses) {
        const address = `0.0.0.0:${50213 + this._index}`;
        const nodeAccountId = `0.0.${3 + this._index}`;
        const server = new GrpcServer(PROTOS).addResponses(responses);

        this._servers.push(server);
        this._addresses.push(address);
        this._nodeAccountIds.push(nodeAccountId);

        this._index += 1;

        return this;
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
