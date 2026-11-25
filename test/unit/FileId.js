import { vi } from "vitest";
import FileId from "../../src/file/FileId.js";
import { Client } from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("FileId", function () {
    describe("static factory methods", function () {
        describe("getAddressBookFileIdFor", function () {
            it("should create FileId with default shard and realm", function () {
                const fileId = FileId.getAddressBookFileIdFor();
                expect(fileId.shard.toNumber()).to.equal(0);
                expect(fileId.realm.toNumber()).to.equal(0);
                expect(fileId.num.toNumber()).to.equal(102);
            });

            it("should create FileId with custom shard and realm", function () {
                const fileId = FileId.getAddressBookFileIdFor(1, 2);
                expect(fileId.shard.toNumber()).to.equal(1);
                expect(fileId.realm.toNumber()).to.equal(2);
                expect(fileId.num.toNumber()).to.equal(102);
            });
        });

        describe("getFeeScheduleFileIdFor", function () {
            it("should create FileId with default shard and realm", function () {
                const fileId = FileId.getFeeScheduleFileIdFor();
                expect(fileId.shard.toNumber()).to.equal(0);
                expect(fileId.realm.toNumber()).to.equal(0);
                expect(fileId.num.toNumber()).to.equal(111);
            });

            it("should create FileId with custom shard and realm", function () {
                const fileId = FileId.getFeeScheduleFileIdFor(1, 2);
                expect(fileId.shard.toNumber()).to.equal(1);
                expect(fileId.realm.toNumber()).to.equal(2);
                expect(fileId.num.toNumber()).to.equal(111);
            });
        });

        describe("getExchangeRatesFileIdFor", function () {
            it("should create FileId with default shard and realm", function () {
                const fileId = FileId.getExchangeRatesFileIdFor();
                expect(fileId.shard.toNumber()).to.equal(0);
                expect(fileId.realm.toNumber()).to.equal(0);
                expect(fileId.num.toNumber()).to.equal(112);
            });

            it("should create FileId with custom shard and realm", function () {
                const fileId = FileId.getExchangeRatesFileIdFor(1, 2);
                expect(fileId.shard.toNumber()).to.equal(1);
                expect(fileId.realm.toNumber()).to.equal(2);
                expect(fileId.num.toNumber()).to.equal(112);
            });
        });
    });

    describe("fromEvmAddress()", function () {
        it("should correctly handle fromEvmAddress with non-zero shard/realm and long-zero address", function () {
            // Given a call to fromEvmAddress(1, 1, longZeroAddress)
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234 in hex

            // When the EVM address contains only the entity number
            const fileId = FileId.fromEvmAddress(1, 1, longZeroAddress);

            // Then the resulting entity ID is correctly returned
            expect(fileId.toString()).to.equal("1.1.1234");
            expect(fileId.shard.toNumber()).to.equal(1);
            expect(fileId.realm.toNumber()).to.equal(1);
            expect(fileId.num.toNumber()).to.equal(1234);
        });

        it("should respect non-zero shard and realm values in fromEvmAddress", function () {
            // Given a call to fromEvmAddress(shard, realm, evmAddress) with non-zero values
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234

            // When non-zero shard and realm values are passed
            const fileId = FileId.fromEvmAddress(5, 10, longZeroAddress);

            // Then the method must respect those values
            expect(fileId.toString()).to.equal("5.10.1234");
            expect(fileId.shard.toNumber()).to.equal(5);
            expect(fileId.realm.toNumber()).to.equal(10);
            expect(fileId.num.toNumber()).to.equal(1234);
        });

        it("should handle fromEvmAddress with long-zero address and non-zero shard/realm", function () {
            // Test that fromEvmAddress correctly extracts the num from long-zero address
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234
            const fileId = FileId.fromEvmAddress(3, 7, longZeroAddress);

            expect(fileId.shard.toNumber()).to.equal(3);
            expect(fileId.realm.toNumber()).to.equal(7);
            expect(fileId.num.toNumber()).to.equal(1234);
        });

        it("should throw error for non-long-zero address", function () {
            // Given a non-long-zero address
            const nonLongZeroAddress =
                "742d35cc6634c0532925a3b844bc454e4438f44e";

            // When fromEvmAddress is called with non-long-zero address
            // Then it should throw an error
            expect(() => {
                FileId.fromEvmAddress(0, 0, nonLongZeroAddress);
            }).to.throw(
                "FileId.fromEvmAddress does not support non-long-zero addresses",
            );
        });

        it("should throw error for non-long-zero address with non-zero shard/realm", function () {
            // Given a non-long-zero address
            const nonLongZeroAddress =
                "742d35cc6634c0532925a3b844bc454e4438f44e";

            // When fromEvmAddress is called with non-long-zero address and non-zero shard/realm
            // Then it should throw an error
            expect(() => {
                FileId.fromEvmAddress(3, 7, nonLongZeroAddress);
            }).to.throw(
                "FileId.fromEvmAddress does not support non-long-zero addresses",
            );
        });
    });

    describe("toEvmAddress()", function () {
        it("should encode only entity number for non-zero shard/realm", function () {
            // Given an entity ID with non-zero shard and realm
            const fileId = new FileId(1, 2, 1234);

            // When toEvmAddress() is called
            const evmAddress = fileId.toEvmAddress();

            // Then the resulting EVM address encodes only the entity number
            // Should be a long-zero address with only the num in the last 8 bytes
            expect(evmAddress).to.equal(
                "00000000000000000000000000000000000004d2",
            );
        });

        it("should maintain backward compatibility for shard=0, realm=0", function () {
            // Given an entity ID with shard and realm both set to 0
            const fileId = new FileId(0, 0, 1234);

            // When toEvmAddress() is called
            const evmAddress = fileId.toEvmAddress();

            // Then the resulting EVM address should be unchanged (backward compatibility)
            expect(evmAddress).to.equal(
                "00000000000000000000000000000000000004d2",
            );
        });
    });

    describe("fromString()", function () {
        it("should parse valid entity IDs", function () {
            expect(FileId.fromString("0.0.123").toString()).to.equal("0.0.123");
            expect(FileId.fromString("123").toString()).to.equal("0.0.123");
            expect(FileId.fromString("1.2.3").toString()).to.equal("1.2.3");
            expect(FileId.fromString("0.0.0123").toString()).to.equal(
                "0.0.123",
            );
            expect(FileId.fromString("0.0.123-vfmkw").toString()).to.equal(
                "0.0.123",
            );
        });

        it("should throw when the entity number contains letters", function () {
            for (const text of ["0.0.12ab34", "0.0.ff", "0.0.5a", "0.0.1e3"]) {
                expect(() => FileId.fromString(text)).to.throw(
                    `failed to parse entity id: ${text}`,
                );
            }
        });
    });

    describe("deprecated", function () {
        it("validate() succeeds for matching network checksum and throws BadEntityIdError otherwise", function () {
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const testnetClient = Client.forTestnet({
                scheduleNetworkUpdate: false,
            });
            const mainnetClient = Client.forMainnet({
                scheduleNetworkUpdate: false,
            });
            try {
                const fileId = FileId.fromString("0.0.123-esxsf");
                expect(() => fileId.validate(testnetClient)).to.not.throw();
                expect(() => fileId.validate(mainnetClient)).to.throw(
                    BadEntityIdError,
                );
            } finally {
                testnetClient.close();
                mainnetClient.close();
                warnSpy.mockRestore();
            }
        });
    });
});

describe("deprecated", function () {
    let warn;
    let testnet;
    let mainnet;

    beforeEach(function () {
        warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
        mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
    });

    afterEach(function () {
        testnet.close();
        mainnet.close();
        vi.restoreAllMocks();
    });

    it("validate passes when the checksum matches the client's network", function () {
        FileId.fromString("0.0.123-esxsf").validate(testnet);

        expect(warn).toHaveBeenCalledWith(
            "Deprecated: Use `validateChecksum` instead",
        );
    });

    it("validate throws BadEntityIdError when the checksum is for another network", function () {
        expect(() =>
            FileId.fromString("0.0.123-esxsf").validate(mainnet),
        ).to.throw(BadEntityIdError);
    });
});
