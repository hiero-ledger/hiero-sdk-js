"use client";

import { Button, TextField } from "@mui/material";
import { useState } from "react";
import {
    AccountCreateTransaction,
    WebClient,
    PrivateKey,
    PublicKey,
    Hbar,
    AccountId,
} from "@hashgraph/sdk";

const Home = () => {
    const [initialBalance, setInitialBalance] = useState("");
    const [key, setKey] = useState("");
    const [transactionSize, setTransactionSize] = useState(0);

    const client = WebClient.forTestnet().setOperator(
        AccountId.fromString(process.env.NEXT_PUBLIC_OPERATOR_ID),
        PrivateKey.fromStringDer(process.env.NEXT_PUBLIC_OPERATOR_KEY),
    );

    return (
        <div className="flex items-center justify-center">
            <form className="flex flex-col gap-4">
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
