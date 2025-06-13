import { Client, FileId, AddressBookQuery } from "@hashgraph/sdk";

import fs from "node:fs/promises";

import dotenv from "dotenv";

dotenv.config();

async function main() {
    if (process.env.HEDERA_NETWORK == null) {
        throw new Error("Environment variable HEDERA_NETWORK is required.");
    }

    const client = Client.forName(process.env.HEDERA_NETWORK);

    if (process.env.HEDERA_NETWORK.toLowerCase() === "mainnet") {
        client
            .setMirrorNetwork(["mainnet-public.mirrornode.hedera.com:443"])
            .setTransportSecurity(true);
    }

    const addressBook = await new AddressBookQuery()
        .setFileId(FileId.getAddressBookFileIdFor(0, 0))
        .execute(client);

    console.log(JSON.stringify(addressBook.toJSON(), null, 2));

    await fs.writeFile("address-book.proto.bin", addressBook.toBytes());

    client.close();
}

void main();
