import {
    AccountInfoQuery,
    Hbar,
    PrivateKey,
    Status,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createAccount,
    createFungibleToken,
    deleteAccount,
} from "./utils/Fixtures.js";

describe("AccountInfo", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be able to query cost", async function () {
        const operatorId = env.operatorId;

        const cost = await new AccountInfoQuery()
            .setAccountId(operatorId)
            .getCost(env.client);

        expect(cost.toTinybars().toInt()).to.be.at.least(1);
    });

    it("should error on query cost on deleted account with ACCOUNT_DELETED", async function () {
        const newKey = PrivateKey.generate();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction
                .setKeyWithoutAlias(newKey.publicKey)
                .setInitialBalance(new Hbar(10)); // 10 h
        });

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId);
        });

        let err;
        try {
            await new AccountInfoQuery()
                .setAccountId(accountId)
                .getCost(env.client);
        } catch (error) {
            err = error.toString().includes(Status.AccountDeleted.toString());
        }

        if (!err) {
            throw new Error("query cost did not error");
        }
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction
                .setKeyWithoutAlias(key.publicKey)
                .setInitialBalance(new Hbar(2));
        });

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(accountId.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key.publicKey.toString());
        expect(info.balance.toTinybars().toInt()).to.be.equal(
            new Hbar(2).toTinybars().toInt(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toInt()).to.be.equal(0);

        await deleteAccount(env.client, key, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId)
                .setTransactionId(TransactionId.generate(accountId));
        });
    });

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("should be able to get 300 accounts", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();
        let response = [];
        let info = [];

        for (let i = 0; i < 300; i++) {
            response[i] = await createAccount(env.client, (transaction) => {
                transaction
                    .setKeyWithoutAlias(key.publicKey)
                    .setInitialBalance(new Hbar(2));
            });
        }

        for (let i = 0; i < 300; i++) {
            info[i] = await new AccountInfoQuery()
                .setAccountId(response[i].accountId)
                .execute(env.client);
        }

        for (let i = 0; i < 300; i++) {
            await deleteAccount(env.client, key, (transaction) => {
                transaction
                    .setAccountId(response[i].accountId)
                    .setTransferAccountId(operatorId)
                    .setTransactionId(
                        TransactionId.generate(response[i].accountId),
                    );
            });
        }
    });

    it("should reflect token with no keys", async function () {
        const operatorId = env.operatorId;

        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction
                .setSupplyKey(null)
                .setKycKey(null)
                .setWipeKey(null)
                .setFreezeKey(null)
                .setAdminKey(null)
                .setPauseKey(null)
                .setMetadataKey(null)
                .setSupplyKey(null)
                .setFeeScheduleKey(null)
                .setInitialSupply(0);
        });

        const info = await new AccountInfoQuery()
            .setAccountId(operatorId)
            .execute(env.client);

        const relationship = info.tokenRelationships.get(tokenId);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(tokenId.toString());
        expect(relationship.balance.toInt()).to.be.equal(0);
        expect(relationship.isKycGranted).to.be.null;
        expect(relationship.isFrozen).to.be.null;
    });

    it("should be error with no account ID", async function () {
        let err = false;

        try {
            await new AccountInfoQuery().execute(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountId.toString());
        }

        if (!err) {
            throw new Error("query did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
