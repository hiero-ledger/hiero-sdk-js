"use client";
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
} from "@mui/material";
import { useState } from "react";

import TransactionBody from "../components/TransactionBody";

export default function Home() {
    const [selectedTransaction, setSelectedTransaction] =
        useState("fileAppend");

    const handleChange = (event: SelectChangeEvent) => {
        setSelectedTransaction(event.target.value as string);
    };

    return (
        <>
            Select one the two transaction supported by this demo:
            <FormControl>
                <InputLabel id="demo-simple-select-label">
                    Transaction
                </InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={selectedTransaction}
                    label="Transaction"
                    onChange={handleChange}
                    style={{ backgroundColor: "#f5f5f5" }}
                >
                    <MenuItem value="fileAppend">
                        FileAppendTransaction
                    </MenuItem>
                    <MenuItem value="accountCreate">
                        AccountCreateTransactio
                    </MenuItem>
                </Select>
            </FormControl>
            <TransactionBody transaction={selectedTransaction} />
        </>
    );
}
