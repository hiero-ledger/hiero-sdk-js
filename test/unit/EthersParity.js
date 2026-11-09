// Parity tests that pin the SDK's ABI and RLP output to what ethers produces.
// They exist so that ethers can be replaced by smaller helpers (#4528) without
// silently changing encoded call data, decoded results or transaction bytes.
import {
    AbiCoder,
    Interface,
    ParamType,
    Signature,
    Transaction,
    getBytes,
    hexlify,
} from "ethers";
import BigNumber from "bignumber.js";
import {
    ContractFunctionParameters,
    ContractFunctionResult,
    EthereumTransactionData,
} from "../../src/index.js";

const abi = AbiCoder.defaultAbiCoder();

const WIDTHS = Array.from({ length: 32 }, (_, i) => (i + 1) * 8);

const ADDRESS_A = "11223344556677889900aabbccddeeff00112233";
const ADDRESS_B = "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181";

/**
 * Boundary values for an intN/uintN type, as bigints.
 *
 * @param {boolean} signed
 * @param {number} bits
 * @returns {bigint[]}
 */
function boundaries(signed, bits) {
    if (signed) {
        const max = (1n << BigInt(bits - 1)) - 1n;
        return [-max - 1n, -1n, 0n, 1n, max];
    }
    return [0n, 1n, (1n << BigInt(bits)) - 1n];
}

/**
 * @param {bigint} value
 * @returns {BigNumber}
 */
function toBigNumber(value) {
    return new BigNumber(value.toString());
}

describe("ethers parity", function () {
    describe("ContractFunctionParameters encoding", function () {
        for (const signed of [true, false]) {
            for (const bits of WIDTHS) {
                const type = `${signed ? "int" : "uint"}${bits}`;
                const name = `${signed ? "Int" : "Uint"}${bits}`;

                it(`encodes ${type} like ethers`, function () {
                    for (const value of boundaries(signed, bits)) {
                        const params = new ContractFunctionParameters()[
                            `add${name}`
                        ](toBigNumber(value));

                        expect(hexlify(params._build())).to.equal(
                            abi.encode([type], [value]),
                        );
                    }
                });

                it(`encodes ${type}[] like ethers`, function () {
                    const values = boundaries(signed, bits);
                    const params = new ContractFunctionParameters()[
                        `add${name}Array`
                    ](values.map(toBigNumber));

                    expect(hexlify(params._build())).to.equal(
                        abi.encode([`${type}[]`], [values]),
                    );
                });
            }
        }

        it("encodes number inputs like ethers", function () {
            const params = new ContractFunctionParameters()
                .addInt8(-128)
                .addUint32(4294967295)
                .addInt64(-1)
                .addUint256(Number.MAX_SAFE_INTEGER);

            expect(hexlify(params._build())).to.equal(
                abi.encode(
                    ["int8", "uint32", "int64", "uint256"],
                    [-128, 4294967295, -1, Number.MAX_SAFE_INTEGER],
                ),
            );
        });

        it("encodes bool like ethers", function () {
            const params = new ContractFunctionParameters()
                .addBool(true)
                .addBool(false);

            expect(hexlify(params._build())).to.equal(
                abi.encode(["bool", "bool"], [true, false]),
            );
        });

        it("encodes address and address[] like ethers", function () {
            const params = new ContractFunctionParameters()
                .addAddress(ADDRESS_A)
                .addAddress(`0x${ADDRESS_B}`)
                .addAddressArray([ADDRESS_A, `0x${ADDRESS_B}`])
                .addAddressArray([]);

            expect(hexlify(params._build())).to.equal(
                abi.encode(
                    ["address", "address", "address[]", "address[]"],
                    [
                        `0x${ADDRESS_A}`,
                        `0x${ADDRESS_B}`,
                        [`0x${ADDRESS_A}`, `0x${ADDRESS_B}`],
                        [],
                    ],
                ),
            );
        });

        it("encodes string and string[] like ethers", function () {
            const strings = [
                "",
                "a",
                "this is a grin: 😁",
                "x".repeat(32),
                "y".repeat(33),
                "z".repeat(100),
            ];

            for (const value of strings) {
                expect(
                    hexlify(
                        new ContractFunctionParameters()
                            .addString(value)
                            ._build(),
                    ),
                ).to.equal(abi.encode(["string"], [value]));
            }

            expect(
                hexlify(
                    new ContractFunctionParameters()
                        .addStringArray(strings)
                        .addStringArray([])
                        ._build(),
                ),
            ).to.equal(abi.encode(["string[]", "string[]"], [strings, []]));
        });

        it("encodes bytes and bytes[] like ethers", function () {
            const values = [0, 1, 31, 32, 33, 64, 100].map((length) =>
                Uint8Array.from({ length }, (_, i) => (i * 7 + 1) & 0xff),
            );

            for (const value of values) {
                expect(
                    hexlify(
                        new ContractFunctionParameters()
                            .addBytes(value)
                            ._build(),
                    ),
                ).to.equal(abi.encode(["bytes"], [value]));
            }

            expect(
                hexlify(
                    new ContractFunctionParameters()
                        .addBytesArray(values)
                        .addBytesArray([])
                        ._build(),
                ),
            ).to.equal(abi.encode(["bytes[]", "bytes[]"], [values, []]));
        });

        it("encodes bytes32 and bytes32[] like ethers", function () {
            const a = Uint8Array.from({ length: 32 }, (_, i) => i);
            const b = Uint8Array.from({ length: 32 }, (_, i) => 255 - i);

            expect(
                hexlify(
                    new ContractFunctionParameters()
                        .addBytes32(a)
                        .addBytes32Array([a, b])
                        .addBytes32Array([])
                        ._build(),
                ),
            ).to.equal(
                abi.encode(
                    ["bytes32", "bytes32[]", "bytes32[]"],
                    [a, [a, b], []],
                ),
            );
        });

        it("encodes mixed static and dynamic parameters with a selector like ethers", function () {
            const blob = Uint8Array.from({ length: 40 }, (_, i) => i);
            const params = new ContractFunctionParameters()
                .addUint8(7)
                .addString("hello")
                .addAddress(ADDRESS_A)
                .addBytes(blob)
                .addInt256Array([-1, 0, 1])
                .addBool(true)
                .addStringArray(["one", "two"]);

            const iface = new Interface([
                "function mixed(uint8,string,address,bytes,int256[],bool,string[])",
            ]);

            expect(hexlify(params._build("mixed"))).to.equal(
                iface.encodeFunctionData("mixed", [
                    7,
                    "hello",
                    `0x${ADDRESS_A}`,
                    blob,
                    [-1, 0, 1],
                    true,
                    ["one", "two"],
                ]),
            );
        });

        it("encodes an empty parameter list with a selector like ethers", function () {
            const iface = new Interface(["function noArgs()"]);

            expect(
                hexlify(new ContractFunctionParameters()._build("noArgs")),
            ).to.equal(iface.encodeFunctionData("noArgs", []));
        });
    });

    describe("ContractFunctionResult typed getters", function () {
        for (const signed of [true, false]) {
            for (const bits of WIDTHS) {
                const type = `${signed ? "int" : "uint"}${bits}`;
                const getter = `get${signed ? "Int" : "Uint"}${bits}`;

                it(`${getter} reads what ethers encodes`, function () {
                    const values = boundaries(signed, bits);
                    const result = new ContractFunctionResult({
                        bytes: getBytes(
                            abi.encode(
                                values.map(() => type),
                                values,
                            ),
                        ),
                    });

                    for (const [i, value] of values.entries()) {
                        expect(result[getter](i).toString(10)).to.equal(
                            value.toString(),
                        );
                    }
                });
            }
        }

        it("getBool, getAddress, getBytes32, getBytes and getString read what ethers encodes", function () {
            const word = Uint8Array.from({ length: 32 }, (_, i) => i + 1);
            const blob = Uint8Array.from({ length: 45 }, (_, i) => 200 - i);
            const result = new ContractFunctionResult({
                bytes: getBytes(
                    abi.encode(
                        [
                            "bool",
                            "bool",
                            "address",
                            "bytes32",
                            "bytes",
                            "string",
                        ],
                        [
                            true,
                            false,
                            `0x${ADDRESS_A}`,
                            word,
                            blob,
                            "this is a grin: 😁",
                        ],
                    ),
                ),
            });

            expect(result.getBool(0)).to.be.true;
            expect(result.getBool(1)).to.be.false;
            expect(result.getAddress(2)).to.equal(ADDRESS_A);
            expect(result.getBytes32(3)).to.deep.equal(word);
            expect(result.getBytes(4)).to.deep.equal(blob);
            expect(result.getString(5)).to.equal("this is a grin: 😁");
        });
    });

    describe("ContractFunctionResult.getResult", function () {
        const types = [
            "uint8",
            "int32",
            "uint32",
            "int40",
            "uint64",
            "int256",
            "uint256",
            "address",
            "bool",
            "bytes",
            "bytes32",
            "string",
            "uint8[]",
            "int64[]",
            "int256[2]",
            "string[]",
            "bytes[]",
            "address[]",
            "uint32[][]",
            "tuple(uint8,address,string)",
            "tuple(uint32,bytes)[]",
            "tuple(uint16,tuple(bool,int64[]))",
        ];

        const word = `0x${"ab".repeat(32)}`;

        const values = [
            255,
            -2147483648,
            4294967295,
            -549755813888n,
            18446744073709551615n,
            -(1n << 255n),
            (1n << 256n) - 1n,
            `0x${ADDRESS_A}`,
            true,
            "0x0102",
            word,
            "hello",
            [1, 2, 255],
            [-1n, 1n << 62n],
            [-1n, 7n],
            ["a", ""],
            ["0x", "0xff"],
            [`0x${ADDRESS_A}`, `0x${ADDRESS_B}`],
            [[1], [], [2, 3]],
            [7, `0x${ADDRESS_B}`, "x"],
            [
                [1, "0x01"],
                [2, "0x"],
            ],
            [9, [false, [-3n, 4n]]],
        ];

        // Addresses come back checksummed, as ethers returns them.
        const checksumA = "0x11223344556677889900aABbCcdDEeFF00112233";
        const checksumB = "0x7e3A9EaF9Bcc39E2FfA38EB30bf7A93FEAcBC181";

        /**
         * What getResult returns today. Integers of 32 bits or less become
         * numbers, wider ones BigNumber. Inside a tuple every integer becomes
         * a BigNumber because the member types are not looked at.
         */
        function expected() {
            return [
                255,
                -2147483648,
                4294967295,
                new BigNumber("-549755813888"),
                new BigNumber("18446744073709551615"),
                new BigNumber((-(1n << 255n)).toString()),
                new BigNumber(((1n << 256n) - 1n).toString()),
                checksumA,
                true,
                "0x0102",
                word,
                "hello",
                [1, 2, 255],
                [new BigNumber(-1), new BigNumber((1n << 62n).toString())],
                [new BigNumber(-1), new BigNumber(7)],
                ["a", ""],
                ["0x", "0xff"],
                [checksumA, checksumB],
                [[1], [], [2, 3]],
                [new BigNumber(7), checksumB, "x"],
                [
                    [new BigNumber(1), "0x01"],
                    [new BigNumber(2), "0x"],
                ],
                [
                    new BigNumber(9),
                    [false, [new BigNumber(-3), new BigNumber(4)]],
                ],
            ];
        }

        const bytes = getBytes(abi.encode(types, values));

        it("decodes every supported type from string types", function () {
            const result = new ContractFunctionResult({ bytes }).getResult(
                types,
            );

            expect(result).to.deep.equal(expected());
        });

        it("decodes every supported type from ParamType objects", function () {
            const result = new ContractFunctionResult({ bytes }).getResult(
                types.map((type) => ParamType.from(type)),
            );

            expect(result).to.deep.equal(expected());
        });

        it("returns plain arrays for arrays and tuples", function () {
            const result = new ContractFunctionResult({ bytes }).getResult(
                types,
            );

            for (const [i, type] of types.entries()) {
                if (type.endsWith("]") || type.startsWith("tuple")) {
                    expect(Object.getPrototypeOf(result[i])).to.equal(
                        Array.prototype,
                    );
                }
            }
        });

        it("throws on data that is too short for the requested types", function () {
            const result = new ContractFunctionResult({
                bytes: new Uint8Array(31),
            });

            expect(() => result.getResult(["uint256"])).to.throw();
        });

        it("decodes tuple(uint256,uint256)", function () {
            const encoded = abi.encode(["tuple(uint256,uint256)"], [[1n, 2n]]);
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(uint256,uint256)"]);

            expect(result).to.deep.equal([
                [new BigNumber("1"), new BigNumber("2")],
            ]);
        });

        it("decodes uint256, tuple(uint256,uint256), string", function () {
            const encoded = abi.encode(
                ["uint256", "tuple(uint256,uint256)", "string"],
                [5n, [1n, 2n], "hi"],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["uint256", "tuple(uint256,uint256)", "string"]);

            expect(result).to.deep.equal([
                new BigNumber("5"),
                [new BigNumber("1"), new BigNumber("2")],
                "hi",
            ]);
        });

        it("decodes tuple(uint8,tuple(uint8,uint8),string)", function () {
            const encoded = abi.encode(
                ["tuple(uint8,tuple(uint8,uint8),string)"],
                [[1, [2, 3], "x"]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(uint8,tuple(uint8,uint8),string)"]);

            expect(result).to.deep.equal([
                [
                    new BigNumber("1"),
                    [new BigNumber("2"), new BigNumber("3")],
                    "x",
                ],
            ]);
        });

        it("decodes tuple(uint256,address)[]", function () {
            const encoded = abi.encode(
                ["tuple(uint256,address)[]"],
                [
                    [
                        [1n, `0x${ADDRESS_A}`],
                        [2n, `0x${ADDRESS_B}`],
                    ],
                ],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(uint256,address)[]"]);

            expect(result).to.deep.equal([
                [
                    [new BigNumber("1"), checksumA],
                    [new BigNumber("2"), checksumB],
                ],
            ]);
        });

        it("decodes string[2]", function () {
            const encoded = abi.encode(["string[2]"], [["a", "b"]]);
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["string[2]"]);

            expect(result).to.deep.equal([["a", "b"]]);
        });

        it("decodes bytes[2]", function () {
            const encoded = abi.encode(["bytes[2]"], [["0x01", "0x0203"]]);
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["bytes[2]"]);

            expect(result).to.deep.equal([["0x01", "0x0203"]]);
        });

        it("decodes uint8[2][2]", function () {
            const encoded = abi.encode(
                ["uint8[2][2]"],
                [
                    [
                        [1, 2],
                        [3, 4],
                    ],
                ],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["uint8[2][2]"]);

            expect(result).to.deep.equal([
                [
                    [new BigNumber("1"), new BigNumber("2")],
                    [new BigNumber("3"), new BigNumber("4")],
                ],
            ]);
        });

        it("decodes uint256[2][]", function () {
            const encoded = abi.encode(
                ["uint256[2][]"],
                [
                    [
                        [1n, 2n],
                        [3n, 4n],
                    ],
                ],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["uint256[2][]"]);

            expect(result).to.deep.equal([
                [
                    [new BigNumber("1"), new BigNumber("2")],
                    [new BigNumber("3"), new BigNumber("4")],
                ],
            ]);
        });

        it("decodes uint8[2]", function () {
            const encoded = abi.encode(["uint8[2]"], [[5, 10]]);
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["uint8[2]"]);

            expect(result).to.deep.equal([
                [new BigNumber("5"), new BigNumber("10")],
            ]);
        });

        it("accepts (uint256,string) without tuple keyword", function () {
            const encoded = abi.encode(
                ["tuple(uint256,string)"],
                [[42n, "test"]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["(uint256,string)"]);

            expect(result).to.deep.equal([[new BigNumber("42"), "test"]]);
        });

        it("accepts tuple(uint256 a, string b) with member names", function () {
            const encoded = abi.encode(
                ["tuple(uint256,string)"],
                [[99n, "named"]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(uint256 a, string b)"]);

            expect(result).to.deep.equal([[new BigNumber("99"), "named"]]);
        });

        it("decodes bool from empty-like bytes", function () {
            const encoded = abi.encode(["bool"], [true]);
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["bool"]);

            expect(result).to.deep.equal([true]);
        });

        it("decodes bool from a dirty word like ethers", function () {
            const bytes = getBytes(`0x${"00".repeat(30)}0100`);
            const result = new ContractFunctionResult({
                bytes,
            }).getResult(["bool"]);

            expect(result).to.deep.equal([true]);
        });

        it("decodes tuple(uint8[],string)", function () {
            const encoded = abi.encode(
                ["tuple(uint8[],string)"],
                [[[1, 2], "x"]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(uint8[],string)"]);

            expect(result).to.deep.equal([
                [[new BigNumber("1"), new BigNumber("2")], "x"],
            ]);
        });

        it("decodes tuple(string[2],uint8[])", function () {
            const encoded = abi.encode(
                ["tuple(string[2],uint8[])"],
                [[["a", "b"], [1]]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(string[2],uint8[])"]);

            expect(result).to.deep.equal([[["a", "b"], [new BigNumber("1")]]]);
        });

        it("decodes uint8[][2]", function () {
            const encoded = abi.encode(
                ["uint8[][2]"],
                [
                    [
                        [1, 2],
                        [3, 4],
                    ],
                ],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["uint8[][2]"]);

            expect(result).to.deep.equal([
                [
                    [new BigNumber("1"), new BigNumber("2")],
                    [new BigNumber("3"), new BigNumber("4")],
                ],
            ]);
        });

        it("decodes uint8[][][2]", function () {
            const encoded = abi.encode(
                ["uint8[][][2]"],
                [
                    [
                        [[1], [2]],
                        [[3], [4]],
                    ],
                ],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["uint8[][][2]"]);

            expect(result).to.deep.equal([
                [
                    [[new BigNumber("1")], [new BigNumber("2")]],
                    [[new BigNumber("3")], [new BigNumber("4")]],
                ],
            ]);
        });

        it("accepts ((uint256,uint256),string) nested parentheses", function () {
            const encoded = abi.encode(
                ["tuple(tuple(uint256,uint256),string)"],
                [[[1n, 2n], "nested"]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["((uint256,uint256),string)"]);

            expect(result).to.deep.equal([
                [[new BigNumber("1"), new BigNumber("2")], "nested"],
            ]);
        });

        it("accepts tuple(tuple(uint256,uint256) inner, string s) with nested names", function () {
            const encoded = abi.encode(
                ["tuple(tuple(uint256,uint256),string)"],
                [[[10n, 20n], "test"]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(tuple(uint256,uint256) inner, string s)"]);

            expect(result).to.deep.equal([
                [[new BigNumber("10"), new BigNumber("20")], "test"],
            ]);
        });

        it("accepts tuple(uint256[] a, string b) with array name", function () {
            const encoded = abi.encode(
                ["tuple(uint256[],string)"],
                [[[7n, 8n], "array"]],
            );
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(uint256[] a, string b)"]);

            expect(result).to.deep.equal([
                [[new BigNumber("7"), new BigNumber("8")], "array"],
            ]);
        });

        it("accepts tuple(uint a, int b) with short type names", function () {
            const encoded = abi.encode(["tuple(uint256,int256)"], [[42n, -1n]]);
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["tuple(uint a, int b)"]);

            expect(result).to.deep.equal([
                [new BigNumber("42"), new BigNumber("-1")],
            ]);
        });

        it("accepts string[] names with trailing name", function () {
            const encoded = abi.encode(["string[]"], [["hello", "world"]]);
            const result = new ContractFunctionResult({
                bytes: getBytes(encoded),
            }).getResult(["string[] names"]);

            expect(result).to.deep.equal([["hello", "world"]]);
        });

        it("throws on bool with short data", function () {
            expect(() =>
                new ContractFunctionResult({
                    bytes: new Uint8Array(0),
                }).getResult(["bool"]),
            ).to.throw("data out-of-bounds");
        });
    });

    describe("EthereumTransactionData RLP", function () {
        const signature = Signature.from({
            r: `0x${"11".repeat(32)}`,
            s: `0x${"22".repeat(32)}`,
            v: 27,
        });

        const accessList = [
            {
                address: `0x${ADDRESS_A}`,
                storageKeys: [
                    `0x${"00".repeat(31)}01`,
                    `0x${"00".repeat(31)}02`,
                ],
            },
            { address: `0x${ADDRESS_B}`, storageKeys: [] },
        ];

        // Longer than 55 bytes so the long RLP string form is used.
        const data = `0x${"ab".repeat(120)}`;

        const base = {
            to: `0x${ADDRESS_B}`,
            nonce: 300,
            gasLimit: 100000n,
            value: 1000000000000000000n,
            data,
            signature,
        };

        const cases = {
            legacy: { ...base, type: 0, gasPrice: 47n },
            "legacy (EIP-155)": {
                ...base,
                type: 0,
                gasPrice: 47n,
                chainId: 298n,
            },
            "EIP-2930": {
                ...base,
                type: 1,
                chainId: 298n,
                gasPrice: 47n,
                accessList,
            },
            "EIP-1559": {
                ...base,
                type: 2,
                chainId: 298n,
                maxPriorityFeePerGas: 1n,
                maxFeePerGas: 1000000000n,
                accessList,
            },
            "EIP-1559 contract creation": {
                ...base,
                to: null,
                type: 2,
                chainId: 298n,
                maxPriorityFeePerGas: 0n,
                maxFeePerGas: 0n,
                value: 0n,
                accessList: [],
            },
            "EIP-7702": {
                ...base,
                type: 4,
                chainId: 298n,
                maxPriorityFeePerGas: 1n,
                maxFeePerGas: 1000000000n,
                accessList,
                authorizationList: [
                    {
                        chainId: 298n,
                        address: `0x${ADDRESS_A}`,
                        nonce: 5n,
                        signature: Signature.from({
                            r: `0x${"33".repeat(32)}`,
                            s: `0x${"44".repeat(32)}`,
                            yParity: 1,
                        }),
                    },
                    {
                        chainId: 0n,
                        address: `0x${ADDRESS_B}`,
                        nonce: 0n,
                        signature: Signature.from({
                            r: `0x${"55".repeat(32)}`,
                            s: `0x${"66".repeat(32)}`,
                            yParity: 0,
                        }),
                    },
                ],
            },
        };

        for (const [name, fields] of Object.entries(cases)) {
            it(`round-trips an ethers-serialized ${name} transaction byte for byte`, function () {
                const serialized = Transaction.from(fields).serialized;

                const decoded = EthereumTransactionData.fromBytes(
                    getBytes(serialized),
                );

                expect(hexlify(decoded.toBytes())).to.equal(serialized);
            });
        }

        it("decodes ethers-serialized fields to the expected bytes", function () {
            const serialized = Transaction.from(cases["EIP-1559"]).serialized;
            const decoded = EthereumTransactionData.fromBytes(
                getBytes(serialized),
            );

            expect(hexlify(decoded.chainId)).to.equal("0x012a");
            expect(hexlify(decoded.nonce)).to.equal("0x012c");
            expect(hexlify(decoded.maxPriorityGas)).to.equal("0x01");
            expect(hexlify(decoded.maxGas)).to.equal("0x3b9aca00");
            expect(hexlify(decoded.gasLimit)).to.equal("0x0186a0");
            expect(hexlify(decoded.to)).to.equal(`0x${ADDRESS_B}`);
            expect(hexlify(decoded.value)).to.equal("0x0de0b6b3a7640000");
            expect(hexlify(decoded.callData)).to.equal(data);
            expect(hexlify(decoded.r)).to.equal(`0x${"11".repeat(32)}`);
            expect(hexlify(decoded.s)).to.equal(`0x${"22".repeat(32)}`);
        });
    });
});
