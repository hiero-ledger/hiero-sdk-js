import TokenId from "../../src/token/TokenId.js";

describe("TokenId", function () {
    describe("fromEvmAddress()", function () {
        it("should correctly handle fromEvmAddress with non-zero shard/realm and long-zero address", function () {
            // Given a call to fromEvmAddress(1, 1, longZeroAddress)
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234 in hex

            // When the EVM address contains only the entity number
            const tokenId = TokenId.fromEvmAddress(1, 1, longZeroAddress);

            // Then the resulting entity ID is correctly returned
            expect(tokenId.toString()).to.equal("1.1.1234");
            expect(tokenId.shard.toNumber()).to.equal(1);
            expect(tokenId.realm.toNumber()).to.equal(1);
            expect(tokenId.num.toNumber()).to.equal(1234);
        });

        it("should respect non-zero shard and realm values in fromEvmAddress", function () {
            // Given a call to fromEvmAddress(shard, realm, evmAddress) with non-zero values
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234

            // When non-zero shard and realm values are passed
            const tokenId = TokenId.fromEvmAddress(5, 10, longZeroAddress);

            // Then the method must respect those values
            expect(tokenId.toString()).to.equal("5.10.1234");
            expect(tokenId.shard.toNumber()).to.equal(5);
            expect(tokenId.realm.toNumber()).to.equal(10);
            expect(tokenId.num.toNumber()).to.equal(1234);
        });

        it("should handle fromEvmAddress with long-zero address and non-zero shard/realm", function () {
            // Test that fromEvmAddress correctly extracts the num from long-zero address
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234
            const tokenId = TokenId.fromEvmAddress(3, 7, longZeroAddress);

            expect(tokenId.shard.toNumber()).to.equal(3);
            expect(tokenId.realm.toNumber()).to.equal(7);
            expect(tokenId.num.toNumber()).to.equal(1234);
        });

        it("should throw error for non-long-zero address", function () {
            // Given a non-long-zero address
            const nonLongZeroAddress =
                "742d35cc6634c0532925a3b844bc454e4438f44e";

            // When fromEvmAddress is called with non-long-zero address
            // Then it should throw an error
            expect(() => {
                TokenId.fromEvmAddress(0, 0, nonLongZeroAddress);
            }).to.throw(
                "TokenId.fromEvmAddress does not support non-long-zero addresses",
            );
        });

        it("should throw error for non-long-zero address with non-zero shard/realm", function () {
            // Given a non-long-zero address
            const nonLongZeroAddress =
                "742d35cc6634c0532925a3b844bc454e4438f44e";

            // When fromEvmAddress is called with non-long-zero address and non-zero shard/realm
            // Then it should throw an error
            expect(() => {
                TokenId.fromEvmAddress(3, 7, nonLongZeroAddress);
            }).to.throw(
                "TokenId.fromEvmAddress does not support non-long-zero addresses",
            );
        });
    });

    describe("toEvmAddress()", function () {
        it("should encode only entity number for non-zero shard/realm", function () {
            // Given an entity ID with non-zero shard and realm
            const tokenId = new TokenId(1, 2, 1234);

            // When toEvmAddress() is called
            const evmAddress = tokenId.toEvmAddress();

            // Then the resulting EVM address encodes only the entity number
            // Should be a long-zero address with only the num in the last 8 bytes
            expect(evmAddress).to.equal(
                "00000000000000000000000000000000000004d2",
            );
        });

        it("should maintain backward compatibility for shard=0, realm=0", function () {
            // Given an entity ID with shard and realm both set to 0
            const tokenId = new TokenId(0, 0, 1234);

            // When toEvmAddress() is called
            const evmAddress = tokenId.toEvmAddress();

            // Then the resulting EVM address should be unchanged (backward compatibility)
            expect(evmAddress).to.equal(
                "00000000000000000000000000000000000004d2",
            );
        });
    });
});
