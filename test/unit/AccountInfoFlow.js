import { vi } from "vitest";
import {
    AccountId,
    AccountInfo,
    AccountInfoFlow,
    AccountInfoQuery,
    Client,
    Hbar,
    KeyList,
    PrivateKey,
    Timestamp,
    TransactionId,
    TransferTransaction,
} from "../../src/index.js";

describe("AccountInfoFlow", function () {
    const ACCOUNT_ID = new AccountId(0, 0, 1002);
    const VALID_START = new Timestamp(1596210382, 0);

    let client;
    let privateKey;
    let key;
    let message;

    beforeEach(function () {
        client = Client.forMainnet({ scheduleNetworkUpdate: false });
        privateKey = PrivateKey.generateED25519();
        key = privateKey.publicKey;
        message = new Uint8Array([1, 2, 3]);
    });

    afterEach(function () {
        vi.restoreAllMocks();
        client.close();
    });

    /**
     * @param {import("../../src/PublicKey.js").default | import("../../src/KeyList.js").default} key
     * @returns {AccountInfo}
     */
    function accountInfo(key) {
        return new AccountInfo({ accountId: ACCOUNT_ID, key });
    }

    /**
     * @param {AccountInfo} info
     * @returns {import("vitest").MockInstance}
     */
    function mockExecute(info) {
        return vi
            .spyOn(AccountInfoQuery.prototype, "execute")
            .mockResolvedValue(info);
    }

    /**
     * @param {AccountInfo} info
     * @returns {import("vitest").MockInstance}
     */
    function mockExecuteWithSigner(info) {
        return vi
            .spyOn(AccountInfoQuery.prototype, "executeWithSigner")
            .mockResolvedValue(info);
    }

    /**
     * @param {import("../../src/PrivateKey.js").default} signer
     * @returns {Promise<TransferTransaction>}
     */
    async function signedTransaction(signer) {
        return /** @type {Promise<TransferTransaction>} */ (
            new TransferTransaction()
                .addHbarTransfer(new AccountId(0, 0, 3), new Hbar(1))
                .addHbarTransfer(new AccountId(0, 0, 4), new Hbar(-1))
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(ACCOUNT_ID, VALID_START),
                )
                .freeze()
                .sign(signer)
        );
    }

    describe("verifySignature", function () {
        it("should resolve to true for a matching signature", async function () {
            mockExecute(accountInfo(key));

            expect(
                await AccountInfoFlow.verifySignature(
                    client,
                    ACCOUNT_ID,
                    message,
                    privateKey.sign(message),
                ),
            ).to.be.true;
        });

        it("should resolve to false for a mismatching signature", async function () {
            mockExecute(accountInfo(key));

            expect(
                await AccountInfoFlow.verifySignature(
                    client,
                    ACCOUNT_ID,
                    message,
                    PrivateKey.generateED25519().sign(message),
                ),
            ).to.be.false;
        });

        it("should resolve to false when the account key is a key list", async function () {
            mockExecute(
                accountInfo(new KeyList([PrivateKey.generateED25519()])),
            );

            expect(
                await AccountInfoFlow.verifySignature(
                    client,
                    ACCOUNT_ID,
                    message,
                    privateKey.sign(message),
                ),
            ).to.be.false;
        });

        it("should query the account's info", async function () {
            const execute = mockExecute(accountInfo(key));

            await AccountInfoFlow.verifySignature(
                client,
                ACCOUNT_ID,
                message,
                privateKey.sign(message),
            );

            expect(execute).toHaveBeenCalledTimes(1);
        });
    });

    describe("verifyTransaction", function () {
        it("should resolve to true when signed with the account key", async function () {
            mockExecute(accountInfo(key));

            expect(
                await AccountInfoFlow.verifyTransaction(
                    client,
                    ACCOUNT_ID,
                    await signedTransaction(privateKey),
                ),
            ).to.be.true;
        });

        it("should resolve to false when signed with another key", async function () {
            mockExecute(accountInfo(key));

            expect(
                await AccountInfoFlow.verifyTransaction(
                    client,
                    ACCOUNT_ID,
                    await signedTransaction(PrivateKey.generateED25519()),
                ),
            ).to.be.false;
        });

        it("should resolve to false when the account key is a key list", async function () {
            mockExecute(
                accountInfo(new KeyList([PrivateKey.generateED25519()])),
            );

            expect(
                await AccountInfoFlow.verifyTransaction(
                    client,
                    ACCOUNT_ID,
                    await signedTransaction(privateKey),
                ),
            ).to.be.false;
        });
    });

    describe("verifySignatureWithSigner", function () {
        it("should resolve to true for a matching signature", async function () {
            mockExecuteWithSigner(accountInfo(key));

            const signer = {
                call: vi.fn(),
            };

            expect(
                await AccountInfoFlow.verifySignatureWithSigner(
                    signer,
                    ACCOUNT_ID,
                    message,
                    privateKey.sign(message),
                ),
            ).to.be.true;
        });

        it("should resolve to false for a mismatching signature", async function () {
            mockExecuteWithSigner(accountInfo(key));

            expect(
                await AccountInfoFlow.verifySignatureWithSigner(
                    {},
                    ACCOUNT_ID,
                    message,
                    PrivateKey.generateED25519().sign(message),
                ),
            ).to.be.false;
        });

        it("should resolve to false when the account key is a key list", async function () {
            mockExecuteWithSigner(
                accountInfo(new KeyList([PrivateKey.generateED25519()])),
            );

            expect(
                await AccountInfoFlow.verifySignatureWithSigner(
                    {},
                    ACCOUNT_ID,
                    message,
                    privateKey.sign(message),
                ),
            ).to.be.false;
        });

        it("should execute the query with the signer", async function () {
            const executeWithSigner = mockExecuteWithSigner(accountInfo(key));
            const signer = { call: vi.fn() };

            await AccountInfoFlow.verifySignatureWithSigner(
                signer,
                ACCOUNT_ID,
                message,
                privateKey.sign(message),
            );

            expect(executeWithSigner).toHaveBeenCalledTimes(1);
            expect(executeWithSigner.mock.calls[0][0]).to.equal(signer);
        });
    });

    describe("verifyTransactionWithSigner", function () {
        it("should resolve to true when signed with the account key", async function () {
            mockExecuteWithSigner(accountInfo(key));

            expect(
                await AccountInfoFlow.verifyTransactionWithSigner(
                    {},
                    ACCOUNT_ID,
                    await signedTransaction(privateKey),
                ),
            ).to.be.true;
        });

        it("should resolve to false when signed with another key", async function () {
            mockExecuteWithSigner(accountInfo(key));

            expect(
                await AccountInfoFlow.verifyTransactionWithSigner(
                    {},
                    ACCOUNT_ID,
                    await signedTransaction(PrivateKey.generateED25519()),
                ),
            ).to.be.false;
        });

        it("should resolve to false when the account key is a key list", async function () {
            mockExecuteWithSigner(
                accountInfo(new KeyList([PrivateKey.generateED25519()])),
            );

            expect(
                await AccountInfoFlow.verifyTransactionWithSigner(
                    {},
                    ACCOUNT_ID,
                    await signedTransaction(privateKey),
                ),
            ).to.be.false;
        });
    });
});
