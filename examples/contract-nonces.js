import {
    Wallet,
    LocalProvider,
    ContractCreateTransaction,
    FileCreateTransaction,
    PrivateKey,
    Hbar,
} from "@hashgraph/sdk";

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

    const provider = new LocalProvider();

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        provider,
    );

    // The contract bytecode is located on the `object` field
    const SMART_CONTRACT_BYTECODE =
        "6080604052348015600f57600080fd5b50604051601a90603b565b604051809103906000f0801580156035573d6000803e3d6000fd5b50506047565b605c8061009483390190565b603f806100556000396000f3fe6080604052600080fdfea2646970667358221220a20122cbad3457fedcc0600363d6e895f17048f5caa4afdab9e655123737567d64736f6c634300081200336080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea264697066735822122053dfd8835e3dc6fedfb8b4806460b9b7163f8a7248bac510c6d6808d9da9d6d364736f6c63430008120033";

    try {
        const fileCreateTxResponse = await (
            await new FileCreateTransaction()
                .setKeys([PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY)])
                .setContents(SMART_CONTRACT_BYTECODE)
                .setMaxTransactionFee(new Hbar(2))
                .freezeWithSigner(wallet)
        ).executeWithSigner(wallet);

        const fileCreateTxReceipt =
            await fileCreateTxResponse.getReceiptWithSigner(wallet);
        const newFileId = fileCreateTxReceipt.fileId;

        const contractCreateTxResponse = await (
            await new ContractCreateTransaction()
                .setAdminKey(
                    PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY),
                )
                .setGas(100000)
                .setBytecodeFileId(newFileId)
                .setContractMemo(
                    "[e2e::ContractADeploysContractBInConstructor]",
                )
                .freezeWithSigner(wallet)
        ).executeWithSigner(wallet);

        const record =
            await contractCreateTxResponse.getRecordWithSigner(wallet);

        console.log(
            `contractNonces: ${JSON.stringify(
                record.contractFunctionResult.contractNonces,
            )}`,
        );
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
