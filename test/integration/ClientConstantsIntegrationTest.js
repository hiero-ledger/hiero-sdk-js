import {
    MAINNET,
    WEB_TESTNET,
    WEB_PREVIEWNET,
} from "../../src/constants/ClientConstants.js";
import { AccountInfo, AccountInfoQuery, Hbar } from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("ClientConstantsIntegrationTest", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    describe("MAINNET node proxies", function () {
        const proxies = Object.keys(MAINNET);
        proxies.forEach((proxy) => {
            it(`should fetch ${MAINNET[proxy]} account info`, async function () {
                const accountInfo = await new AccountInfoQuery()
                    .setNodeAccountIds([MAINNET[proxy]])
                    .setAccountId(MAINNET[proxy])
                    .execute(env.client);

                expect(accountInfo instanceof AccountInfo).to.be.true;
                expect(accountInfo.balance instanceof Hbar).to.be.true;
            });
        });
    });

    describe("WEB TESTNET node proxies", function () {
        const proxies = Object.keys(WEB_TESTNET);
        proxies.forEach((proxy) => {
            it(`should fetch ${WEB_TESTNET[proxy]} account info`, async function () {
                const accountInfo = await new AccountInfoQuery()
                    .setNodeAccountIds([WEB_TESTNET[proxy]])
                    .setAccountId(WEB_TESTNET[proxy])
                    .execute(env.client);

                expect(accountInfo instanceof AccountInfo).to.be.true;
                expect(accountInfo.balance instanceof Hbar).to.be.true;
            });
        });
    });

    describe("WEB PREVIEWNET node proxies", function () {
        const proxies = Object.keys(WEB_PREVIEWNET);
        proxies.forEach((proxy) => {
            it(`should fetch ${WEB_PREVIEWNET[proxy]} account info`, async function () {
                const accountInfo = await new AccountInfoQuery()
                    .setNodeAccountIds([WEB_PREVIEWNET[proxy]])
                    .setAccountId(WEB_PREVIEWNET[proxy])
                    .execute(env.client);

                expect(accountInfo instanceof AccountInfo).to.be.true;
                expect(accountInfo.balance instanceof Hbar).to.be.true;
            });
        });
    });

    describe("NATIVE PREVIEWNET node proxies", function () {
        const proxies = Object.keys(WEB_PREVIEWNET);
        proxies.forEach((proxy) => {
            it(`should fetch ${WEB_PREVIEWNET[proxy]} account info`, async function () {
                const accountInfo = await new AccountInfoQuery()
                    .setNodeAccountIds([WEB_PREVIEWNET[proxy]])
                    .setAccountId(WEB_PREVIEWNET[proxy])
                    .execute(env.client);

                expect(accountInfo instanceof AccountInfo).to.be.true;
                expect(accountInfo.balance instanceof Hbar).to.be.true;
            });
        });
    });

    describe("NATIVE TESTNET node proxies", function () {
        const proxies = Object.keys(WEB_TESTNET);
        proxies.forEach((proxy) => {
            it(`should fetch ${WEB_TESTNET[proxy]} account info`, async function () {
                const accountInfo = await new AccountInfoQuery()
                    .setNodeAccountIds([WEB_TESTNET[proxy]])
                    .setAccountId(WEB_TESTNET[proxy])
                    .execute(env.client);

                expect(accountInfo instanceof AccountInfo).to.be.true;
                expect(accountInfo.balance instanceof Hbar).to.be.true;
            });
        });
    });
});
