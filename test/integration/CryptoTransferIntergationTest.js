import Long from "long";
import AccountCreateTransaction from "../../src/account/AccountCreateTransaction.js";
import PrivateKey from "../../src/PrivateKey.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import HookExtensionPoint from "../../src/hooks/HookExtensionPoint.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import EvmHookCall from "../../src/hooks/EvmHookCall.js";
import { decode } from "../../src/encoding/hex.js";
import ContractCreateTransaction from "../../src/contract/ContractCreateTransaction.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";
import TokenCreateTransaction from "../../src/token/TokenCreateTransaction.js";
import TokenMintTransaction from "../../src/token/TokenMintTransaction.js";
import TokenAssociateTransaction from "../../src/token/TokenAssociateTransaction.js";
import TokenType from "../../src/token/TokenType.js";
import NftId from "../../src/token/NftId.js";
import FungibleHookType from "../../src/hooks/FungibleHookType.js";
import NftHookType from "../../src/hooks/NftHookType.js";
import FungibleHookCall from "../../src/hooks/FungibleHookCall.js";
import NftHookCall from "../../src/hooks/NftHookCall.js";
import TransferTransaction from "../../src/account/TransferTransaction.js";
import Hbar from "../../src/Hbar.js";
import Status from "../../src/Status.js";

describe("CryptoTransfer", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;

        const { accountId, newKey } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        await (
            await new TransferTransaction()
                .addHbarTransfer(accountId, new Hbar(1))
                .addHbarTransfer(operatorId, new Hbar(-1))
                .execute(env.client)
        ).getReceipt(env.client);

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId);
        });
    });

    it("should error when there is invalid account amounts", async function () {
        const operatorId = env.operatorId;

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction.setInitialBalance(new Hbar(0));
        });

        expect(accountId).to.not.be.null;

        let err = false;

        try {
            await (
                await new TransferTransaction()
                    .addHbarTransfer(accountId, new Hbar(1))
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountAmounts);
        }

        if (!err) {
            throw new Error("Crypto transfer did not error.");
        }
    });

    describe("allowance hooks", function () {
        let hookContractId;

        beforeAll(async function () {
            // contract bytecode for the hiero hook contract
            // contract is located in test/integration/utils/HieroHookContract.sol
            const bytecode = decode(
                "6080604052348015600e575f5ffd5b506107d18061001c5f395ff3fe608060405260043610610033575f3560e01c8063124d8b301461003757806394112e2f14610067578063bd0dd0b614610097575b5f5ffd5b610051600480360381019061004c91906106f2565b6100c7565b60405161005e9190610782565b60405180910390f35b610081600480360381019061007c91906106f2565b6100d2565b60405161008e9190610782565b60405180910390f35b6100b160048036038101906100ac91906106f2565b6100dd565b6040516100be9190610782565b60405180910390f35b5f6001905092915050565b5f6001905092915050565b5f6001905092915050565b5f604051905090565b5f5ffd5b5f5ffd5b5f5ffd5b5f60a08284031215610112576101116100f9565b5b81905092915050565b5f5ffd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6101658261011f565b810181811067ffffffffffffffff821117156101845761018361012f565b5b80604052505050565b5f6101966100e8565b90506101a2828261015c565b919050565b5f5ffd5b5f5ffd5b5f67ffffffffffffffff8211156101c9576101c861012f565b5b602082029050602081019050919050565b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610207826101de565b9050919050565b610217816101fd565b8114610221575f5ffd5b50565b5f813590506102328161020e565b92915050565b5f8160070b9050919050565b61024d81610238565b8114610257575f5ffd5b50565b5f8135905061026881610244565b92915050565b5f604082840312156102835761028261011b565b5b61028d604061018d565b90505f61029c84828501610224565b5f8301525060206102af8482850161025a565b60208301525092915050565b5f6102cd6102c8846101af565b61018d565b905080838252602082019050604084028301858111156102f0576102ef6101da565b5b835b818110156103195780610305888261026e565b8452602084019350506040810190506102f2565b5050509392505050565b5f82601f830112610337576103366101ab565b5b81356103478482602086016102bb565b91505092915050565b5f67ffffffffffffffff82111561036a5761036961012f565b5b602082029050602081019050919050565b5f67ffffffffffffffff8211156103955761039461012f565b5b602082029050602081019050919050565b5f606082840312156103bb576103ba61011b565b5b6103c5606061018d565b90505f6103d484828501610224565b5f8301525060206103e784828501610224565b60208301525060406103fb8482850161025a565b60408301525092915050565b5f6104196104148461037b565b61018d565b9050808382526020820190506060840283018581111561043c5761043b6101da565b5b835b81811015610465578061045188826103a6565b84526020840193505060608101905061043e565b5050509392505050565b5f82601f830112610483576104826101ab565b5b8135610493848260208601610407565b91505092915050565b5f606082840312156104b1576104b061011b565b5b6104bb606061018d565b90505f6104ca84828501610224565b5f83015250602082013567ffffffffffffffff8111156104ed576104ec6101a7565b5b6104f984828501610323565b602083015250604082013567ffffffffffffffff81111561051d5761051c6101a7565b5b6105298482850161046f565b60408301525092915050565b5f61054761054284610350565b61018d565b9050808382526020820190506020840283018581111561056a576105696101da565b5b835b818110156105b157803567ffffffffffffffff81111561058f5761058e6101ab565b5b80860161059c898261049c565b8552602085019450505060208101905061056c565b5050509392505050565b5f82601f8301126105cf576105ce6101ab565b5b81356105df848260208601610535565b91505092915050565b5f604082840312156105fd576105fc61011b565b5b610607604061018d565b90505f82013567ffffffffffffffff811115610626576106256101a7565b5b61063284828501610323565b5f83015250602082013567ffffffffffffffff811115610655576106546101a7565b5b610661848285016105bb565b60208301525092915050565b5f604082840312156106825761068161011b565b5b61068c604061018d565b90505f82013567ffffffffffffffff8111156106ab576106aa6101a7565b5b6106b7848285016105e8565b5f83015250602082013567ffffffffffffffff8111156106da576106d96101a7565b5b6106e6848285016105e8565b60208301525092915050565b5f5f60408385031215610708576107076100f1565b5b5f83013567ffffffffffffffff811115610725576107246100f5565b5b610731858286016100fd565b925050602083013567ffffffffffffffff811115610752576107516100f5565b5b61075e8582860161066d565b9150509250929050565b5f8115159050919050565b61077c81610768565b82525050565b5f6020820190506107955f830184610773565b9291505056fea26469706673582212207dfe7723f6d6869419b1cb0619758b439da0cf4ffd9520997c40a3946299d4dc64736f6c634300081e0033",
            );
            const receipt = await (
                await new ContractCreateTransaction()
                    .setBytecode(bytecode)
                    .setGas(1_000_000)
                    .execute(env.client)
            ).getReceipt(env.client);
            hookContractId = receipt.contractId;
        });

        it("should transfer HBAR to account with pre-transaction allowance hook", async function () {
            const operatorId = env.operatorId;

            // Create account with a pre allowance hook on receiving side
            const key = PrivateKey.generateED25519();
            const evmHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: evmHook,
            });

            const createResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(hookDetails)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);
            const { accountId } = await createResp.getReceipt(env.client);

            const call = new FungibleHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            // Operator sends TO the account with hook (receiver hook)
            const response = await (
                await new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(-1))
                    .addHbarTransferWithHook(accountId, new Hbar(1), call)
                    .setMaxTransactionFee(new Hbar(500))
                    .execute(env.client)
            ).getReceipt(env.client);

            expect(response.status.toString()).to.be.equal("SUCCESS");
        });

        it("should execute hooks on multiple accounts in same transfer", async function () {
            const operatorId = env.operatorId;

            // Create two accounts, each with their own hook
            const key1 = PrivateKey.generateED25519();
            const evmHook1 = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const hookDetails1 = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: evmHook1,
            });

            const createResp1 = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key1.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(hookDetails1)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client);
            const { accountId: accountId1 } = await createResp1.getReceipt(
                env.client,
            );

            const key2 = PrivateKey.generateED25519();
            const evmHook2 = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const hookDetails2 = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: evmHook2,
            });

            const createResp2 = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key2.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(hookDetails2)
                    .freezeWith(env.client)
                    .sign(key2)
            ).execute(env.client);
            const { accountId: accountId2 } = await createResp2.getReceipt(
                env.client,
            );

            const call1 = new FungibleHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            const call2 = new FungibleHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            // Transfer to both accounts - both hooks must approve
            const response = await (
                await new TransferTransaction()
                    .addHbarTransfer(operatorId, new Hbar(-2))
                    .addHbarTransferWithHook(
                        accountId1,
                        new Hbar(1),
                        call1,
                        FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                    )
                    .addHbarTransferWithHook(
                        accountId2,
                        new Hbar(1),
                        call2,
                        FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                    )
                    .setMaxTransactionFee(new Hbar(500))
                    .execute(env.client)
            ).getReceipt(env.client);

            expect(response.status.toString()).to.be.equal("SUCCESS");
        });

        it("should execute both sender and receiver hooks in HBAR transfer", async function () {
            // Create sender account with hook
            const senderKey = PrivateKey.generateED25519();
            const senderHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const senderHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: senderHook,
            });

            const senderResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(senderKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(senderHookDetails)
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);
            const { accountId: senderId } = await senderResp.getReceipt(
                env.client,
            );

            // Create receiver account with hook
            const receiverKey = PrivateKey.generateED25519();
            const receiverHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const receiverHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: receiverHook,
            });

            const receiverResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(receiverKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(receiverHookDetails)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client);
            const { accountId: receiverId } = await receiverResp.getReceipt(
                env.client,
            );

            const senderCall = new FungibleHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            const receiverCall = new FungibleHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            // Transfer from sender to receiver, both with hooks
            const response = await (
                await new TransferTransaction()
                    .addHbarTransferWithHook(senderId, new Hbar(-1), senderCall)
                    .addHbarTransferWithHook(
                        receiverId,
                        new Hbar(1),
                        receiverCall,
                    )
                    .setMaxTransactionFee(new Hbar(500))
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });

        it("should transfer fungible tokens with allowance hook", async function () {
            const operatorId = env.operatorId;

            // Create receiver account with hook
            const receiverKey = PrivateKey.generateED25519();
            const evmHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const receiverResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(receiverKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(hookDetails)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client);
            const { accountId: receiverId } = await receiverResp.getReceipt(
                env.client,
            );

            const tokenResp = await (
                await new TokenCreateTransaction()
                    .setTokenName("FT-HOOK")
                    .setTokenSymbol("FTH")
                    .setDecimals(2)
                    .setInitialSupply(10000)
                    .setTreasuryAccountId(operatorId)
                    .setAdminKey(env.operatorKey)
                    .setSupplyKey(env.operatorKey)
                    .execute(env.client)
            ).getReceipt(env.client);
            const tokenId = tokenResp.tokenId;

            await (
                await new TokenAssociateTransaction()
                    .setAccountId(receiverId)
                    .setTokenIds([tokenId])
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client);

            const call = new FungibleHookCall({
                hookId: Long.fromInt(1),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            // Transfer tokens with hook
            const response = await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, operatorId, -1000)
                    .addTokenTransferWithHook(
                        tokenId,
                        receiverId,
                        1000,
                        call,
                        FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                    )
                    .setMaxTransactionFee(new Hbar(500))
                    .execute(env.client)
            ).getReceipt(env.client);

            expect(response.status.toString()).to.be.equal("SUCCESS");
        });

        it("should transfer NFT with sender and receiver allowance hooks", async function () {
            // Create sender account with hook
            const senderKey = PrivateKey.generateED25519();
            const senderHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const senderHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: senderHook,
            });

            const senderResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(senderKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(senderHookDetails)
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);
            const { accountId: senderId } = await senderResp.getReceipt(
                env.client,
            );

            // Create receiver account with hook
            const receiverKey = PrivateKey.generateED25519();
            const receiverHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });

            const receiverHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: receiverHook,
            });

            const receiverResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(receiverKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(receiverHookDetails)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client);
            const { accountId: receiverId } = await receiverResp.getReceipt(
                env.client,
            );

            const tokenResp = await (
                await new TokenCreateTransaction()
                    .setTokenName("NFT-HOOK")
                    .setTokenSymbol("NHK")
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setInitialSupply(0)
                    .setTreasuryAccountId(senderId)
                    .setAdminKey(senderKey.publicKey)
                    .setSupplyKey(senderKey.publicKey)
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);
            const tokenId = (await tokenResp.getReceipt(env.client)).tokenId;

            // Mint NFT
            await (
                await (
                    await new TokenMintTransaction()
                        .setTokenId(tokenId)
                        .setMetadata([new Uint8Array([1])])
                        .freezeWith(env.client)
                        .sign(senderKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Associate receiver with token
            await (
                await new TokenAssociateTransaction()
                    .setAccountId(receiverId)
                    .setTokenIds([tokenId])
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client);

            const senderCall = new NftHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: NftHookType.PRE_HOOK_SENDER,
            });

            const receiverCall = new NftHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: NftHookType.PRE_HOOK_RECEIVER,
            });

            const nftId = new NftId(tokenId, 1);

            // Transfer NFT with both sender and receiver hooks
            const response = await (
                await new TransferTransaction()
                    .addNftTransferWithHook(
                        nftId,
                        senderId,
                        receiverId,
                        senderCall,
                    )
                    .addNftTransferWithHook(
                        nftId,
                        senderId,
                        receiverId,
                        receiverCall,
                    )
                    .setMaxTransactionFee(new Hbar(500))
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });

        it("should transfer NFT with pre_post hooks on both sender and receiver", async function () {
            // Create sender account with hook
            const senderKey = PrivateKey.generateED25519();
            const senderHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const senderHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: senderHook,
            });

            const senderResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(senderKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(senderHookDetails)
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);
            const { accountId: senderId } = await senderResp.getReceipt(
                env.client,
            );

            // Create receiver account with hook
            const receiverKey = PrivateKey.generateED25519();
            const receiverHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const receiverHookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: receiverHook,
            });

            const receiverResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(receiverKey.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(receiverHookDetails)
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client);
            const { accountId: receiverId } = await receiverResp.getReceipt(
                env.client,
            );

            // Create NFT token with sender as treasury and mint one serial
            const tokenResp = await (
                await new TokenCreateTransaction()
                    .setTokenName("NFT-HOOK-PP")
                    .setTokenSymbol("NHPP")
                    .setTokenType(TokenType.NonFungibleUnique)
                    .setInitialSupply(0)
                    .setTreasuryAccountId(senderId)
                    .setAdminKey(senderKey.publicKey)
                    .setSupplyKey(senderKey.publicKey)
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);
            const tokenId = (await tokenResp.getReceipt(env.client)).tokenId;

            await (
                await (
                    await new TokenMintTransaction()
                        .setTokenId(tokenId)
                        .setMetadata([new Uint8Array([1])])
                        .freezeWith(env.client)
                        .sign(senderKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Associate receiver with token
            await (
                await new TokenAssociateTransaction()
                    .setAccountId(receiverId)
                    .setTokenIds([tokenId])
                    .freezeWith(env.client)
                    .sign(receiverKey)
            ).execute(env.client);

            const nftId = new NftId(tokenId, 1);

            // Build pre_post hooks for both sender and receiver
            const senderCall = new NftHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: NftHookType.PRE_POST_HOOK_SENDER,
            });

            const receiverCall = new NftHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                type: NftHookType.PRE_POST_HOOK_RECEIVER,
            });

            // Transfer NFT with both sender and receiver pre_post hooks in a single op
            const response = await (
                await new TransferTransaction()
                    .addNftTransferWithHook(
                        nftId,
                        senderId,
                        receiverId,
                        senderCall,
                        receiverCall,
                    )
                    .setMaxTransactionFee(new Hbar(500))
                    .freezeWith(env.client)
                    .sign(senderKey)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });

        it("should call pre-transaction allowance hook and approve transfer", async function () {
            const operatorId = env.operatorId;

            // Create account with a pre allowance hook (hookId = 1)
            const key = PrivateKey.generateED25519();
            const evmHook = new EvmHook({
                contractId: hookContractId,
                storageUpdates: [],
            });
            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
                evmHook: evmHook,
            });

            const createResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(hookDetails)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);
            const { accountId } = await createResp.getReceipt(env.client);

            const call = new FungibleHookCall({
                hookId: Long.fromInt(1),
                evmHookCall: new EvmHookCall({ gasLimit: 1000000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            const response = await (
                await new TransferTransaction()
                    .addHbarTransferWithHook(
                        accountId,
                        new Hbar(-1),
                        call,
                        FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                    )
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .setMaxTransactionFee(new Hbar(500))
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });

        it("should call pre and post allowance hooks around successful transfer", async function () {
            const operatorId = env.operatorId;

            // Create account with a pre/post allowance hook (hookId = 1)
            const key = PrivateKey.generateED25519();
            const evmHook = new EvmHook({
                contractId: hookContractId,
            });
            const hookDetails = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
                evmHook: evmHook,
            });

            const createResp = await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(key.publicKey)
                    .setInitialBalance(new Hbar(10))
                    .setMaxTransactionFee(new Hbar(100))
                    .addHook(hookDetails)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);
            const { accountId } = await createResp.getReceipt(env.client);

            const call = new FungibleHookCall({
                hookId: Long.fromInt(2),
                evmHookCall: new EvmHookCall({ gasLimit: 500000 }),
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            // Execute transfer with pre/post hook on sender
            const response = await (
                await new TransferTransaction()
                    .addHbarTransferWithHook(accountId, new Hbar(-1), call)
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .addHbarTransferWithHook(accountId, new Hbar(-1), call)
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .setMaxTransactionFee(new Hbar(500))
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client);

            const receipt = await response.getReceipt(env.client);
            expect(receipt.status.toString()).to.be.equal("SUCCESS");
        });

        describe("negative tests", function () {
            // this is the bytecode for the negative hook contract
            // located in test/integration/utils/HieroHookContractFalse.sol
            const negativeBytecode = decode(
                "6080604052348015600e575f5ffd5b506107ce8061001c5f395ff3fe608060405260043610610033575f3560e01c8063124d8b301461003757806394112e2f14610067578063bd0dd0b614610097575b5f5ffd5b610051600480360381019061004c91906106ef565b6100c7565b60405161005e919061077f565b60405180910390f35b610081600480360381019061007c91906106ef565b6100d1565b60405161008e919061077f565b60405180910390f35b6100b160048036038101906100ac91906106ef565b6100db565b6040516100be919061077f565b60405180910390f35b5f5f905092915050565b5f5f905092915050565b5f5f905092915050565b5f604051905090565b5f5ffd5b5f5ffd5b5f5ffd5b5f60a0828403121561010f5761010e6100f6565b5b81905092915050565b5f5ffd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6101628261011c565b810181811067ffffffffffffffff821117156101815761018061012c565b5b80604052505050565b5f6101936100e5565b905061019f8282610159565b919050565b5f5ffd5b5f5ffd5b5f67ffffffffffffffff8211156101c6576101c561012c565b5b602082029050602081019050919050565b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610204826101db565b9050919050565b610214816101fa565b811461021e575f5ffd5b50565b5f8135905061022f8161020b565b92915050565b5f8160070b9050919050565b61024a81610235565b8114610254575f5ffd5b50565b5f8135905061026581610241565b92915050565b5f604082840312156102805761027f610118565b5b61028a604061018a565b90505f61029984828501610221565b5f8301525060206102ac84828501610257565b60208301525092915050565b5f6102ca6102c5846101ac565b61018a565b905080838252602082019050604084028301858111156102ed576102ec6101d7565b5b835b818110156103165780610302888261026b565b8452602084019350506040810190506102ef565b5050509392505050565b5f82601f830112610334576103336101a8565b5b81356103448482602086016102b8565b91505092915050565b5f67ffffffffffffffff8211156103675761036661012c565b5b602082029050602081019050919050565b5f67ffffffffffffffff8211156103925761039161012c565b5b602082029050602081019050919050565b5f606082840312156103b8576103b7610118565b5b6103c2606061018a565b90505f6103d184828501610221565b5f8301525060206103e484828501610221565b60208301525060406103f884828501610257565b60408301525092915050565b5f61041661041184610378565b61018a565b90508083825260208201905060608402830185811115610439576104386101d7565b5b835b81811015610462578061044e88826103a3565b84526020840193505060608101905061043b565b5050509392505050565b5f82601f8301126104805761047f6101a8565b5b8135610490848260208601610404565b91505092915050565b5f606082840312156104ae576104ad610118565b5b6104b8606061018a565b90505f6104c784828501610221565b5f83015250602082013567ffffffffffffffff8111156104ea576104e96101a4565b5b6104f684828501610320565b602083015250604082013567ffffffffffffffff81111561051a576105196101a4565b5b6105268482850161046c565b60408301525092915050565b5f61054461053f8461034d565b61018a565b90508083825260208201905060208402830185811115610567576105666101d7565b5b835b818110156105ae57803567ffffffffffffffff81111561058c5761058b6101a8565b5b8086016105998982610499565b85526020850194505050602081019050610569565b5050509392505050565b5f82601f8301126105cc576105cb6101a8565b5b81356105dc848260208601610532565b91505092915050565b5f604082840312156105fa576105f9610118565b5b610604604061018a565b90505f82013567ffffffffffffffff811115610623576106226101a4565b5b61062f84828501610320565b5f83015250602082013567ffffffffffffffff811115610652576106516101a4565b5b61065e848285016105b8565b60208301525092915050565b5f6040828403121561067f5761067e610118565b5b610689604061018a565b90505f82013567ffffffffffffffff8111156106a8576106a76101a4565b5b6106b4848285016105e5565b5f83015250602082013567ffffffffffffffff8111156106d7576106d66101a4565b5b6106e3848285016105e5565b60208301525092915050565b5f5f60408385031215610705576107046100ee565b5b5f83013567ffffffffffffffff811115610722576107216100f2565b5b61072e858286016100fa565b925050602083013567ffffffffffffffff81111561074f5761074e6100f2565b5b61075b8582860161066a565b9150509250929050565b5f8115159050919050565b61077981610765565b82525050565b5f6020820190506107925f830184610770565b9291505056fea26469706673582212206ee6e21549dc017713ebcaf2cc8da2267cab2518f23f1b8818b87b97b4b8389064736f6c634300081e0033",
            );

            it("should fail when hook ID does not exist on account", async function () {
                const operatorId = env.operatorId;

                // Create account with hook ID = 1
                const key = PrivateKey.generateED25519();
                const evmHook = new EvmHook({
                    contractId: hookContractId,
                    storageUpdates: [],
                });
                const hookDetails = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId: 1,
                    evmHook: evmHook,
                });

                const createResp = await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(key.publicKey)
                        .setInitialBalance(new Hbar(10))
                        .setMaxTransactionFee(new Hbar(100))
                        .addHook(hookDetails)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client);
                const { accountId } = await createResp.getReceipt(env.client);

                // Try to call with non-existent hook ID = 99
                const call = new FungibleHookCall({
                    hookId: Long.fromInt(99),
                    evmHookCall: new EvmHookCall({ gasLimit: 25000 }),
                    type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                });

                let err;

                try {
                    await (
                        await (
                            await new TransferTransaction()
                                .addHbarTransferWithHook(
                                    accountId,
                                    new Hbar(-1),
                                    call,
                                )
                                .addHbarTransfer(operatorId, new Hbar(1))
                                .setMaxTransactionFee(new Hbar(500))
                                .freezeWith(env.client)
                                .sign(key)
                        ).execute(env.client)
                    ).getReceipt(env.client);
                } catch (error) {
                    err = error
                        .toString()
                        .includes(Status.RejectedByAccountAllowanceHook);
                }

                expect(err).to.equal(true);
            });

            it("should fail with insufficient gas for hook execution", async function () {
                const operatorId = env.operatorId;

                // Create account with hook
                const key = PrivateKey.generateED25519();
                const evmHook = new EvmHook({
                    contractId: hookContractId,
                    storageUpdates: [],
                });
                const hookDetails = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId: 1,
                    evmHook: evmHook,
                });

                const createResp = await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(key.publicKey)
                        .setInitialBalance(new Hbar(10))
                        .setMaxTransactionFee(new Hbar(100))
                        .addHook(hookDetails)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client);
                const { accountId } = await createResp.getReceipt(env.client);

                // Try to call with insufficient gas limit (too low)
                const call = new FungibleHookCall({
                    hookId: Long.fromInt(1),
                    evmHookCall: new EvmHookCall({ gasLimit: 0 }), // Very low gas
                    type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                });

                let err;

                try {
                    await (
                        await new TransferTransaction()
                            .addHbarTransferWithHook(
                                accountId,
                                new Hbar(1),
                                call,
                            )
                            .addHbarTransfer(operatorId, new Hbar(-1))
                            .setMaxTransactionFee(new Hbar(500))
                            .execute(env.client)
                    ).getReceipt(env.client);
                } catch (error) {
                    err = error.toString().includes(Status.InsufficientGas);
                }

                expect(err).equal(true);
            });

            it("should not transfer when hook returns false", async function () {
                const negativeHookContractId = await (
                    await new ContractCreateTransaction()
                        .setBytecode(negativeBytecode)
                        .setGas(1_000_000)
                        .execute(env.client)
                ).getReceipt(env.client);

                const negativeEvmHook = new EvmHook({
                    contractId: negativeHookContractId.contractId,
                    storageUpdates: [],
                });

                const negativeHookDetails = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId: 1,
                    evmHook: negativeEvmHook,
                });

                const key = PrivateKey.generateED25519();
                const createResp = await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(key.publicKey)
                        .setInitialBalance(new Hbar(10))
                        .setMaxTransactionFee(new Hbar(100))
                        .addHook(negativeHookDetails)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client);
                const { accountId } = await createResp.getReceipt(env.client);

                const call = new FungibleHookCall({
                    hookId: Long.fromInt(1),
                    evmHookCall: new EvmHookCall({ gasLimit: 100000 }),
                    type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                });

                let err;
                try {
                    await (
                        await new TransferTransaction()
                            .addHbarTransferWithHook(
                                accountId,
                                new Hbar(-1),
                                call,
                            )
                            .addHbarTransfer(env.operatorId, new Hbar(1))
                            .setMaxTransactionFee(new Hbar(500))
                            .execute(env.client)
                    ).getReceipt(env.client);
                } catch (error) {
                    err = error.status
                        .toString()
                        .includes(Status.RejectedByAccountAllowanceHook);
                }

                expect(err).to.equal(true);
            });
        });
    });

    afterAll(async function () {
        await env.close();
    });
});
