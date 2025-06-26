import EndPoint from "../../src/address_book/Endpoint.js";
import IPv4Address from "../../src/address_book/IPv4Address.js";

describe("EndPoint", function () {
    describe("constructor", function () {
        it("should create empty EndPoint with no parameters", function () {
            const endpoint = new EndPoint();
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBeNull();
        });

        it("should create EndPoint with address only", function () {
            const endpoint = new EndPoint({ address: "192.168.1.1" });
            expect(endpoint.address).toBe("192.168.1.1");
            expect(endpoint.port).toBeNull();
        });

        it("should create EndPoint with port only", function () {
            const endpoint = new EndPoint({ port: 8080 });
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBe(8080);
        });

        it("should create EndPoint with both address and port", function () {
            const endpoint = new EndPoint({
                address: "192.168.1.1",
                port: 8080,
            });
            expect(endpoint.address).toBe("192.168.1.1");
            expect(endpoint.port).toBe(8080);
        });

        it("should create EndPoint with IPv4Address object", function () {
            const ipv4Address = new IPv4Address();
            const endpoint = new EndPoint({ address: ipv4Address });
            expect(endpoint.address).toBe(ipv4Address);
            expect(endpoint.port).toBeNull();
        });

        it("should handle null values in constructor", function () {
            const endpoint = new EndPoint({
                address: null,
                port: null,
            });
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBeNull();
        });

        it("should handle undefined values in constructor", function () {
            const endpoint = new EndPoint({
                address: undefined,
                port: undefined,
            });
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBeNull();
        });
    });

    describe("address getter and setter", function () {
        it("should get and set string address", function () {
            const endpoint = new EndPoint();
            endpoint.setAddress("192.168.1.1");
            expect(endpoint.address).toBe("192.168.1.1");
        });

        it("should get and set IPv4Address object", function () {
            const endpoint = new EndPoint();
            const ipv4Address = new IPv4Address();
            endpoint.setAddress(ipv4Address);
            expect(endpoint.address).toBe(ipv4Address);
        });

        it("should return this for method chaining", function () {
            const endpoint = new EndPoint();
            const result = endpoint.setAddress("192.168.1.1");
            expect(result).toBe(endpoint);
        });

        it("should handle null address", function () {
            const endpoint = new EndPoint();
            endpoint.setAddress(null);
            expect(endpoint.address).toBeNull();
        });
    });

    describe("port getter and setter", function () {
        it("should get and set port number", function () {
            const endpoint = new EndPoint();
            endpoint.setPort(8080);
            expect(endpoint.port).toBe(8080);
        });

        it("should return this for method chaining", function () {
            const endpoint = new EndPoint();
            const result = endpoint.setPort(8080);
            expect(result).toBe(endpoint);
        });

        it("should handle zero port", function () {
            const endpoint = new EndPoint();
            endpoint.setPort(0);
            expect(endpoint.port).toBe(0);
        });

        it("should handle large port numbers", function () {
            const endpoint = new EndPoint();
            endpoint.setPort(65535);
            expect(endpoint.port).toBe(65535);
        });
    });

    describe("_fromProtobuf", function () {
        it("should create EndPoint from protobuf with IPv4 address", function () {
            const mockIPv4Address = {
                _toProtobuf: () => new Uint8Array([192, 168, 1, 1]),
            };
            const protobufEndpoint = {
                ipAddressV4: mockIPv4Address,
                port: 8080,
            };

            const endpoint = EndPoint._fromProtobuf(protobufEndpoint);
            expect(endpoint.address).toBeInstanceOf(IPv4Address);
            expect(endpoint.port).toBe(8080);
        });

        it("should create EndPoint from protobuf with domain name", function () {
            const protobufEndpoint = {
                domainName: "example.com",
                port: 443,
            };

            const endpoint = EndPoint._fromProtobuf(protobufEndpoint);
            expect(endpoint.address).toBe("example.com");
            expect(endpoint.port).toBe(443);
        });

        it("should handle protobuf with null values", function () {
            const protobufEndpoint = {
                ipAddressV4: null,
                port: null,
            };

            const endpoint = EndPoint._fromProtobuf(protobufEndpoint);
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBeNull();
        });

        it("should handle protobuf with undefined values", function () {
            const protobufEndpoint = {};
            const endpoint = EndPoint._fromProtobuf(protobufEndpoint);
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBeNull();
        });
    });

    describe("_toProtobuf", function () {
        it("should convert EndPoint with IPv4Address to protobuf", function () {
            const mockIPv4Address = {
                _toProtobuf: () => new Uint8Array([192, 168, 1, 1]),
            };
            const endpoint = new EndPoint({
                address: mockIPv4Address,
                port: 8080,
            });

            const protobuf = endpoint._toProtobuf();
            expect(protobuf.ipAddressV4).toEqual(
                new Uint8Array([192, 168, 1, 1]),
            );
            expect(protobuf.port).toBe(8080);
            expect(protobuf.domainName).toBeUndefined();
        });

        it("should convert EndPoint with string address to protobuf", function () {
            const endpoint = new EndPoint({
                address: "example.com",
                port: 443,
            });

            const protobuf = endpoint._toProtobuf();
            expect(protobuf.domainName).toBe("example.com");
            expect(protobuf.port).toBe(443);
            expect(protobuf.ipAddressV4).toBeUndefined();
        });

        it("should handle null address in protobuf conversion", function () {
            const endpoint = new EndPoint({
                address: null,
                port: 8080,
            });

            const protobuf = endpoint._toProtobuf();
            expect(protobuf.ipAddressV4).toBeNull();
            expect(protobuf.port).toBe(8080);
        });

        it("should handle null port in protobuf conversion", function () {
            const endpoint = new EndPoint({
                address: "example.com",
                port: null,
            });

            const protobuf = endpoint._toProtobuf();
            expect(protobuf.domainName).toBe("example.com");
            expect(protobuf.port).toBeNull();
        });

        it("should handle both null values in protobuf conversion", function () {
            const endpoint = new EndPoint({
                address: null,
                port: null,
            });

            const protobuf = endpoint._toProtobuf();
            expect(protobuf.ipAddressV4).toBeNull();
            expect(protobuf.port).toBeNull();
        });
    });

    describe("fromJSON", function () {
        it("should create EndPoint from valid IPv4 address JSON", function () {
            const json = {
                address: "192.168.1.1",
                port: "8080",
            };

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBe("192.168.1.1");
            expect(endpoint.port).toBe(8080);
        });

        it("should create EndPoint from domain name JSON", function () {
            const json = {
                address: "example.com",
                port: "443",
            };

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBe("example.com");
            expect(endpoint.port).toBe(443);
        });

        it("should handle JSON with null values", function () {
            const json = {
                address: null,
                port: null,
            };

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBeNull();
        });

        it("should handle JSON with undefined values", function () {
            const json = {};

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBeNull();
        });

        it("should handle JSON with only address", function () {
            const json = {
                address: "192.168.1.1",
            };

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBe("192.168.1.1");
            expect(endpoint.port).toBeNull();
        });

        it("should handle JSON with only port", function () {
            const json = {
                port: "8080",
            };

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBeNull();
            expect(endpoint.port).toBe(8080);
        });

        it("should handle invalid IPv4 address as string", function () {
            const json = {
                address: "invalid-ip",
                port: "8080",
            };

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBe("invalid-ip");
            expect(endpoint.port).toBe(8080);
        });

        it("should handle empty string address", function () {
            const json = {
                address: "",
                port: "8080",
            };

            const endpoint = EndPoint.fromJSON(json);
            expect(endpoint.address).toBeNull;
            expect(endpoint.port).toBe(8080);
        });
    });

    describe("toString", function () {
        it("should return string representation with IPv4 address and port", function () {
            const endpoint = new EndPoint({
                address: "192.168.1.1",
                port: 8080,
            });

            expect(endpoint.toString()).toBe("192.168.1.1:8080");
        });

        it("should return string representation with domain name and port", function () {
            const endpoint = new EndPoint({
                address: "example.com",
                port: 443,
            });

            expect(endpoint.toString()).toBe("example.com:443");
        });

        it("should handle null address", function () {
            const endpoint = new EndPoint({
                address: null,
                port: 8080,
            });

            expect(endpoint.toString()).toBe(":8080");
        });

        it("should handle null port", function () {
            const endpoint = new EndPoint({
                address: "192.168.1.1",
                port: null,
            });

            expect(endpoint.toString()).toBe("192.168.1.1:");
        });

        it("should handle both null values", function () {
            const endpoint = new EndPoint({
                address: null,
                port: null,
            });

            expect(endpoint.toString()).toBe(":");
        });

        it("should handle IPv4Address object", function () {
            const mockIPv4Address = {
                toString: () => "192.168.1.1",
            };
            const endpoint = new EndPoint({
                address: mockIPv4Address,
                port: 8080,
            });

            expect(endpoint.toString()).toBe("192.168.1.1:8080");
        });
    });

    describe("toJSON", function () {
        it("should convert EndPoint with IPv4Address to JSON", function () {
            const mockIPv4Address = {
                toString: () => "192.168.1.1",
            };
            const endpoint = new EndPoint({
                address: mockIPv4Address,
                port: 8080,
            });

            const json = endpoint.toJSON();
            expect(json.address).toBe("192.168.1.1");
            expect(json.port).toBe("8080");
        });

        it("should convert EndPoint with string address to JSON", function () {
            const endpoint = new EndPoint({
                address: "example.com",
                port: 443,
            });

            const json = endpoint.toJSON();
            expect(json.address).toBe("example.com");
            expect(json.port).toBe("443");
        });

        it("should handle null address in JSON conversion", function () {
            const endpoint = new EndPoint({
                address: null,
                port: 8080,
            });

            const json = endpoint.toJSON();
            expect(json.address).toBeNull();
            expect(json.port).toBe("8080");
        });

        it("should handle null port in JSON conversion", function () {
            const endpoint = new EndPoint({
                address: "192.168.1.1",
                port: null,
            });

            const json = endpoint.toJSON();
            expect(json.address).toBe("192.168.1.1");
            expect(json.port).toBeNull();
        });

        it("should handle both null values in JSON conversion", function () {
            const endpoint = new EndPoint({
                address: null,
                port: null,
            });

            const json = endpoint.toJSON();
            expect(json.address).toBeNull();
            expect(json.port).toBeNull();
        });
    });

    describe("edge cases and error handling", function () {
        it("should handle very large port numbers", function () {
            const endpoint = new EndPoint({
                port: 65535,
            });
            expect(endpoint.port).toBe(65535);
        });

        it("should handle zero port", function () {
            const endpoint = new EndPoint({
                port: 0,
            });
            expect(endpoint.port).toBe(0);
        });

        it("should handle empty string address", function () {
            const endpoint = new EndPoint({
                address: "",
            });
            expect(endpoint.address).toBe("");
        });

        it("should handle special characters in domain name", function () {
            const endpoint = new EndPoint({
                address: "test-domain.example.com",
                port: 8080,
            });
            expect(endpoint.address).toBe("test-domain.example.com");
            expect(endpoint.port).toBe(8080);
        });

        it("should handle IPv4Address with toString method that returns empty string", function () {
            const mockIPv4Address = {
                toString: () => "",
            };
            const endpoint = new EndPoint({
                address: mockIPv4Address,
                port: 8080,
            });

            expect(endpoint.toString()).toBe(":8080");
            expect(endpoint.toJSON().address).toBe("");
        });
    });

    describe("integration with IPv4Address", function () {
        it("should work with real IPv4Address instance", function () {
            // Create a real IPv4Address instance
            const ipv4Address = IPv4Address._fromString("192.168.1.1");
            const endpoint = new EndPoint({
                address: ipv4Address,
                port: 8080,
            });

            expect(endpoint.address).toBeInstanceOf(IPv4Address);
            expect(endpoint.port).toBe(8080);
            expect(endpoint.toString()).toBe("192.168.1.1:8080");
        });

        it("should convert real IPv4Address to protobuf", function () {
            const ipv4Address = IPv4Address._fromString("192.168.1.1");
            const endpoint = new EndPoint({
                address: ipv4Address,
                port: 8080,
            });

            const protobuf = endpoint._toProtobuf();
            expect(protobuf.ipAddressV4).toBeInstanceOf(Uint8Array);
            expect(protobuf.port).toBe(8080);
        });
    });
});
