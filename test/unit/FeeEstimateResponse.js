// SPDX-License-Identifier: Apache-2.0

import FeeEstimateResponse from "../../src/query/FeeEstimateResponse.js";
import NetworkFee from "../../src/query/NetworkFee.js";
import FeeEstimate from "../../src/query/FeeEstimate.js";
import FeeExtra from "../../src/query/FeeExtra.js";
import Long from "long";

describe("FeeEstimateResponse", function () {
    let defaultProps;
    let mockNetworkFee;
    let mockNodeFee;
    let mockServiceFee;

    beforeEach(function () {
        mockNetworkFee = new NetworkFee({
            multiplier: 2.0,
            subtotal: Long.fromNumber(1000),
        });

        mockNodeFee = new FeeEstimate({
            base: Long.fromNumber(500),
            extras: [
                new FeeExtra({
                    name: "nodeExtra",
                    included: 2,
                    count: 5,
                    charged: 3,
                    feePerUnit: 100,
                    subtotal: 300,
                }),
            ],
        });

        mockServiceFee = new FeeEstimate({
            base: Long.fromNumber(750),
            extras: [
                new FeeExtra({
                    name: "serviceExtra",
                    included: 1,
                    count: 3,
                    charged: 2,
                    feePerUnit: 50,
                    subtotal: 100,
                }),
            ],
        });

        defaultProps = {
            highVolumeMultiplier: 1,
            networkFee: mockNetworkFee,
            nodeFee: mockNodeFee,
            serviceFee: mockServiceFee,
            total: Long.fromNumber(2250),
        };
    });

    describe("constructor", function () {
        it("should create with all required props", function () {
            const response = new FeeEstimateResponse(defaultProps);

            expect(response.highVolumeMultiplier.toNumber()).to.equal(1);
            expect(response.networkFee).to.equal(mockNetworkFee);
            expect(response.nodeFee).to.equal(mockNodeFee);
            expect(response.serviceFee).to.equal(mockServiceFee);
            expect(response.total.toNumber()).to.equal(2250);
        });

        it("should default highVolumeMultiplier to 1 when omitted", function () {
            const props = { ...defaultProps };
            delete props.highVolumeMultiplier;

            const response = new FeeEstimateResponse(props);

            expect(response.highVolumeMultiplier.toNumber()).to.equal(1);
        });

        it("should accept highVolumeMultiplier > 1", function () {
            const response = new FeeEstimateResponse({
                ...defaultProps,
                highVolumeMultiplier: 5,
            });

            expect(response.highVolumeMultiplier.toNumber()).to.equal(5);
        });

        it("should handle number values for total", function () {
            const response = new FeeEstimateResponse({
                ...defaultProps,
                total: 3000,
            });

            expect(response.total.toNumber()).to.equal(3000);
        });

        it("should handle string values for total", function () {
            const response = new FeeEstimateResponse({
                ...defaultProps,
                total: "4000",
            });

            expect(response.total.toNumber()).to.equal(4000);
        });

        it("should handle zero total", function () {
            const response = new FeeEstimateResponse({
                ...defaultProps,
                total: 0,
            });

            expect(response.total.toNumber()).to.equal(0);
        });
    });

    describe("_fromJSON", function () {
        it("should create from JSON with all fields", function () {
            const jsonObj = {
                high_volume_multiplier: 2,
                network: {
                    multiplier: 1.5,
                    subtotal: 800,
                },
                node: {
                    base: 400,
                    extras: [
                        {
                            name: "jsonNodeExtra",
                            included: 1,
                            count: 2,
                            charged: 1,
                            fee_per_unit: 200,
                            subtotal: 200,
                        },
                    ],
                },
                service: {
                    base: 600,
                    extras: [],
                },
                total: 1800,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.highVolumeMultiplier.toNumber()).to.equal(2);
            expect(response.networkFee.multiplier).to.equal(1.5);
            expect(response.networkFee.subtotal.toNumber()).to.equal(800);
            expect(response.nodeFee.base.toNumber()).to.equal(400);
            expect(response.nodeFee.extras).to.have.lengthOf(1);
            expect(response.nodeFee.extras[0].name).to.equal("jsonNodeExtra");
            expect(response.nodeFee.extras[0].feePerUnit.toNumber()).to.equal(
                200,
            );
            expect(response.serviceFee.base.toNumber()).to.equal(600);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.total.toNumber()).to.equal(1800);
        });

        it("should default high_volume_multiplier to 1 when omitted", function () {
            const response = FeeEstimateResponse._fromJSON({ total: 1000 });

            expect(response.highVolumeMultiplier.toNumber()).to.equal(1);
        });

        it("should handle missing fields in JSON", function () {
            const response = FeeEstimateResponse._fromJSON({ total: 1000 });

            expect(response.networkFee.multiplier).to.equal(0);
            expect(response.networkFee.subtotal.toNumber()).to.equal(0);
            expect(response.nodeFee.base.toNumber()).to.equal(0);
            expect(response.nodeFee.extras).to.have.lengthOf(0);
            expect(response.serviceFee.base.toNumber()).to.equal(0);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.total.toNumber()).to.equal(1000);
        });

        it("should handle null fields in JSON", function () {
            const response = FeeEstimateResponse._fromJSON({
                high_volume_multiplier: null,
                network: null,
                node: null,
                service: null,
                total: null,
            });

            expect(response.highVolumeMultiplier.toNumber()).to.equal(1);
            expect(response.networkFee.multiplier).to.equal(0);
            expect(response.nodeFee.base.toNumber()).to.equal(0);
            expect(response.serviceFee.base.toNumber()).to.equal(0);
            expect(response.total.toNumber()).to.equal(0);
        });

        it("should handle empty JSON object", function () {
            const response = FeeEstimateResponse._fromJSON({});

            expect(response.highVolumeMultiplier.toNumber()).to.equal(1);
            expect(response.total.toNumber()).to.equal(0);
        });

        it("should handle node with multiple extras", function () {
            const response = FeeEstimateResponse._fromJSON({
                node: {
                    base: 1000,
                    extras: [
                        {
                            name: "extra1",
                            included: 1,
                            count: 3,
                            charged: 2,
                            fee_per_unit: 100,
                            subtotal: 200,
                        },
                        {
                            name: "extra2",
                            included: 0,
                            count: 5,
                            charged: 5,
                            fee_per_unit: 50,
                            subtotal: 250,
                        },
                    ],
                },
                total: 1450,
            });

            expect(response.nodeFee.base.toNumber()).to.equal(1000);
            expect(response.nodeFee.extras).to.have.lengthOf(2);
            expect(response.nodeFee.extras[0].name).to.equal("extra1");
            expect(response.nodeFee.extras[0].charged).to.equal(2);
            expect(response.nodeFee.extras[1].name).to.equal("extra2");
            expect(response.nodeFee.extras[1].charged).to.equal(5);
        });

        it("should parse a realistic API response", function () {
            const apiResponse = {
                high_volume_multiplier: 1,
                network: {
                    multiplier: 1.0,
                    subtotal: 5000,
                },
                node: {
                    base: 2500,
                    extras: [
                        {
                            name: "CRYPTO_TRANSFER_BPT_FEE",
                            included: 25,
                            count: 30,
                            charged: 5,
                            fee_per_unit: 100,
                            subtotal: 500,
                        },
                    ],
                },
                service: {
                    base: 2500,
                    extras: [],
                },
                total: 10500,
            };

            const response = FeeEstimateResponse._fromJSON(apiResponse);

            expect(response.networkFee.multiplier).to.equal(1.0);
            expect(response.networkFee.subtotal.toNumber()).to.equal(5000);
            expect(response.nodeFee.base.toNumber()).to.equal(2500);
            expect(response.nodeFee.extras).to.have.lengthOf(1);
            expect(response.nodeFee.extras[0].name).to.equal(
                "CRYPTO_TRANSFER_BPT_FEE",
            );
            expect(response.serviceFee.base.toNumber()).to.equal(2500);
            expect(response.total.toNumber()).to.equal(10500);
        });
    });

    describe("readonly properties", function () {
        it("should expose all spec-defined properties with correct types", function () {
            const response = new FeeEstimateResponse(defaultProps);

            expect(response.highVolumeMultiplier).to.be.instanceOf(Long);
            expect(response.networkFee).to.be.instanceOf(NetworkFee);
            expect(response.nodeFee).to.be.instanceOf(FeeEstimate);
            expect(response.serviceFee).to.be.instanceOf(FeeEstimate);
            expect(response.total).to.be.instanceOf(Long);
        });
    });
});
