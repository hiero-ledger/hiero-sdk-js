import {
    NodeCreateTransaction,
    AccountCreateTransaction,
    PrivateKey,
    Hbar,
    ServiceEndpoint,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

// eslint-disable-next-line vitest/no-disabled-tests
describe("NodeCreateTransaction", function () {
    let env;
    const validGossipCertDER =
        "3082052830820310a003020102020101300d06092a864886f70d01010c05003010310e300c060355040313056e6f6465333024170d3234313030383134333233395a181332313234313030383134333233392e3337395a3010310e300c060355040313056e6f64653330820222300d06092a864886f70d01010105000382020f003082020a0282020100af111cff0c4ad8125d2f4b8691ce87332fecc867f7a94ddc0f3f96514cc4224d44af516394f7384c1ef0a515d29aa6116b65bc7e4d7e2d848cf79fbfffedae3a6583b3957a438bdd780c4981b800676ea509bc8c619ae04093b5fc642c4484152f0e8bcaabf19eae025b630028d183a2f47caf6d9f1075efb30a4248679d871beef1b7e9115382270cbdb68682fae4b1fd592cadb414d918c0a8c23795c7c5a91e22b3e90c410825a2bc1a840efc5bf9976a7f474c7ed7dc047e4ddd2db631b68bb4475f173baa3edc234c4bed79c83e2f826f79e07d0aade2d984da447a8514135bfa4145274a7f62959a23c4f0fae5adc6855974e7c04164951d052beb5d45cb1f3cdfd005da894dea9151cb62ba43f4731c6bb0c83e10fd842763ba6844ef499f71bc67fa13e4917fb39f2ad18112170d31cdcb3c61c9e3253accf703dbd8427fdcb87ece78b787b6cfdc091e8fedea8ad95dc64074e1fc6d0e42ea2337e18a5e54e4aaab3791a98dfcef282e2ae1caec9cf986fabe8f36e6a21c8711647177e492d264415e765a86c58599cd97b103cb4f6a01d2edd06e3b60470cf64daca7aecf831197b466cae04baeeac19840a05394bef628aed04b611cfa13677724b08ddfd662b02fd0ef0af17eb7f4fb8c1c17fbe9324f6dc7bcc02449622636cc45ec04909b3120ab4df4726b21bf79e955fe8f832699d2196dcd7a58bfeafb170203010001a38186308183300f0603551d130101ff04053003020100300e0603551d0f0101ff0404030204b030200603551d250101ff0416301406082b0601050507030106082b06010505070302301d0603551d0e04160414643118e05209035edd83d44a0c368de2fb2fe4c0301f0603551d23041830168014643118e05209035edd83d44a0c368de2fb2fe4c0300d06092a864886f70d01010c05000382020100ad41c32bb52650eb4b76fce439c9404e84e4538a94916b3dc7983e8b5c58890556e7384601ca7440dde68233bb07b97bf879b64487b447df510897d2a0a4e789c409a9b237a6ad240ad5464f2ce80c58ddc4d07a29a74eb25e1223db6c00e334d7a27d32bfa6183a82f5e35bccf497c2445a526eabb0c068aba9b94cc092ea4756b0dcfb574f6179f0089e52b174ccdbd04123eeb6d70daeabd8513fcba6be0bc2b45ca9a69802dae11cc4d9ff6053b3a87fd8b0c6bf72fffc3b81167f73cca2b3fd656c5d353c8defca8a76e2ad535f984870a590af4e28fed5c5a125bf360747c5e7742e7813d1bd39b5498c8eb6ba72f267eda034314fdbc596f6b967a0ef8be5231d364e634444c84e64bd7919425171016fcd9bb05f01c58a303dee28241f6e860fc3aac3d92aad7dac2801ce79a3b41a0e1f1509fc0d86e96d94edb18616c000152490f64561713102128990fedd3a5fa642f2ff22dc11bc4dc5b209986a0c3e4eb2bdfdd40e9fdf246f702441cac058dd8d0d51eb0796e2bea2ce1b37b2a2f468505e1f8980a9f66d719df034a6fbbd2f9585991d259678fb9a4aebdc465d22c240351ed44abffbdd11b79a706fdf7c40158d3da87f68d7bd557191a8016b5b899c07bf1b87590feb4fa4203feea9a2a7a73ec224813a12b7a21e5dc93fcde4f0a7620f570d31fe27e9b8d65b74db7dc18a5e51adc42d7805d4661938";

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should create and update a network node", async function () {
        // Set the operator to be genesis operator

        env.client.setOperator(env.genesisOperatorId, env.genesisOperatorKey);

        // The account of the new node

        // Create a new account id for the new node
        const accountCreateTx = await new AccountCreateTransaction()
            .setKeyWithoutAlias(PrivateKey.generateED25519())
            .setInitialBalance(new Hbar(1))
            .execute(env.client);
        const accountCreateReceipt = await accountCreateTx.getReceipt(
            env.client,
        );
        const accountId = accountCreateReceipt.accountId;

        const description = "test";

        // Create endpoints
        const endpoint = new ServiceEndpoint()
            .setDomainName("tests.com")
            .setPort(1234);
        const endpoint2 = new ServiceEndpoint()
            .setDomainName("test.com")
            .setPort(123);

        // Set up grpcWebProxyEndpoint address
        const grpcWebProxyEndpoint = new ServiceEndpoint()
            .setDomainName("test.com")
            .setPort(12345);

        // Convert hex string to byte array
        const validGossipCert = new Uint8Array(
            validGossipCertDER
                .match(/.{1,2}/g)
                .map((byte) => parseInt(byte, 16)),
        );

        // Generate admin key
        const adminKey = PrivateKey.generateED25519();
        // Create the node

        await (
            await (
                await new NodeCreateTransaction()
                    .setAccountId(accountId)
                    .setAdminKey(adminKey)
                    .setDescription(description)
                    .setGossipCaCertificate(validGossipCert)
                    .setGossipEndpoints([endpoint, endpoint2])
                    .setServiceEndpoints([endpoint, endpoint2])
                    .setDeclineReward(true)
                    .setGrpcWebProxyEndpoint(grpcWebProxyEndpoint)
                    .freezeWith(env.client)
                    .sign(adminKey)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    afterAll(async function () {
        await env.close();
    });
});
