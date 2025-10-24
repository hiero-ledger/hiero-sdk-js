import {
    Client,
    PrivateKey,
    AccountId,
    AccountCreateTransaction,
    Cache,
} from "@hashgraph/sdk";
import axios from "axios";

import dotenv from "dotenv";

dotenv.config();

async function sync() {
    // http://time.google.com:80 doesn't actually give us an NTP response, instead it returns
    // a 302 redirected response. However, it does contain a `date` header which we can use.
    //
    // Note, to use `https://time.google.com/` within a browser context you must add
    // https://time.google.com to CORS
    const response = await axios.head("https://time.google.com", {
        maxRedirects: 0,

        // By default a status of 302 is considered an erring status
        validateStatus: function (status) {
            return status < 500;
        },
    });

    const currentTime = Math.round(Date.now() / 1000);

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
    // strongly discourages us using `Date.parse()`, but I'm not sure what we should replace
    // it with without adding any new deps.
    //
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const worldTime = Math.round(Date.parse(response.headers.date) / 1000);

    // Set the time drift value in the SDK Cache
    Cache.setTimeDrift(worldTime - currentTime);

    console.log(`Calculated time drift to be ${Cache.timeDrift}`);
}

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

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        AccountId.fromString(process.env.OPERATOR_ID),
        PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY),
    );

    await sync();

    const newKey = PrivateKey.generate();

    console.log(`private key = ${newKey.toString()}`);
    console.log(`public key = ${newKey.publicKey.toString()}`);

    const response = await new AccountCreateTransaction()
        .setInitialBalance(10) // 10 h
        .setKeyWithoutAlias(newKey.publicKey)
        .execute(client);

    const receipt = await response.getReceipt(client);

    console.log(`account id = ${receipt.accountId.toString()}`);

    client.close();
}

void main();
