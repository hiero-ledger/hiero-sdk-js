import {
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountId,
} from "../../src/index.js";

import dotenv from "dotenv";

dotenv.config();

describe("LocalWallet", function () {
    it("can fetch wallet's info", async function () {
        const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
        const operatorKey = PrivateKey.fromStringED25519(
            process.env.OPERATOR_KEY,
        );
        const wallet = new Wallet(operatorId, operatorKey, new LocalProvider());

        const info = await wallet.getAccountInfo();

        expect(info.accountId.compare(wallet.getAccountId())).to.be.equal(0);
    });
});
