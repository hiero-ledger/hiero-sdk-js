// SPDX-License-Identifier: Apache-2.0

import IPv4Address from "../../src/address_book/IPv4Address.js";
import IPv4AddressPart from "../../src/address_book/IPv4AddressPart.js";

describe("IPv4AddressPart", function () {
    describe("getters and setters", function () {
        it("should have null left and right by default", function () {
            const part = new IPv4AddressPart();
            expect(part.left).toBeNull();
            expect(part.right).toBeNull();
        });

        it("should initialize left and right from constructor props", function () {
            const part = new IPv4AddressPart({ left: 192, right: 168 });
            expect(part.left).toBe(192);
            expect(part.right).toBe(168);
        });

        it("should set and get left", function () {
            const part = new IPv4AddressPart();
            part.setLeft(10);
            expect(part.left).toBe(10);
        });

        it("should set and get right", function () {
            const part = new IPv4AddressPart();
            part.setRight(20);
            expect(part.right).toBe(20);
        });

        it("should allow resetting left and right to null", function () {
            const part = new IPv4AddressPart({ left: 1, right: 2 });
            part.setLeft(null);
            part.setRight(null);
            expect(part.left).toBeNull();
            expect(part.right).toBeNull();
        });
    });

    describe("method chaining", function () {
        it("should return this from setLeft", function () {
            const part = new IPv4AddressPart();
            expect(part.setLeft(10)).toBe(part);
        });

        it("should return this from setRight", function () {
            const part = new IPv4AddressPart();
            expect(part.setRight(20)).toBe(part);
        });

        it("should allow chaining setLeft and setRight", function () {
            const part = new IPv4AddressPart().setLeft(172).setRight(16);
            expect(part.left).toBe(172);
            expect(part.right).toBe(16);
        });
    });

    describe("toString", function () {
        it("should return formatted string when both parts are present", function () {
            const part = new IPv4AddressPart({ left: 192, right: 168 });
            expect(part.toString()).toBe("192.168");
        });

        it("should return empty string when left is null", function () {
            const part = new IPv4AddressPart({ right: 168 });
            expect(part.toString()).toBe("");
        });

        it("should return empty string when right is null", function () {
            const part = new IPv4AddressPart({ left: 192 });
            expect(part.toString()).toBe("");
        });

        it("should return empty string when both parts are null", function () {
            const part = new IPv4AddressPart();
            expect(part.toString()).toBe("");
        });
    });
});

describe("IPv4Address", function () {
    describe("network getter and backward compatibility of newtork", function () {
        it("should return null by default for network and newtork", function () {
            const address = new IPv4Address();
            expect(address.network).toBeNull();
            expect(address.newtork).toBeNull();
        });

        it("should return network part when set in constructor", function () {
            const network = new IPv4AddressPart({ left: 192, right: 168 });
            const address = new IPv4Address({ network });
            expect(address.network).toBe(network);
            expect(address.newtork).toBe(network);
            expect(address.newtork).toBe(address.network);
        });

        it("should return network part when set via setNetwork", function () {
            const address = new IPv4Address();
            const network = new IPv4AddressPart({ left: 10, right: 0 });
            address.setNetwork(network);
            expect(address.network).toBe(network);
            expect(address.newtork).toBe(network);
            expect(address.newtork).toBe(address.network);
        });

        it("should return this from setNetwork for method chaining", function () {
            const address = new IPv4Address();
            const network = new IPv4AddressPart({ left: 10, right: 0 });
            expect(address.setNetwork(network)).toBe(address);
        });
    });

    describe("host getter and setter", function () {
        it("should return null by default for host", function () {
            const address = new IPv4Address();
            expect(address.host).toBeNull();
        });

        it("should return host part when set in constructor", function () {
            const host = new IPv4AddressPart({ left: 1, right: 1 });
            const address = new IPv4Address({ host });
            expect(address.host).toBe(host);
        });

        it("should return host part when set via setHost", function () {
            const address = new IPv4Address();
            const host = new IPv4AddressPart({ left: 2, right: 3 });
            address.setHost(host);
            expect(address.host).toBe(host);
        });

        it("should return this from setHost for method chaining", function () {
            const address = new IPv4Address();
            const host = new IPv4AddressPart({ left: 1, right: 1 });
            expect(address.setHost(host)).toBe(address);
        });
    });

    describe("_fromProtobuf", function () {
        it("should parse known bytes into IPv4Address", function () {
            const bytes = new Uint8Array([192, 168, 1, 100]);
            const address = IPv4Address._fromProtobuf(bytes);

            expect(address).toBeInstanceOf(IPv4Address);
            expect(address.network).toBeInstanceOf(IPv4AddressPart);
            expect(address.network.left).toBe(192);
            expect(address.network.right).toBe(168);
            expect(address.host).toBeInstanceOf(IPv4AddressPart);
            expect(address.host.left).toBe(1);
            expect(address.host.right).toBe(100);
            expect(address.toString()).toBe("192.168.1.100");
        });

        it("should parse loopback address bytes", function () {
            const bytes = new Uint8Array([127, 0, 0, 1]);
            const address = IPv4Address._fromProtobuf(bytes);

            expect(address.network.left).toBe(127);
            expect(address.network.right).toBe(0);
            expect(address.host.left).toBe(0);
            expect(address.host.right).toBe(1);
            expect(address.toString()).toBe("127.0.0.1");
        });
    });

    describe("_fromString", function () {
        it("should parse a valid IPv4 address string", function () {
            const address = IPv4Address._fromString("192.168.1.1");

            expect(address).toBeInstanceOf(IPv4Address);
            expect(address.network.left).toBe(192);
            expect(address.network.right).toBe(168);
            expect(address.host.left).toBe(1);
            expect(address.host.right).toBe(1);
            expect(address.toString()).toBe("192.168.1.1");
        });

        it("should throw an error for invalid address formats", function () {
            expect(() => IPv4Address._fromString("invalid")).toThrow(
                "Invalid IPv4 address format",
            );
            expect(() => IPv4Address._fromString("192.168.1")).toThrow(
                "Invalid IPv4 address format",
            );
            expect(() => IPv4Address._fromString("192.168.1.1.1")).toThrow(
                "Invalid IPv4 address format",
            );
            expect(() => IPv4Address._fromString("")).toThrow(
                "Invalid IPv4 address format",
            );
        });
    });

    describe("_toProtobuf conversion and round-trip behavior", function () {
        it("should convert a populated address to protobuf bytes", function () {
            const address = IPv4Address._fromString("192.168.1.1");
            const bytes = address._toProtobuf();

            expect(bytes).toBeInstanceOf(Uint8Array);
            expect(bytes).toEqual(new Uint8Array([192, 168, 1, 1]));
        });

        it("should handle null or unpopulated parts in _toProtobuf", function () {
            const address = new IPv4Address();
            expect(address._toProtobuf()).toEqual(new Uint8Array([0, 0, 0, 0]));

            const partialAddress = new IPv4Address({
                network: new IPv4AddressPart({ left: 10 }),
            });
            expect(partialAddress._toProtobuf()).toEqual(
                new Uint8Array([10, 0, 0, 0]),
            );
        });

        it("should round-trip from protobuf bytes to IPv4Address and back to protobuf bytes", function () {
            const originalBytes = new Uint8Array([10, 0, 1, 50]);
            const address = IPv4Address._fromProtobuf(originalBytes);
            const resultBytes = address._toProtobuf();

            expect(resultBytes).toEqual(originalBytes);
        });

        it("should round-trip from string to protobuf and back to IPv4Address", function () {
            const ipStr = "172.16.254.1";
            const address = IPv4Address._fromString(ipStr);
            const bytes = address._toProtobuf();
            const roundTripAddress = IPv4Address._fromProtobuf(bytes);

            expect(roundTripAddress.toString()).toBe(ipStr);
            expect(roundTripAddress.network.left).toBe(address.network.left);
            expect(roundTripAddress.network.right).toBe(address.network.right);
            expect(roundTripAddress.host.left).toBe(address.host.left);
            expect(roundTripAddress.host.right).toBe(address.host.right);
        });
    });

    describe("toString", function () {
        it("should return formatted string for a fully populated address", function () {
            const address = IPv4Address._fromString("192.168.1.1");
            expect(address.toString()).toBe("192.168.1.1");
        });

        it("should return empty string when address is empty", function () {
            const address = new IPv4Address();
            expect(address.toString()).toBe("");
        });

        it("should return empty string when network is null", function () {
            const host = new IPv4AddressPart({ left: 1, right: 1 });
            const address = new IPv4Address({ host });
            expect(address.toString()).toBe("");
        });

        it("should return empty string when host is null", function () {
            const network = new IPv4AddressPart({ left: 192, right: 168 });
            const address = new IPv4Address({ network });
            expect(address.toString()).toBe("");
        });

        it("should handle incomplete parts gracefully", function () {
            const network = new IPv4AddressPart({ left: 192 });
            const host = new IPv4AddressPart({ left: 1, right: 1 });
            const address = new IPv4Address({ network, host });
            expect(address.toString()).toBe(".1.1");
        });
    });
});
