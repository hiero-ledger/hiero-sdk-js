// SPDX-License-Identifier: Apache-2.0

import MirrorNodeHttpRetryPolicy from "../../../src/mirror_node/MirrorNodeHttpRetryPolicy.js";

describe("MirrorNodeHttpRetryPolicy", function () {
    it("defaults every field", function () {
        const policy = new MirrorNodeHttpRetryPolicy();

        expect(policy.maxAttempts).to.equal(5);
        expect(policy.perAttemptTimeout).to.equal(30000);
        expect(policy.totalDeadline).to.equal(0);
        expect(policy.initialBackoff).to.equal(250);
        expect(policy.maxBackoff).to.equal(8000);
        expect(policy.retryableStatusCodes).to.deep.equal([
            408, 429, 500, 502, 503, 504,
        ]);
        expect(Object.isFrozen(policy)).to.be.true;
        expect(Object.isFrozen(policy.retryableStatusCodes)).to.be.true;
        expect(policy.equals(MirrorNodeHttpRetryPolicy.DEFAULT)).to.be.true;
    });

    it("keeps every unnamed field at its default when one is changed", function () {
        const policy = new MirrorNodeHttpRetryPolicy({ maxAttempts: 3 });

        expect(policy.maxAttempts).to.equal(3);
        expect(policy.perAttemptTimeout).to.equal(30000);
        expect(policy.initialBackoff).to.equal(250);
        expect(policy.maxBackoff).to.equal(8000);
        expect(policy.retryableStatusCodes).to.have.length(6);

        const derived = new MirrorNodeHttpRetryPolicy({
            ...policy,
            perAttemptTimeout: 3000,
        });
        expect(derived.maxAttempts).to.equal(3);
        expect(derived.perAttemptTimeout).to.equal(3000);
        expect(derived.retryableStatusCodes).to.deep.equal(
            policy.retryableStatusCodes,
        );
    });

    it("rejects zero attempts and negative durations", function () {
        expect(
            () => new MirrorNodeHttpRetryPolicy({ maxAttempts: 0 }),
        ).to.throw(RangeError, "maxAttempts");
        expect(
            () => new MirrorNodeHttpRetryPolicy({ maxAttempts: 1.5 }),
        ).to.throw(RangeError, "maxAttempts");
        for (const field of [
            "perAttemptTimeout",
            "totalDeadline",
            "initialBackoff",
            "maxBackoff",
        ]) {
            expect(
                () => new MirrorNodeHttpRetryPolicy({ [field]: -1 }),
                field,
            ).to.throw(RangeError, field);
        }
        expect(
            () => new MirrorNodeHttpRetryPolicy({ retryableStatusCodes: [42] }),
        ).to.throw(RangeError, "retryableStatusCodes");
        expect(
            () =>
                new MirrorNodeHttpRetryPolicy({
                    // @ts-ignore deliberately wrong
                    retryableStatusCodes: "503",
                }),
        ).to.throw(RangeError, "retryableStatusCodes");
    });

    it("accepts zero for the durations, meaning no cap or inherit", function () {
        const policy = new MirrorNodeHttpRetryPolicy({
            perAttemptTimeout: 0,
            totalDeadline: 0,
            initialBackoff: 0,
            maxBackoff: 0,
        });
        expect(policy.perAttemptTimeout).to.equal(0);
        expect(policy.maxBackoff).to.equal(0);
    });

    it("classifies statuses by the list, not by class", function () {
        const policy = new MirrorNodeHttpRetryPolicy();
        for (const code of [408, 429, 500, 502, 503, 504]) {
            expect(policy.isRetryableStatus(code), String(code)).to.be.true;
        }
        for (const code of [200, 400, 404, 501, 505, 511]) {
            expect(policy.isRetryableStatus(code), String(code)).to.be.false;
        }
        expect(
            new MirrorNodeHttpRetryPolicy({
                retryableStatusCodes: [503, 503],
            }).retryableStatusCodes,
        ).to.deep.equal([503]);
    });

    it("provides the loopback default with only two fields changed", function () {
        const local = MirrorNodeHttpRetryPolicy.LOCAL_DEFAULT;
        expect(local.maxAttempts).to.equal(15);
        expect(local.totalDeadline).to.equal(90000);
        expect(local.perAttemptTimeout).to.equal(30000);
        expect(local.initialBackoff).to.equal(250);
        expect(local.maxBackoff).to.equal(8000);
        expect(local.equals(MirrorNodeHttpRetryPolicy.DEFAULT)).to.be.false;
    });

    it("returns an instance as is from `from()`", function () {
        const policy = new MirrorNodeHttpRetryPolicy();
        expect(MirrorNodeHttpRetryPolicy.from(policy)).to.equal(policy);
        expect(MirrorNodeHttpRetryPolicy.from(undefined).equals(policy)).to.be
            .true;
        expect(
            MirrorNodeHttpRetryPolicy.from({ maxAttempts: 2 }).maxAttempts,
        ).to.equal(2);
    });
});
