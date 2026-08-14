// SPDX-License-Identifier: Apache-2.0

import sinon from "sinon";
import {
    AccountId,
    MirrorNodeAccountBalance,
    MirrorNodeAccountBalanceQuery,
    PublicKey,
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

    it("should return zero hbars for an empty balances array", async function () {
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

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(balance.hbars.toTinybars().toString()).to.equal("0");
    });

    it("should be immutable", async function () {
        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(Object.isFrozen(balance)).to.be.true;
    });
});
