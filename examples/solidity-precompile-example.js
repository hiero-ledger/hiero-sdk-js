import * as hashgraph from "@hashgraph/sdk";
import ContractHelper from "./ContractHelper.js";
import contract from "./precompile-example/PrecompileExample.json" with { type: "json" };
import dotenv from "dotenv";

dotenv.config();

async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const provider = new hashgraph.LocalProvider();

    const wallet = new hashgraph.Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        provider,
    );

    const operatorPrivateKey = hashgraph.PrivateKey.fromStringED25519(
        process.env.OPERATOR_KEY,
    );
    const operatorPublicKey = operatorPrivateKey.publicKey;

    const operatorAccountId = hashgraph.AccountId.fromString(
        process.env.OPERATOR_ID,
    );

    const alicePrivateKey = hashgraph.PrivateKey.generateED25519();
    const alicePublicKey = alicePrivateKey.publicKey;

    try {
        let transaction = await new hashgraph.AccountCreateTransaction()
            .setKeyWithoutAlias(alicePublicKey)
            .setInitialBalance(hashgraph.Hbar.fromString("1000"))
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);

        let response = await transaction.executeWithSigner(wallet);
        const aliceAccountId = (await response.getReceiptWithSigner(wallet))
            .accountId;

        const walletWithAlice = new hashgraph.Wallet(
            aliceAccountId,
            alicePrivateKey,
            provider,
        );

        // Instantiate ContractHelper

        // The contract bytecode is located on the `object` field
        const contractBytecode = /** @type {string} */ (
            contract.bytecode.object
        );

        const contractHelper = await ContractHelper.init(
            contractBytecode,
            new hashgraph.ContractFunctionParameters()
                .addAddress(wallet.getAccountId().toSolidityAddress())
                .addAddress(aliceAccountId.toSolidityAddress()),
            wallet,
        );

        // Update the signer to have contractId KeyList (this is by security requirement)
        let accountUpdateOpratorTransaction =
            await new hashgraph.AccountUpdateTransaction()
                .setAccountId(operatorAccountId)
                .setKey(
                    new hashgraph.KeyList(
                        [operatorPublicKey, contractHelper.contractId],
                        1,
                    ),
                )
                .freezeWithSigner(wallet);
        accountUpdateOpratorTransaction =
            await accountUpdateOpratorTransaction.signWithSigner(wallet);
        await accountUpdateOpratorTransaction.executeWithSigner(wallet);

        // Update the Alice account to have contractId KeyList (this is by security requirement)
        let accountUpdateAliceTransaction =
            await new hashgraph.AccountUpdateTransaction()
                .setAccountId(aliceAccountId)
                .setKey(
                    new hashgraph.KeyList(
                        [alicePublicKey, contractHelper.contractId],
                        1,
                    ),
                )
                .freezeWithSigner(walletWithAlice);
        accountUpdateAliceTransaction =
            await accountUpdateAliceTransaction.signWithSigner(walletWithAlice);
        await accountUpdateAliceTransaction.executeWithSigner(walletWithAlice);

        /**
         *
         * @param {string} tokenAddress
         * @returns {Promise<void>}
         */
        let additionalLogic = async function (tokenAddress) {
            let accountUpdateOpratorTransaction =
                await new hashgraph.TokenUpdateTransaction()
                    .setTokenId(
                        hashgraph.TokenId.fromSolidityAddress(tokenAddress),
                    )
                    .setAdminKey(
                        new hashgraph.KeyList(
                            [alicePublicKey, contractHelper.contractId],
                            1,
                        ),
                    )
                    .setSupplyKey(
                        new hashgraph.KeyList(
                            [alicePublicKey, contractHelper.contractId],
                            1,
                        ),
                    )
                    .freezeWithSigner(walletWithAlice);
            accountUpdateOpratorTransaction =
                await accountUpdateOpratorTransaction.signWithSigner(
                    walletWithAlice,
                );
            let accountUpdateOpratorTransactionResponce =
                await accountUpdateOpratorTransaction.executeWithSigner(
                    walletWithAlice,
                );

            console.log(
                "Status of Token Update Transactio:",
                (
                    await accountUpdateOpratorTransactionResponce.getReceiptWithSigner(
                        walletWithAlice,
                    )
                ).status.toString(),
            );
        };

        // Configure steps in ContracHelper

        contractHelper
            .setResultValidatorForStep(0, (contractFunctionResult) => {
                const bytes = Buffer.from(contractFunctionResult.getBytes32(0));
                console.log(
                    `getPseudoRandomSeed() returned ${bytes.toString("hex")}`,
                );
                return true;
            })
            .setPayableAmountForStep(1, new hashgraph.Hbar(20))
            // step 3 associates Alice with the token, which requires Alice's signature
            .addSignerForStep(3, alicePrivateKey)
            .addSignerForStep(5, alicePrivateKey)
            .setParameterSupplierForStep(11, () => {
                return (
                    new hashgraph.ContractFunctionParameters()
                        // when contracts work with a public key, they handle the raw bytes of the public key
                        .addBytes(alicePublicKey.toBytesRaw())
                );
            })
            .setPayableAmountForStep(11, new hashgraph.Hbar(40))
            // Because we're setting the adminKey for the created NFT token to Alice's key,
            // Alice must sign the ContractExecuteTransaction.
            .addSignerForStep(11, alicePrivateKey)
            .setStepLogic(11, additionalLogic)
            // and Alice must sign for minting because her key is the supply key.
            .addSignerForStep(12, alicePrivateKey)
            .setParameterSupplierForStep(12, () => {
                return (
                    new hashgraph.ContractFunctionParameters()
                        // add three metadatas
                        .addBytesArray([
                            new Uint8Array([0x01b]),
                            new Uint8Array([0x02b]),
                            new Uint8Array([0x03b]),
                        ])
                );
            }) // and alice must sign to become associated with the token.
            .addSignerForStep(13, alicePrivateKey)
            // Alice must sign to burn the token because her key is the supply key
            .addSignerForStep(16, alicePrivateKey);

        // step 0 tests pseudo random number generator (PRNG)
        // step 1 creates a fungible token
        // step 2 mints it
        // step 3 associates Alice with it
        // step 4 transfers it to Alice.
        // step 5 approves an allowance of the fungible token with operator as the owner and Alice as the spender
        // steps 6 - 10 test misc functions on the fungible token (see PrecompileExample.sol for details).
        // step 11 creates an NFT token with a custom fee, and with the admin and supply set to Alice's key
        // step 12 mints some NFTs
        // step 13 associates Alice with the NFT token
        // step 14 transfers some NFTs to Alice
        // step 15 approves an NFT allowance with operator as the owner and Alice as the spender
        // step 16 burn some NFTs

        await contractHelper.executeSteps(
            /* from step */ 0,
            /* to step */ 16,
            wallet,
        );

        console.log("All steps completed with valid results.");
    } catch (error) {
        console.error(error);
    } finally {
        provider.close();
    }
}

void main();
