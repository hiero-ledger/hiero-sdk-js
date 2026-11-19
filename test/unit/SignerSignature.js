import { AccountId, PublicKey, SignerSignature } from "../../src/index.js";

describe("SignerSignature", function () {
    const samplePublicKey = PublicKey.fromStringED25519(
        "302a300506032b6570032100e0c8ec2743260f0f22ee1fbcdd5082f9f420b9c73cb030fb9bc3934f35f17041",
    );
    const sampleSignature = new Uint8Array([1, 2, 3, 4, 5]);
    const sampleAccountId = new AccountId(3);

    describe("constructor", function () {
        it("should store publicKey, signature and accountId from props", function () {
            const signerSignature = new SignerSignature({
                publicKey: samplePublicKey,
                signature: sampleSignature,
                accountId: sampleAccountId,
            });

            expect(signerSignature.publicKey).to.equal(samplePublicKey);
            expect(signerSignature.signature).to.equal(sampleSignature);
            expect(signerSignature.accountId).to.equal(sampleAccountId);
        });

        it("should handle empty props object", function () {
            const signerSignature = new SignerSignature({});

            expect(signerSignature.publicKey).to.be.undefined;
            expect(signerSignature.signature).to.be.undefined;
            expect(signerSignature.accountId).to.be.undefined;
        });
    });
});
