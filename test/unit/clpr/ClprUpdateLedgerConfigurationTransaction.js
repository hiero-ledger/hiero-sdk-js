// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import {
    makeLedgerConfigurationResponse,
    makeThrottleLimits,
} from "../utils/ClprLedgerConfiguration.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function updateLedgerConfiguration(props) {
    expect(
        sdk.ClprUpdateLedgerConfigurationTransaction,
        "SDK must export ClprUpdateLedgerConfigurationTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprUpdateLedgerConfigurationTransaction(props);
}

function offline(transaction) {
    return transaction
        .setNodeAccountIds([new sdk.AccountId(3), new sdk.AccountId(4)])
        .setTransactionId(
            sdk.TransactionId.withValidStart(
                new sdk.AccountId(5006),
                new sdk.Timestamp(1596210382, 0),
            ),
        )
        .setMaxTransactionFee(new sdk.Hbar(1));
}

function expectThrottles(actual, limits) {
    expect(actual).toBeInstanceOf(sdk.ClprThrottles);
    for (const field of [
        "maxMessagesPerBundle",
        "maxMessagePayloadBytes",
        "maxQueueDepth",
        "maxLocalEndpoints",
        "maxPeerEndpoints",
    ]) {
        expect(actual[field], field).toBe(limits[field]);
    }
    for (const field of ["maxGasPerMessage", "maxSyncBytes"]) {
        expect(Long.isLong(actual[field]), field).toBe(true);
        expect(actual[field].unsigned, field).toBe(true);
        expect(actual[field].toString(), field).toBe(limits[field].toString());
    }
}

function bodies(bytes) {
    return proto.TransactionList.decode(bytes).transactionList.map(
        (transaction) =>
            proto.TransactionBody.decode(
                transaction.signedTransactionBytes?.length
                    ? proto.SignedTransaction.decode(
                          transaction.signedTransactionBytes,
                      ).bodyBytes
                    : transaction.bodyBytes,
            ),
    );
}

function expectOnlyThrottles(body, limits) {
    expect(body.data).toBe("clprUpdateLedgerConfiguration");
    const update = body.clprUpdateLedgerConfiguration;
    expect(Object.keys(update)).toEqual(["configuration"]);
    expect(Object.keys(update.configuration)).toEqual(["throttles"]);
    for (const field of [
        "maxMessagesPerBundle",
        "maxMessagePayloadBytes",
        "maxGasPerMessage",
        "maxQueueDepth",
        "maxSyncBytes",
        "maxLocalEndpoints",
        "maxPeerEndpoints",
    ]) {
        expect(update.configuration.throttles[field], field).toEqual(
            limits[field],
        );
    }
}

function wireBytes(configuration, key) {
    const bodyBytes = proto.TransactionBody.encode({
        transactionID: sdk.TransactionId.fromString(
            "0.0.5006@1596210382.0",
        )._toProtobuf(),
        nodeAccountID: new sdk.AccountId(3)._toProtobuf(),
        transactionFee: new sdk.Hbar(1).toTinybars(),
        transactionValidDuration: { seconds: 120 },
        clprUpdateLedgerConfiguration: { configuration },
    }).finish();
    const transaction = key
        ? {
              signedTransactionBytes: proto.SignedTransaction.encode({
                  bodyBytes,
                  sigMap: {
                      sigPair: [
                          {
                              pubKeyPrefix: key.publicKey.toBytesRaw(),
                              ed25519: key.sign(bodyBytes),
                          },
                      ],
                  },
              }).finish(),
          }
        : { bodyBytes };

    return proto.TransactionList.encode({
        transactionList: [transaction],
    }).finish();
}

const schedulingPaths = [
    ["schedule()", (transaction) => transaction.schedule()],
    [
        "ScheduleCreateTransaction.setScheduledTransaction()",
        (transaction) =>
            new sdk.ScheduleCreateTransaction().setScheduledTransaction(
                transaction,
            ),
    ],
    [
        "_getScheduledTransactionBody()",
        (transaction) => transaction._getScheduledTransactionBody(),
    ],
];

describe("ClprUpdateLedgerConfigurationTransaction", function () {
    it("exports the class from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry.ClprUpdateLedgerConfigurationTransaction).toBeTypeOf(
            "function",
        );
        expect(entry.ClprUpdateLedgerConfigurationTransaction).toBe(
            sdk.ClprUpdateLedgerConfigurationTransaction,
        );
    });

    it.each(["constructor", "setter"])(
        "round-trips all seven throttles and unsigned uint64 values through the %s",
        function (path) {
            const limits = {
                ...makeThrottleLimits(),
                maxGasPerMessage: Long.fromString("9007199254740993", true),
                maxSyncBytes: Long.fromString("18446744073709551615", true),
                maxLocalEndpoints: 0,
                maxPeerEndpoints: 0,
            };
            const throttles = sdk.ClprThrottles.of(limits);
            const transaction = offline(
                path === "constructor"
                    ? updateLedgerConfiguration({ throttles })
                    : updateLedgerConfiguration().setThrottles(throttles),
            );
            const bytes = transaction.toBytes();
            const decoded = sdk.Transaction.fromBytes(bytes);

            expect(decoded).toBeInstanceOf(
                sdk.ClprUpdateLedgerConfigurationTransaction,
            );
            expectThrottles(transaction.throttles, limits);
            expectThrottles(decoded.throttles, limits);
            expect(decoded.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            expect(decoded.nodeAccountIds.map(String)).toEqual([
                "0.0.3",
                "0.0.4",
            ]);
            expect(decoded.toBytes()).toEqual(bytes);
            for (const body of bodies(bytes)) {
                expectOnlyThrottles(body, limits);
            }
        },
    );

    it("keeps uint64 max gas and sync bytes above 2^53 without rounding", function () {
        const limits = {
            ...makeThrottleLimits(),
            maxGasPerMessage: Long.fromString("18446744073709551615", true),
            maxSyncBytes: Long.fromString("9007199254740995", true),
        };
        const transaction = offline(
            updateLedgerConfiguration({
                throttles: sdk.ClprThrottles.of(limits),
            }),
        ).freeze();
        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expectThrottles(decoded.throttles, limits);
        expect(decoded.toBytes()).toEqual(bytes);
        for (const body of bodies(bytes)) {
            expectOnlyThrottles(body, limits);
        }
    });

    it("preserves both signing schemes and signatures for every node through bytes", async function () {
        const limits = makeThrottleLimits();
        const transaction = offline(
            updateLedgerConfiguration({
                throttles: sdk.ClprThrottles.of(limits),
            }),
        ).freeze();
        const keys = vectors.vectors.map((vector) =>
            vector.signatureScheme === "ECDSA_SECP256K1"
                ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
                : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed),
        );
        for (const key of keys) {
            await transaction.sign(key);
        }

        const bytes = transaction.toBytes();
        const decoded = sdk.Transaction.fromBytes(bytes);

        expectThrottles(decoded.throttles, limits);
        expect(decoded.toBytes()).toEqual(bytes);
        expect(decoded.getSignatures().size).toBe(2);
        for (const [, nodeSignatures] of decoded.getSignatures()) {
            const signatures = nodeSignatures.get(decoded.transactionId);
            expect(signatures.size).toBe(2);
            for (const key of keys) {
                expect(signatures.get(key.publicKey)).toBeInstanceOf(
                    Uint8Array,
                );
                expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
            }
        }
    });

    it("decodes signed configuration bytes without exposing genesis fields or rewriting signatures", function () {
        const configuration = makeLedgerConfigurationResponse().configuration;
        const key = sdk.PrivateKey.fromStringED25519(
            vectors.vectors[1].privateKeyOrSeed,
        );
        const bytes = wireBytes(configuration, key);
        const decoded = sdk.Transaction.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(
            sdk.ClprUpdateLedgerConfigurationTransaction,
        );
        expectThrottles(decoded.throttles, configuration.throttles);
        for (const field of [
            "configuration",
            "protocolVersion",
            "chainId",
            "serviceAddress",
            "timestamp",
            "initialTrustAnchor",
            "initialTrustAnchorId",
        ]) {
            expect(field in decoded, field).toBe(false);
        }
        expect(decoded.isFrozen()).toBe(true);
        expect(decoded.toBytes()).toEqual(bytes);
        expect(key.publicKey.verifyTransaction(decoded)).toBe(true);
        expect(
            bodies(decoded.toBytes())[0].clprUpdateLedgerConfiguration
                .configuration,
        ).toEqual(configuration);
    });

    it("rebuilds a decoded unfrozen configuration with only throttles", function () {
        const configuration = makeLedgerConfigurationResponse().configuration;
        const decoded = sdk.Transaction.fromBytes(wireBytes(configuration));

        expect(decoded).toBeInstanceOf(
            sdk.ClprUpdateLedgerConfigurationTransaction,
        );
        expect(decoded.isFrozen()).toBe(false);
        expectThrottles(decoded.throttles, configuration.throttles);
        for (const body of bodies(decoded.toBytes())) {
            expectOnlyThrottles(body, configuration.throttles);
        }
    });

    it.each(["freeze", "freezeWith"])(
        "rejects %s without throttles before freezing",
        function (method) {
            const transaction = offline(updateLedgerConfiguration());

            expect(transaction.throttles).toBeNull();
            expect(() => transaction[method](null)).toThrow(/throttles/);
            expect(transaction.isFrozen()).toBe(false);
            transaction.setThrottles(
                sdk.ClprThrottles.of(makeThrottleLimits()),
            );
            expect(() => transaction[method](null)).not.toThrow();
        },
    );

    it("returns the builder from the throttles setter", function () {
        const transaction = updateLedgerConfiguration();
        const throttles = sdk.ClprThrottles.of(makeThrottleLimits());

        expect(transaction.setThrottles(throttles)).toBe(transaction);
        expectThrottles(transaction.throttles, makeThrottleLimits());
    });

    it("rejects the throttles setter after freeze and keeps signed bytes unchanged", async function () {
        const limits = makeThrottleLimits();
        const transaction = offline(
            updateLedgerConfiguration({
                throttles: sdk.ClprThrottles.of(limits),
            }),
        ).freeze();
        const key = sdk.PrivateKey.fromStringED25519(
            vectors.vectors[1].privateKeyOrSeed,
        );
        await transaction.sign(key);
        const bytes = transaction.toBytes();

        expect(() =>
            transaction.setThrottles(
                sdk.ClprThrottles.of({ ...limits, maxQueueDepth: 17 }),
            ),
        ).toThrow(/immutable/);
        expectThrottles(transaction.throttles, limits);
        expect(transaction.toBytes()).toEqual(bytes);
        expect(key.publicKey.verifyTransaction(transaction)).toBe(true);
    });

    it("reads configuration throttles, changes one limit and preserves the other six", function () {
        const response = makeLedgerConfigurationResponse();
        response.configuration.throttles.maxSyncBytes = Long.fromString(
            "18446744073709551615",
            true,
        );
        const info = sdk.ClprLedgerConfigurationInfo._fromProtobuf(response);
        const current = info.throttles;
        const throttles = sdk.ClprThrottles.of({
            maxMessagesPerBundle: current.maxMessagesPerBundle,
            maxMessagePayloadBytes: current.maxMessagePayloadBytes,
            maxGasPerMessage: current.maxGasPerMessage,
            maxQueueDepth: 17,
            maxSyncBytes: current.maxSyncBytes,
            maxLocalEndpoints: current.maxLocalEndpoints,
            maxPeerEndpoints: current.maxPeerEndpoints,
        });
        const transaction = offline(
            updateLedgerConfiguration().setThrottles(throttles),
        );
        const decoded = sdk.Transaction.fromBytes(transaction.toBytes());
        const expected = {
            ...response.configuration.throttles,
            maxQueueDepth: 17,
        };

        expectThrottles(decoded.throttles, expected);
        expectThrottles(info.throttles, response.configuration.throttles);
        for (const body of bodies(transaction.toBytes())) {
            expectOnlyThrottles(body, expected);
        }
    });

    it.each(schedulingPaths)("refuses %s", function (_name, schedule) {
        const transaction = updateLedgerConfiguration({
            throttles: sdk.ClprThrottles.of(makeThrottleLimits()),
        });

        expect(() => schedule(transaction)).toThrow(
            new Error(
                "ClprUpdateLedgerConfigurationTransaction cannot be scheduled",
            ),
        );
    });
});
