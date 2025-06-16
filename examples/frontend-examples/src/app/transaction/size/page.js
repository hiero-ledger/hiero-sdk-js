"use client";

import { Button, TextField } from "@mui/material";
import { useState } from "react";
import {
    AccountCreateTransaction,
    WebClient,
    PrivateKey,
    Key,
    PublicKey,
    Hbar,
} from "@hashgraph/sdk";

const Home = () => {
    const [accountId, setAccountId] = useState("");
    const [initialBalance, setInitialBalance] = useState("");
    const [key, setKey] = useState("");
    const [transactionSize, setTransactionSize] = useState(0);

    const PRIVATE_KEY =
        "0xa608e2130a0a3cb34f86e757303c862bee353d9ab77ba4387ec084f881d420d4";
    const OPERATOR_ID = "0.0.10022";
    const client = WebClient.forTestnet().setOperator(
        OPERATOR_ID,
        PrivateKey.fromStringED25519(PRIVATE_KEY),
    );

    return (
        <div className="flex items-center justify-center">
            <form className="flex flex-col gap-4">
                <TextField
                    label="Account ID"
                    variant="outlined"
                    className="block w-full"
                    onChange={(e) => {
                        setAccountId(e.target.value);
                    }}
                />
                <TextField
                    label="Initial Balance"
                    variant="outlined"
                    className="block"
                    onChange={(e) => {
                        setInitialBalance(e.target.value);
                    }}
                />
                <TextField
                    label="Key"
                    variant="outlined"
                    color="primary"
                    className="block"
                    onChange={(e) => {
                        setKey(e.target.value);
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        const tx = new AccountCreateTransaction();
                        if (key) {
                            tx.setKeyWithoutAlias(
                                PublicKey.fromStringED25519(key),
                            );
                        }
                        if (initialBalance) {
                            tx.setInitialBalance(Hbar.from(initialBalance));
                        }
                        if (accountId) {
                            tx.setAccountId(accountId);
                        }
                        const txSize = tx.freezeWith(client).size;
                        setTransactionSize(txSize);
                    }}
                >
                    Get transaction size
                </Button>
                <p>Transaction size: {transactionSize}</p>
            </form>
        </div>
    );
};

export default Home;
