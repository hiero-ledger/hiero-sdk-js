"use client";

import {
    Button,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    Alert,
    CircularProgress,
    Divider,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import {
    WebClient,
    AccountId,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
} from "@hashgraph/sdk";

const initialNetwork = {
    "127.0.0.1:8081": new AccountId(0, 0, 4),
};

const Home = () => {
    const [clientNetwork, setClientNetwork] = useState(initialNetwork);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("info");
    const [createdAccount, setCreatedAccount] = useState(null);

    const client = useMemo(() => {
        return WebClient.forNetwork(initialNetwork).setOperator(
            AccountId.fromString(process.env.NEXT_PUBLIC_OPERATOR_ID),
            PrivateKey.fromStringDer(process.env.NEXT_PUBLIC_OPERATOR_KEY),
        );
    }, []);

    const showMessage = (text, type = "info") => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(""), 5000);
    };

    const setMirrorNetworkToClient = () => {
        try {
            client.setMirrorNetwork(["127.0.0.1:5551"]);
            showMessage("Mirror network set to localhost:5551", "success");
        } catch (error) {
            showMessage(
                `Error setting mirror network: ${error.message}`,
                "error",
            );
        }
    };

    const updateNetwork = async () => {
        setIsLoading(true);
        try {
            await client.updateNetwork();
            setClientNetwork({ ...client.network });
            showMessage("Network updated successfully", "success");
        } catch (error) {
            showMessage(`Error updating network: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const createAccount = async () => {
        setIsLoading(true);
        try {
            console.log(client.network);
            const privateKey = PrivateKey.generateED25519();
            const publicKey = privateKey.publicKey;

            const transaction = await new AccountCreateTransaction()
                .setKeyWithoutAlias(publicKey)
                .setReceiverSignatureRequired(false)
                .setInitialBalance(new Hbar(1000))
                .freezeWith(client)
                .execute(client);
            console.log("minaa");
            const receipt = await transaction.getReceipt(client);
            const newAccountId = receipt.accountId;

            setCreatedAccount({
                accountId: newAccountId.toString(),
                privateKey: privateKey.toString(),
                publicKey: publicKey.toString(),
            });

            showMessage(
                `Account created successfully: ${newAccountId}`,
                "success",
            );
        } catch (error) {
            showMessage(`Error creating account: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Typography
                        variant="h3"
                        className="font-bold text-gray-800 mb-2"
                    >
                        Hedera Network Client Demo
                    </Typography>
                    <Typography variant="subtitle1" className="text-gray-600">
                        Interactive demonstration of network management and
                        account creation
                    </Typography>
                </div>

                {/* Message Alert */}
                {message && (
                    <Alert severity={messageType} className="mb-4">
                        {message}
                    </Alert>
                )}

                {/* Client Network State */}
                <Card className="shadow-lg">
                    <CardContent>
                        <Typography
                            variant="h5"
                            className="font-semibold mb-4 text-gray-800"
                        >
                            Client Network State
                        </Typography>

                        {Object.keys(clientNetwork).length > 0 ? (
                            <TableContainer
                                component={Paper}
                                className="shadow-sm"
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow className="bg-gray-50">
                                            <TableCell className="font-semibold">
                                                Node Address
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                Node Account ID
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(clientNetwork).map(
                                            ([address, accountId], index) => (
                                                <TableRow
                                                    key={index}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <TableCell>
                                                        <Chip
                                                            label={address}
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography className="font-mono text-sm">
                                                            {accountId.toString()}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography className="text-gray-500 italic">
                                No network nodes available
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card className="shadow-lg">
                    <CardContent>
                        <Typography
                            variant="h5"
                            className="font-semibold mb-4 text-gray-800"
                        >
                            Network Actions
                        </Typography>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={setMirrorNetworkToClient}
                                disabled={isLoading}
                                className="h-12"
                                startIcon={<span className="text-lg">🔗</span>}
                            >
                                Set Mirror Network
                            </Button>

                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={updateNetwork}
                                disabled={isLoading}
                                className="h-12"
                                startIcon={
                                    isLoading ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        <span className="text-lg">🔄</span>
                                    )
                                }
                            >
                                Update Network
                            </Button>

                            <Button
                                variant="contained"
                                color="success"
                                onClick={createAccount}
                                disabled={isLoading}
                                className="h-12"
                                startIcon={
                                    isLoading ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        <span className="text-lg">👤</span>
                                    )
                                }
                            >
                                Create Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Created Account Information */}
                {createdAccount && (
                    <Card className="shadow-lg">
                        <CardContent>
                            <Typography
                                variant="h5"
                                className="font-semibold mb-4 text-gray-800"
                            >
                                Created Account Information
                            </Typography>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Box className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <Typography
                                            variant="subtitle2"
                                            className="text-green-800 font-semibold mb-2"
                                        >
                                            Account ID
                                        </Typography>
                                        <Typography className="font-mono text-sm bg-white p-2 rounded border">
                                            {createdAccount.accountId}
                                        </Typography>
                                    </Box>

                                    <Box className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <Typography
                                            variant="subtitle2"
                                            className="text-blue-800 font-semibold mb-2"
                                        >
                                            Public Key
                                        </Typography>
                                        <Typography className="font-mono text-xs bg-white p-2 rounded border break-all">
                                            {createdAccount.publicKey}
                                        </Typography>
                                    </Box>
                                </div>

                                <Box className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <Typography
                                        variant="subtitle2"
                                        className="text-orange-800 font-semibold mb-2"
                                    >
                                        Private Key (Keep Secure!)
                                    </Typography>
                                    <Typography className="font-mono text-xs bg-white p-2 rounded border break-all">
                                        {createdAccount.privateKey}
                                    </Typography>
                                </Box>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Network Information */}
                <Card className="shadow-lg">
                    <CardContent>
                        <Typography
                            variant="h5"
                            className="font-semibold mb-4 text-gray-800"
                        >
                            Network Details
                        </Typography>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    className="text-gray-600 mb-2"
                                >
                                    Initial Network
                                </Typography>
                                <Typography className="font-mono text-sm bg-gray-50 p-3 rounded border">
                                    {JSON.stringify(initialNetwork, null, 2)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    className="text-gray-600 mb-2"
                                >
                                    Current Network
                                </Typography>
                                <Typography className="font-mono text-sm bg-gray-50 p-3 rounded border">
                                    {JSON.stringify(clientNetwork, null, 2)}
                                </Typography>
                            </Box>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Home;
