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
} from "@mui/material";
import { useState, createContext, useContext, useEffect } from "react";
import {
    WebClient,
    AccountId,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    LedgerId,
} from "@hiero-ledger/sdk";

// Client Context
const ClientContext = createContext();

const useClient = () => {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error("useClient must be used within ClientProvider");
    }
    return context;
};

// Client Provider Component
const ClientProvider = ({ children }) => {
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [networkState, setNetworkState] = useState({});

    const createAsyncClient = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Initialize client with latest network state
            const newClient = await WebClient.forTestnetAsync();

            // Set operator for the client
            newClient.setOperator(
                AccountId.fromString(process.env.NEXT_PUBLIC_OPERATOR_ID),
                PrivateKey.fromStringECDSA(
                    process.env.NEXT_PUBLIC_OPERATOR_KEY,
                ),
            );

            setClient(newClient);
            setNetworkState(newClient.network);
        } catch (err) {
            setError(err.message);
            console.error("Failed to initialize client:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateNetworkState = (newNetworkState) => {
        setNetworkState(newNetworkState);
    };

    const value = {
        client,
        isLoading,
        error,
        networkState,
        createAsyncClient,
        updateNetworkState,
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
};

// Loading Component
const LoadingScreen = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center space-y-6">
                <Box className="text-center">
                    <CircularProgress
                        size={60}
                        thickness={4}
                        sx={{ color: "#fb8500", mb: 2 }}
                    />
                    <Typography
                        variant="h5"
                        className="font-semibold text-gray-800"
                    >
                        Initializing Hedera Client
                    </Typography>
                    <Typography variant="body1" className="text-gray-600 mt-2">
                        Loading latest network state from address book...
                    </Typography>
                </Box>
            </div>
        </div>
    );
};

// Error Component
const ErrorScreen = ({ error }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
            <div className="text-center">
                <Typography variant="h5" className="mb-4 text-red-800">
                    Failed to Initialize Client
                </Typography>
                <Typography variant="body1" className="text-red-600">
                    {error}
                </Typography>
            </div>
        </div>
    );
};

// Main Demo Component
const AsyncClientDemo = () => {
    const {
        client,
        networkState,
        isLoading,
        error,
        createAsyncClient,
        updateNetworkState,
    } = useClient();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("info");
    const [createdAccount, setCreatedAccount] = useState(null);

    const showMessage = (text, type = "info") => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(""), 5000);
    };

    const updateNetwork = async () => {
        if (!client) return;

        setIsActionLoading(true);
        try {
            await client.updateNetwork();
            // Update the network state with the new network from the client
            updateNetworkState({ ...client.network });
            showMessage("Network updated successfully", "success");
        } catch (error) {
            showMessage(`Error updating network: ${error.message}`, "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const createAccount = async () => {
        if (!client) {
            showMessage("Please create a client first", "error");
            return;
        }

        setIsActionLoading(true);
        try {
            const privateKey = PrivateKey.generateECDSA();
            const publicKey = privateKey.publicKey;

            const transaction = await new AccountCreateTransaction()
                .setKeyWithoutAlias(publicKey)
                .setReceiverSignatureRequired(false)
                .setInitialBalance(new Hbar(1000))
                .freezeWith(client)
                .execute(client);

            const receipt = await transaction.getReceipt(client);
            const newAccountId = receipt.accountId;

            showMessage(
                `Account created successfully: ${newAccountId}`,
                "success",
            );

            return {
                accountId: newAccountId.toString(),
                privateKey: privateKey.toString(),
                publicKey: publicKey.toString(),
            };
        } catch (error) {
            showMessage(`Error creating account: ${error.message}`, "error");
            return null;
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        const account = await createAccount();
        if (account) {
            setCreatedAccount(account);
        }
    };

    const getLedgerIdName = () => {
        if (!client) return "None";
        switch (client.ledgerId) {
            case LedgerId.MAINNET:
                return "Mainnet";
            case LedgerId.TESTNET:
                return "Testnet";
            case LedgerId.PREVIEWNET:
                return "Previewnet";
            case LedgerId.LOCAL_NODE:
                return "Local Node";
            default:
                return "Unknown";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Typography
                        variant="h3"
                        className="font-bold text-gray-800 mb-2"
                    >
                        Async Client Demo - Testnet
                    </Typography>
                    <Typography variant="subtitle1" className="text-gray-600">
                        Demonstrating the async client with latest network state
                        and dynamic updates
                    </Typography>
                </div>

                {/* Message Alert */}
                {message && (
                    <Alert severity={messageType} className="mb-4">
                        {message}
                    </Alert>
                )}

                {/* Client Creation */}
                <Card className="shadow-lg">
                    <CardContent>
                        <Typography
                            variant="h5"
                            className="font-semibold mb-4 text-gray-800"
                        >
                            Create Async Testnet Client
                        </Typography>

                        <div className="flex justify-center">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={createAsyncClient}
                                disabled={isLoading}
                                className="h-12 px-8"
                                startIcon={
                                    isLoading ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        <span className="text-lg">🚀</span>
                                    )
                                }
                            >
                                Create Async Testnet Client
                            </Button>
                        </div>

                        {client && (
                            <Box className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Typography
                                    variant="subtitle2"
                                    className="text-blue-800 font-semibold mb-2"
                                >
                                    Client Status
                                </Typography>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Typography
                                            variant="caption"
                                            className="text-gray-600"
                                        >
                                            Network Type
                                        </Typography>
                                        <Typography className="font-semibold">
                                            Testnet
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography
                                            variant="caption"
                                            className="text-gray-600"
                                        >
                                            Ledger ID
                                        </Typography>
                                        <Typography className="font-semibold">
                                            {getLedgerIdName()}
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography
                                            variant="caption"
                                            className="text-gray-600"
                                        >
                                            Node Count
                                        </Typography>
                                        <Typography className="font-semibold">
                                            {Object.keys(networkState).length}
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography
                                            variant="caption"
                                            className="text-gray-600"
                                        >
                                            Status
                                        </Typography>
                                        <Typography className="font-semibold text-green-600">
                                            ✅ Connected with latest network
                                            state
                                        </Typography>
                                    </div>
                                </div>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Network State */}
                {client && (
                    <Card className="shadow-lg">
                        <CardContent>
                            <Typography
                                variant="h5"
                                className="font-semibold mb-4 text-gray-800"
                            >
                                Network State (Latest from Address Book)
                            </Typography>

                            {Object.keys(networkState).length > 0 ? (
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
                                            {Object.entries(networkState).map(
                                                (
                                                    [address, accountId],
                                                    index,
                                                ) => (
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
                )}

                {/* Action Buttons */}
                {client && (
                    <Card className="shadow-lg">
                        <CardContent>
                            <Typography
                                variant="h5"
                                className="font-semibold mb-4 text-gray-800"
                            >
                                Client Actions
                            </Typography>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={updateNetwork}
                                    disabled={isActionLoading}
                                    className="h-12"
                                    startIcon={
                                        isActionLoading ? (
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
                                    onClick={handleCreateAccount}
                                    disabled={isActionLoading}
                                    className="h-12"
                                    startIcon={
                                        isActionLoading ? (
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
                )}

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
                {client && (
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
                                        Current Network State
                                    </Typography>
                                    <Typography className="font-mono text-sm bg-gray-50 p-3 rounded border">
                                        {JSON.stringify(networkState, null, 2)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        className="text-gray-600 mb-2"
                                    >
                                        Client Configuration
                                    </Typography>
                                    <Typography className="font-mono text-sm bg-gray-50 p-3 rounded border">
                                        {JSON.stringify(
                                            {
                                                networkType: "testnet",
                                                ledgerId: getLedgerIdName(),
                                                nodeCount:
                                                    Object.keys(networkState)
                                                        .length,
                                                asyncMethod:
                                                    "forTestnetAsync()",
                                            },
                                            null,
                                            2,
                                        )}
                                    </Typography>
                                </Box>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

// Main Page Component
const AsyncClientPage = () => {
    return (
        <ClientProvider>
            <AsyncClientDemo />
        </ClientProvider>
    );
};

export default AsyncClientPage;
