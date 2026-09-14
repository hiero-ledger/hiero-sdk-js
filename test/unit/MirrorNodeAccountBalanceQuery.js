// SPDX-License-Identifier: Apache-2.0

import sinon from "sinon";
import {
    AccountId,
    MirrorNodeAccountBalance,
    MirrorNodeAccountBalanceQuery,
    MirrorNodeStatusError,
    PublicKey,
    Status,
} from "../../src/exports.js";
import { Client } from "../../src/index.js";
import * as EntityIdHelper from "../../src/EntityIdHelper.js";

const MIRROR_HOST = "mirror.example.com";
const BASE_URL = `https://${MIRROR_HOST}:443/api/v1`;

const BALANCES_RESPONSE = {
    timestamp: "1234567890.000000001",
    balances: [{ account: "0.0.123", balance: 5000000000 }],
    links: { next: null },
};

describe("MirrorNodeAccountBalanceQuery", function () {
    let originalFetch;
    let fetchStub;
    let client;

    /**
     * @returns {typeof globalThis}
     */
    function globalObject() {
        return typeof global !== "undefined" ? global : window;
    }

    beforeEach(function () {
        originalFetch = globalObject().fetch;

        fetchStub = sinon.stub().resolves({
            ok: true,
            status: 200,
            json: () => Promise.resolve(BALANCES_RESPONSE),
        });

        globalObject().fetch = fetchStub;

        client = new Client();
        client.setMirrorNetwork([`${MIRROR_HOST}:443`]);
    });

    afterEach(function () {
        globalObject().fetch = originalFetch;
    });

    it("should accept an AccountId instance and a string", function () {
        const id = new AccountId(123);

        expect(
            new MirrorNodeAccountBalanceQuery().setAccountId(id).accountId,
        ).to.equal(id);
        expect(
            new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .accountId.toString(),
        ).to.equal("0.0.123");
        expect(
            new MirrorNodeAccountBalanceQuery({
                accountId: "0.0.123",
            }).accountId.toString(),
        ).to.equal("0.0.123");
    });

    it("should throw on a malformed id without performing a request", function () {
        expect(() =>
            new MirrorNodeAccountBalanceQuery().setAccountId("not-an-id"),
        ).to.throw();
        expect(fetchStub.called).to.be.false;
    });

    it("should reject when no id is set", async function () {
        let message = "";
        try {
            await new MirrorNodeAccountBalanceQuery().execute(client);
        } catch (error) {
            message = error.message;
        }
        expect(message).to.include("requires an account ID");
        expect(fetchStub.called).to.be.false;
    });

    it("should query the balances endpoint by shard.realm.num", async function () {
        await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal(
            `${BASE_URL}/balances?account.id=0.0.123`,
        );
    });

    it("should query an evm address as bare hex", async function () {
        const evmAddress = "67900ac7415136de991114c8d7210c7a6617f0ee";

        await new MirrorNodeAccountBalanceQuery()
            .setAccountId(AccountId.fromString(evmAddress))
            .execute(client);

        expect(fetchStub.firstCall.args[0]).to.equal(
            `${BASE_URL}/balances?account.id=${evmAddress}`,
        );
    });

    it("should query an alias key as a base32 alias", async function () {
        const publicKey = PublicKey.fromString(
            "302a300506032b6570032100e0c8ec2758a5879ffac226a13c0c516b799e72e35141a0dd828f94d37988a4b7",
        );
        const accountId = new AccountId(0, 0, 0, publicKey);
        const alias = EntityIdHelper.publicKeyToAlias(publicKey);

        await new MirrorNodeAccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);

        expect(alias).to.not.be.null;
        expect(fetchStub.firstCall.args[0]).to.equal(
            `${BASE_URL}/balances?account.id=${alias}`,
        );
    });

    it("should return the hbar balance", async function () {
        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(balance).to.be.instanceOf(MirrorNodeAccountBalance);
        expect(balance.hbars.toTinybars().toString()).to.equal("5000000000");
    });

    it("should fail with INVALID_ACCOUNT_ID for an empty balances array", async function () {
        fetchStub.resolves({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    timestamp: null,
                    balances: [],
                    links: { next: null },
                }),
        });

        let error = null;
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client);
        } catch (err) {
            error = err;
        }

        expect(error).to.be.instanceOf(MirrorNodeStatusError);
        expect(error.status).to.equal(Status.InvalidAccountId);
        expect(error.message).to.include("0.0.123");
    });

    it("should name the resolved alias when an alias is not found", async function () {
        const publicKey = PublicKey.fromString(
            "302a300506032b6570032100e0c8ec2758a5879ffac226a13c0c516b799e72e35141a0dd828f94d37988a4b7",
        );
        const alias = EntityIdHelper.publicKeyToAlias(publicKey);

        fetchStub.resolves({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ timestamp: null, balances: [] }),
        });

        let message = "";
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId(new AccountId(0, 0, 0, publicKey))
                .execute(client);
        } catch (error) {
            message = error.message;
        }

        // The form actually sent is what you need to debug a false not-found.
        expect(message).to.include(alias);
    });

    it("should reject a response with no balances array as malformed", async function () {
        fetchStub.resolves({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ timestamp: null }),
        });

        let error = null;
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client);
        } catch (err) {
            error = err;
        }

        // A malformed payload is not a missing account and must not be
        // reported as INVALID_ACCOUNT_ID.
        expect(error).to.not.be.instanceOf(MirrorNodeStatusError);
        expect(error.message).to.include("no balances array");
    });

    it("should reject a null response body as malformed", async function () {
        fetchStub.resolves({
            ok: true,
            status: 200,
            json: () => Promise.resolve(null),
        });

        let error = null;
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client);
        } catch (err) {
            error = err;
        }

        expect(error).to.not.be.instanceOf(MirrorNodeStatusError);
        expect(error.message).to.include("no balances array");
    });

    it("should reject a balance that is not a number", async function () {
        // `Long.fromValue` coerces a string, boolean or object to 0, which
        // would silently reintroduce the zero this query stopped returning.
        for (const balance of ["abc", true, {}, undefined]) {
            fetchStub.resolves({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        balances: [{ account: "0.0.123", balance }],
                    }),
            });

            let error = null;
            try {
                await new MirrorNodeAccountBalanceQuery()
                    .setAccountId("0.0.123")
                    .execute(client);
            } catch (err) {
                error = err;
            }

            expect(error, `balance: ${JSON.stringify(balance)}`).to.not.be.null;
            expect(error.message).to.include("balance is not a number");
        }
    });

    it("should reject a non-array balances field as malformed", async function () {
        fetchStub.resolves({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ balances: { account: "0.0.123" } }),
        });

        let error = null;
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client);
        } catch (err) {
            error = err;
        }

        // Without an Array.isArray check this fell through both guards and
        // died on `undefined.balance` deep inside `long`.
        expect(error).to.not.be.instanceOf(MirrorNodeStatusError);
        expect(error.message).to.include("no balances array");
    });

    it("should be immutable", async function () {
        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(Object.isFrozen(balance)).to.be.true;
    });
});
