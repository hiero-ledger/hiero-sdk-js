// SPDX-License-Identifier: Apache-2.0
import tls from "tls";
import { Client, credentials, Metadata } from "@grpc/grpc-js";
import Channel from "./Channel.js";
import GrpcServicesError from "../grpc/GrpcServiceError.js";
import GrpcStatus from "../grpc/GrpcStatus.js";
import { ALL_NETWORK_IPS } from "../constants/ClientConstants.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";

/** @type {{ [key: string]: Client }} */
const clientCache = {};

export default class NodeChannel extends Channel {
    /**
     * @internal
     * @param {string} address
     * @param {number=} maxExecutionTime
     */
    constructor(address, maxExecutionTime) {
        super();

        /** @type {Client | null} */
        this._client = null;

        this.address = address;
        this.maxExecutionTime = maxExecutionTime;

        const { ip, port } = this.parseAddress(address);
        this.nodeIp = ip;
        this.nodePort = port;
    }

    /**
     * Convert certificate bytes to PEM format
     * @param {Buffer} certBytes
     * @returns {string}
     */
    bytesToPem(certBytes) {
        const base64Cert = certBytes.toString("base64");
        const lines = base64Cert.match(/.{1,64}/g)?.join("\n") || "";
        return `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----`;
    }

    /**
     * Validates and parses an address in the "IP:Port" format.
     * @param {string} address
     * @returns {{ ip: string, port: string }}
     */
    parseAddress(address) {
        const [ip, port] = address.split(":");
        if (!ip || !port) {
            throw new Error(
                "Invalid address format. Expected format: 'IP:Port'",
            );
        }
        return { ip, port };
    }

    /**
     * Retrieve the server's certificate dynamically.
     * @returns {Promise<string>}
     */
    async _retrieveCertificate() {
        return new Promise((resolve, reject) => {
            const socket = tls.connect(
                {
                    host: this.nodeIp,
                    port: Number(this.nodePort),
                    rejectUnauthorized: false,
                },
                () => {
                    try {
                        const cert = socket.getPeerCertificate();

                        if (cert && cert.raw) {
                            resolve(this.bytesToPem(cert.raw));
                        } else {
                            reject(new Error("No certificate retrieved."));
                        }
                    } catch (err) {
                        reject(err);
                    } finally {
                        socket.end();
                    }
                },
            );

            socket.on("error", reject);
        });
    }

    /**
     * Initialize the gRPC client
     * @returns {Promise<void>}
     */
    async _initializeClient() {
        if (clientCache[this.address]) {
            this._client = clientCache[this.address];
            return;
        }

        let security;
        const options = {
            "grpc.ssl_target_name_override": "127.0.0.1",
            "grpc.default_authority": "127.0.0.1",
            "grpc.http_connect_creds": "0",
            "grpc.keepalive_time_ms": 100000,
            "grpc.keepalive_timeout_ms": 10000,
            "grpc.keepalive_permit_without_calls": 1,
            "grpc.enable_retries": 1,
        };

        // If the port is 50212, use TLS
        if (this.nodePort === "50212") {
            const certificate = Buffer.from(await this._retrieveCertificate());

            security = credentials.createSsl(certificate);
        } else {
            security = credentials.createInsecure();
        }

        this._client = new Client(this.address, security, options);

        clientCache[this.address] = this._client;
    }

    /**
     * @override
     * @returns {void}
     */
    close() {
        if (this._client) {
            this._client.close();
            delete clientCache[this.address];
        }
    }

    /**
     * @override
     * @protected
     * @param {string} serviceName
     * @returns {import("protobufjs").RPCImpl}
     */
    _createUnaryClient(serviceName) {
        return (method, requestData, callback) => {
            this._initializeClient()
                .then(() => {
                    const deadline = new Date();
                    const milliseconds = this.maxExecutionTime
                        ? this.maxExecutionTime
                        : 10000;
                    deadline.setMilliseconds(
                        deadline.getMilliseconds() + milliseconds,
                    );

                    this._client?.waitForReady(deadline, (err) => {
                        if (err) {
                            callback(
                                new GrpcServicesError(
                                    GrpcStatus.Timeout,
                                    // Added colons to the IP address to resolve a SonarCloud IP issue.
                                    ALL_NETWORK_IPS[`${this.nodeIp}:`],
                                ),
                            );
                        } else {
                            // Create metadata with user agent
                            const metadata = new Metadata();

                            metadata.set(
                                "x-user-agent",
                                `${SDK_NAME}/${SDK_VERSION}`,
                            );

                            this._client?.makeUnaryRequest(
                                `/proto.${serviceName}/${method.name}`,
                                (value) => value,
                                (value) => value,
                                Buffer.from(requestData),
                                metadata,
                                (e, r) => {
                                    callback(e, r);
                                },
                            );
                        }
                    });
                })
                .catch((err) => {
                    if (err instanceof Error) {
                        callback(err);
                    } else {
                        callback(new Error("An unexpected error occurred"));
                    }
                });
        };
    }
}
