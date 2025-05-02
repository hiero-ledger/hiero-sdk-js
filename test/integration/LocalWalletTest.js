import { Wallet, LocalProvider } from "../../src/index.js";

describe("LocalWallet", function () {
    it("can fetch wallet's info", async function () {
        const wallet = new Wallet(
            process.env.OPERATOR_ID,
            process.env.OPERATOR_KEY,
            new LocalProvider(),
        );

        const info = await wallet.getAccountInfo();

        expect(info.accountId.compare(wallet.getAccountId())).to.be.equal(0);
    });
});
