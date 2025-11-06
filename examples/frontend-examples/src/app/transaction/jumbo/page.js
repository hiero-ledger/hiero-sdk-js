"use client";

import { useState } from "react";
import {
    Typography,
    Box,
    Alert,
    Button,
    TextField,
    Card,
    CardContent,
    CircularProgress,
    Chip,
} from "@mui/material";
import {
    EthereumTransaction,
    ContractFunctionParameters,
    PrivateKey,
    TransferTransaction,
    Hbar,
    AccountId,
    ContractId,
    Client,
    Status,
} from "@hashgraph/sdk";
import * as rlp from "@ethersproject/rlp";
import * as hex from "@/app/util/hex.js";

const JumboPage = () => {
    console.log(process.env.NEXT_PUBLIC_OPERATOR_ID);
    console.log(process.env.NEXT_PUBLIC_OPERATOR_KEY);
    const operatorId = AccountId.fromString(
        process.env.NEXT_PUBLIC_OPERATOR_ID,
    );
    const operatorKey = PrivateKey.fromStringECDSA(
        process.env.NEXT_PUBLIC_OPERATOR_KEY,
    );
    const [contractId, setContractId] = useState("0.0.6255191");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const executeJumboTransaction = async () => {
        if (!operatorId || !operatorKey || !contractId) {
            setError("Please fill in all required fields");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        // Create client
        const client = Client.forTestnet().setOperator(operatorId, operatorKey);

        // Get contract address
        const contract = ContractId.fromString(contractId);
        const contractAddress = contract.toSolidityAddress();

        // Generate ECDSA private key for the transaction
        const privateKey = PrivateKey.generateECDSA();
        const accountAlias = privateKey.publicKey.toEvmAddress();

        // Transfer HBAR to the alias account for gas fees
        const transfer = await new TransferTransaction()
            .addHbarTransfer(operatorId, Hbar.fromString("10").negated())
            .addHbarTransfer(accountAlias, Hbar.fromString("10"))
            .setMaxTransactionFee(new Hbar(1))
            .execute(client);

        const transferReceipt = await transfer.getReceipt(client);

        if (transferReceipt.status !== Status.Success) {
            throw new Error("Transfer failed", transferReceipt.status);
        }

        // Prepare Ethereum transaction parameters
        const type = "02"; // EIP-1559 transaction type
        const chainId = hex.decode("0128"); // Testnet chain ID
        const nonce = new Uint8Array();
        const maxPriorityGas = hex.decode("00");
        const maxGas = hex.decode("d1385c7bf0");

        const gasLimit = hex.decode(new Number(150000).toString(16));

        const value = new Uint8Array();
        const to = hex.decode(contractAddress);

        // Create maximum size calldata (as per integration test)
        const JUMBO_TRANSACTION_CALL_DATA = 1024 * 10;
        const largeData = new Uint8Array(JUMBO_TRANSACTION_CALL_DATA).fill(1);
        const callData = new ContractFunctionParameters()
            .addBytes(largeData)
            ._build("test");

        const accessList = [];

        // Encode transaction data
        const encoded = rlp
            .encode([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
            ])
            .substring(2);

        // Sign the transaction
        const message = hex.decode(type + encoded);
        const signedBytes = privateKey.sign(message);
        const middleOfSignedBytes = signedBytes.length / 2;
        const r = signedBytes.slice(0, middleOfSignedBytes);
        const s = signedBytes.slice(middleOfSignedBytes, signedBytes.length);
        const recoveryId = privateKey.getRecoveryId(r, s, message);

        // Handle recovery ID for canonical Ethereum signatures
        const v = new Uint8Array(recoveryId === 0 ? [] : [recoveryId]);

        // Create final signed transaction
        const data = rlp
            .encode([
                chainId,
                nonce,
                maxPriorityGas,
                maxGas,
                gasLimit,
                to,
                value,
                callData,
                accessList,
                v,
                r,
                s,
            ])
            .substring(2);

        const ethereumData = hex.decode(type + data);

        // Execute the Ethereum transaction
        const response = await new EthereumTransaction()
            .setEthereumData(ethereumData)
            .execute(client);

        const record = await response.getRecord(client);
        const receipt = await response.getReceipt(client);

        setResult({
            transactionId: response.transactionId.toString(),
            status: receipt.status,
            signerNonce: record.contractFunctionResult?.signerNonce?.toNumber(),
            gasUsed: record.contractFunctionResult?.gasUsed?.toString(),
            calldataSize: JUMBO_TRANSACTION_CALL_DATA,
        });
        setIsLoading(false);
        setError(null);
    };

    return (
        <div className="container mx-auto max-w-6xl">
            <Typography variant="h3" component="h1">
                Jumbo Ethereum Transaction
            </Typography>

            <Typography variant="h8" color="white">
                Execute an Ethereum transaction with maximum size calldata to
                call the `test` function on your smart contract.
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Configuration
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <TextField
                            label="Contract ID"
                            value={contractId}
                            onChange={(e) => setContractId(e.target.value)}
                            placeholder="0.0.6255191"
                            fullWidth
                        />
                    </Box>
                </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Execute Transaction
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                    >
                        This will execute a jumbo Ethereum transaction with{" "}
                        {1024 * 10} bytes of calldata.
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={executeJumboTransaction}
                        disabled={
                            isLoading ||
                            !operatorId ||
                            !operatorKey ||
                            !contractId
                        }
                        size="large"
                    >
                        {isLoading ? (
                            <CircularProgress size={20} />
                        ) : (
                            "Execute Jumbo Transaction"
                        )}
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {result && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Transaction Result
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    Transaction ID:
                                </Typography>
                                <Typography
                                    variant="body2"
                                    fontFamily="monospace"
                                >
                                    {result.transactionId}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    Status:
                                </Typography>
                                <Chip
                                    label={result.status.toString()}
                                    color={
                                        result.status === Status.Success
                                            ? "success"
                                            : "error"
                                    }
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    Signer Nonce:
                                </Typography>
                                <Typography variant="body2">
                                    {result.signerNonce}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    Gas Used:
                                </Typography>
                                <Typography variant="body2">
                                    {result.gasUsed}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    Calldata Size:
                                </Typography>
                                <Typography variant="body2">
                                    {result.calldataSize} bytes
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default JumboPage;
