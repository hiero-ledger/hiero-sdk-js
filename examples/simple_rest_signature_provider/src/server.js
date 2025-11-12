import express from "express";
import readline from "readline";
import { Wallet, LocalProvider, Transaction, Query } from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

if (process.env.OPERATOR_KEY == null || process.env.OPERATOR_ID == null) {
    throw new Error("`OPERATOR_KEY` and `OPERATOR_ID` required");
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const app = express();
app.use(express.json());

const provider = new LocalProvider();

const wallet = new Wallet(
    process.env.OPERATOR_ID,
    process.env.OPERATOR_KEY,
    provider,
);

const ledgerId = provider.getLedgerId();
const network = provider.getNetwork();
Object.entries(network).map(([key, value]) => {
    network[key] = value.toString();
});
const mirrorNetwork = provider.getMirrorNetwork();

app.post("/login", function (req, res) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = /** @type {{ accountId: string | undefined }} */ (req.body);
    if (
        request.accountId != null &&
        request.accountId != wallet.accountId.toString()
    ) {
        res.json({ error: "invalid account ID" });
        return;
    }

    const accountId =
        request.accountId == null ? wallet.accountId : request.accountId;

    rl.question(`Login as ${accountId.toString()}?\n`, (name) => {
        switch (name) {
            case "y":
            case "yes":
                res.json({
                    accountId: wallet.accountId.toString(),
                    publicKey: wallet.publicKey.toString(),
                    ledgerId: ledgerId != null ? ledgerId.toString() : null,
                    network,
                    mirrorNetwork,
                });
                break;
            default:
                res.json({ error: "request denied" });
        }
    });
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.post("/request", async function (req, res) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = /** @type {{ request: string | undefined }} */ (req.body);
    if (request.request == null || request.request === "") {
        res.json({ error: "no request provided" });
        return;
    }

    const bytes = Buffer.from(request.request, "hex");

    try {
        const transaction = Transaction.fromBytes(bytes);
        await transaction.signWithSigner(wallet);
        const response = await wallet.call(transaction);
        res.json(response);
        return;
    } catch (_) {
        try {
            const query = Query.fromBytes(bytes);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const response = await wallet.call(query);
            res.json({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
                response: Buffer.from(response.toBytes()).toString("hex"),
            });
            return;
        } catch (error) {
            res.json({ error: /** @type {Error} */ (error).toString() });
            return;
        }
    }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.post("/sign", async function (req, res) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = /** @type {{ request: string | undefined }} */ (req.body);
    if (request.request == null || request.request === "") {
        res.json({ error: "no request provided" });
        return;
    }

    const bytes = Buffer.from(request.request, "hex");

    try {
        const transaction = Transaction.fromBytes(bytes);
        await transaction.signWithSigner(wallet);
        res.json({
            response: Buffer.from(transaction.toBytes()).toString("hex"),
        });
        return;
    } catch (error) {
        res.json({ error: /** @type {Error} */ (error).toString() });
        return;
    }
});

app.listen(3000);
