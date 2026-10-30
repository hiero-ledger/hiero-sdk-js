import {
    AccountId,
    AccountInfoQuery,
    FileContentsQuery,
    FileCreateTransaction,
    FileId,
    Hbar,
    PrivateKey,
    TokenAssociateTransaction,
    TokenId,
    TopicCreateTransaction,
    TopicId,
    TopicInfoQuery,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createAccount,
    createFungibleToken,
    getAccountBalance,
} from "./utils/Fixtures.js";

/**
 * The network's shard and realm come from the operator account, so these
 * tests run on any network. On one deployed with a non-zero shard and realm
 * (`task solo:setup -- --shard 1 --realm 2`) they check that every entity the
 * network creates lands there and that the SDK keeps both numbers through
 * parsing, serialization and execution.
 */
describe("ShardRealm", function () {
    let env;
    let shard;
    let realm;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
        shard = env.operatorId.shard;
        realm = env.operatorId.realm;
    });

    /**
     * @param {{ shard: Long, realm: Long }} entityId
     */
    function expectInNetwork(entityId) {
        expect(entityId.shard.toString()).to.equal(shard.toString());
        expect(entityId.realm.toString()).to.equal(realm.toString());
    }

    it("takes the client's shard and realm from the network", async function () {
        expect(env.client.shard.toString()).to.equal(shard.toString());
        expect(env.client.realm.toString()).to.equal(realm.toString());

        // ping() asks for the cost of an info query on <shard>.<realm>.2.
        for (const nodeAccountId of Object.values(env.client.network)) {
            expectInNetwork(AccountId.fromString(nodeAccountId.toString()));
        }
        await env.client.pingAll();
    });

    it("creates an account in the network's shard and realm", async function () {
        const { accountId } = await createAccount(env.client);
        expectInNetwork(accountId);

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);
        expect(info.accountId.toString()).to.equal(accountId.toString());
    });

    it("transfers hbar between accounts in the network's shard and realm", async function () {
        const { accountId } = await createAccount(env.client);

        const response = await new TransferTransaction()
            .addHbarTransfer(env.operatorId, new Hbar(-1))
            .addHbarTransfer(accountId, new Hbar(1))
            .execute(env.client);
        expectInNetwork(response.nodeId);

        const record = await response.getRecord(env.client);
        expectInNetwork(record.transactionId.accountId);
        // Node and fee collection accounts receive the fee, so every account
        // in the record is in the network's shard and realm, not 0.0.
        expect(record.transfers.length).to.be.greaterThan(2);
        for (const transfer of record.transfers) {
            expectInNetwork(transfer.accountId);
        }

        const balance = await getAccountBalance(env.client, accountId);
        expect(balance.hbars.toTinybars().toString()).to.equal(
            new Hbar(2).toTinybars().toString(),
        );
    });

    it("creates a token and transfers it", async function () {
        const tokenId = await createFungibleToken(env.client);
        expectInNetwork(tokenId);

        const { accountId, newKey } = await createAccount(env.client);
        await (
            await (
                await new TokenAssociateTransaction()
                    .setAccountId(accountId)
                    .setTokenIds([tokenId])
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const record = await (
            await new TransferTransaction()
                .addTokenTransfer(tokenId, env.operatorId, -10)
                .addTokenTransfer(tokenId, accountId, 10)
                .execute(env.client)
        ).getRecord(env.client);
        const tokenTransfers = record.tokenTransfers.get(tokenId);
        expect(tokenTransfers.get(accountId).toString()).to.equal("10");

        const balance = await getAccountBalance(env.client, accountId);
        expect(balance.tokens.get(tokenId).toString()).to.equal("10");
    });

    it("creates a file and a topic in the network's shard and realm", async function () {
        const { fileId } = await (
            await new FileCreateTransaction()
                .setKeys([env.operatorKey])
                .setContents("shard and realm")
                .execute(env.client)
        ).getReceipt(env.client);
        expectInNetwork(fileId);

        const contents = await new FileContentsQuery()
            .setFileId(fileId)
            .execute(env.client);
        expect(new TextDecoder().decode(contents)).to.equal("shard and realm");

        const { topicId } = await (
            await new TopicCreateTransaction()
                .setAdminKey(env.operatorKey)
                .execute(env.client)
        ).getReceipt(env.client);
        expectInNetwork(topicId);

        const info = await new TopicInfoQuery()
            .setTopicId(topicId)
            .execute(env.client);
        expect(info.topicId.toString()).to.equal(topicId.toString());
    });

    it("keeps the shard and realm when parsing and serializing IDs", async function () {
        const { accountId } = await createAccount(env.client);
        const tokenId = await createFungibleToken(env.client);
        const { topicId } = await (
            await new TopicCreateTransaction().execute(env.client)
        ).getReceipt(env.client);

        for (const [type, id] of [
            [AccountId, accountId],
            [TokenId, tokenId],
            [TopicId, topicId],
        ]) {
            expect(id.toString()).to.equal(`${shard}.${realm}.${id.num}`);
            expect(type.fromString(id.toString()).toString()).to.equal(
                id.toString(),
            );
            expect(type.fromBytes(id.toBytes()).toString()).to.equal(
                id.toString(),
            );
        }

        // A long-zero EVM address holds only the entity number since #3200,
        // so the shard and realm come from the caller.
        const evmAddress = accountId.toEvmAddress();
        expect(evmAddress).to.equal(
            new AccountId(0, 0, accountId.num).toEvmAddress(),
        );
        expect(
            AccountId.fromEvmAddress(shard, realm, evmAddress).toString(),
        ).to.equal(accountId.toString());

        expect(
            FileId.getAddressBookFileIdFor(shard, realm).toString(),
        ).to.equal(`${shard}.${realm}.102`);
    });

    it("creates an account from an EVM alias in the network's shard and realm", async function () {
        const evmAddress = PrivateKey.generateECDSA().publicKey.toEvmAddress();

        const receipt = await (
            await new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-1))
                .addHbarTransfer(
                    AccountId.fromEvmAddress(shard, realm, evmAddress),
                    new Hbar(1),
                )
                .execute(env.client)
        )
            .getReceiptQuery()
            .setIncludeChildren(true)
            .execute(env.client);

        const accountId = receipt.children[0].accountId;
        expectInNetwork(accountId);

        const info = await new AccountInfoQuery()
            .setAccountId(AccountId.fromEvmAddress(shard, realm, evmAddress))
            .execute(env.client);
        expect(info.accountId.toString()).to.equal(accountId.toString());
    });

    afterAll(async function () {
        await env.close();
    });
});
