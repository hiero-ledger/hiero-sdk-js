// SPDX-License-Identifier: Apache-2.0

import sinon from "sinon";
import {
    AccountId,
    ContractId,
    MirrorNodeAccountBalanceQuery,
    PublicKey,
    TokenId,
} from "../../src/exports.js";
import { Client } from "../../src/index.js";
import * as EntityIdHelper from "../../src/EntityIdHelper.js";

const MIRROR_HOST = "mirror.example.com";
const BASE_URL = `https://${MIRROR_HOST}:443/api/v1`;

/**
 * The mirror node's `/accounts/{id}` response. `balance.tokens` is a
 * truncated preview and must be ignored in favour of `/tokens`.
 */
const ACCOUNT_RESPONSE = {
    account: "0.0.123",
    balance: {
        balance: 5000000000,
        timestamp: "1234567890.000000001",
        tokens: [{ token_id: "0.0.999", balance: 1 }],
    },
    links: { next: "/api/v1/accounts/0.0.123?timestamp=lt:1234567890" },
};

const TOKENS_RESPONSE = {
    tokens: [
        {
            token_id: "0.0.111",
            balance: 250,
            decimals: 3,
            automatic_association: true,
        },
        {
            token_id: "0.0.222",
            balance: 7,
            decimals: 0,
            automatic_association: false,
        },
    ],
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

        fetchStub = sinon.stub().callsFake((url) => {
            const body = url.includes("/tokens")
                ? TOKENS_RESPONSE
                : ACCOUNT_RESPONSE;
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(body),
            });
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

    it("should accept a ContractId instance and a string", function () {
        const id = new ContractId(456);

        expect(
            new MirrorNodeAccountBalanceQuery().setContractId(id).contractId,
        ).to.equal(id);
        expect(
            new MirrorNodeAccountBalanceQuery()
                .setContractId("0.0.456")
                .contractId.toString(),
        ).to.equal("0.0.456");
    });

    it("should throw on a malformed id without performing a request", function () {
        expect(() =>
            new MirrorNodeAccountBalanceQuery().setAccountId("not-an-id"),
        ).to.throw();
        expect(fetchStub.called).to.be.false;
    });

    it("should reject an account id and a contract id at the same time", function () {
        expect(() =>
            new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .setContractId("0.0.456"),
        ).to.throw(/either an account ID or a contract ID/);

        expect(() =>
            new MirrorNodeAccountBalanceQuery()
                .setContractId("0.0.456")
                .setAccountId("0.0.123"),
        ).to.throw(/either an account ID or a contract ID/);
    });

    it("should reject when no id is set", async function () {
        let message = "";
        try {
            await new MirrorNodeAccountBalanceQuery().execute(client);
        } catch (error) {
            message = error.message;
        }
        expect(message).to.include("requires an account ID or a contract ID");
        expect(fetchStub.called).to.be.false;
    });

    it("should query the accounts endpoint by shard.realm.num", async function () {
        await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(fetchStub.firstCall.args[0]).to.equal(
            `${BASE_URL}/accounts/0.0.123`,
        );
        expect(fetchStub.secondCall.args[0]).to.equal(
            `${BASE_URL}/accounts/0.0.123/tokens`,
        );
    });

    it("should query a contract id through the accounts endpoint", async function () {
        await new MirrorNodeAccountBalanceQuery()
            .setContractId("0.0.456")
            .execute(client);

        expect(fetchStub.firstCall.args[0]).to.equal(
            `${BASE_URL}/accounts/0.0.456`,
        );
    });

    it("should query an evm address as bare hex", async function () {
        const evmAddress = "67900ac7415136de991114c8d7210c7a6617f0ee";

        await new MirrorNodeAccountBalanceQuery()
            .setAccountId(AccountId.fromString(evmAddress))
            .execute(client);

        expect(fetchStub.firstCall.args[0]).to.equal(
            `${BASE_URL}/accounts/${evmAddress}`,
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
            `${BASE_URL}/accounts/${alias}`,
        );
    });

    it("should return the hbar, token and decimal balances", async function () {
        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(balance.hbars.toTinybars().toString()).to.equal("5000000000");

        // The `/tokens` endpoint wins — the truncated `balance.tokens`
        // preview (0.0.999) must not appear.
        expect(balance.tokens.get(TokenId.fromString("0.0.999"))).to.be.null;
        expect(
            balance.tokens.get(TokenId.fromString("0.0.111")).toString(),
        ).to.equal("250");
        expect(
            balance.tokens.get(TokenId.fromString("0.0.222")).toString(),
        ).to.equal("7");
        expect(
            balance.tokenDecimals.get(TokenId.fromString("0.0.111")),
        ).to.equal(3);
        expect(
            balance.tokenDecimals.get(TokenId.fromString("0.0.222")),
        ).to.equal(0);
    });
});
