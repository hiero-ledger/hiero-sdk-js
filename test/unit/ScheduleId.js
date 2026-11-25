import ScheduleId from "../../src/schedule/ScheduleId.js";
import { Client } from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("ScheduleId", function () {
    describe("fromString()", function () {
        it("should parse valid entity IDs", function () {
            expect(ScheduleId.fromString("0.0.123").toString()).to.equal(
                "0.0.123",
            );
            expect(ScheduleId.fromString("123").toString()).to.equal("0.0.123");
            expect(ScheduleId.fromString("1.2.3").toString()).to.equal("1.2.3");
            expect(ScheduleId.fromString("0.0.0123").toString()).to.equal(
                "0.0.123",
            );
            expect(ScheduleId.fromString("0.0.123-vfmkw").toString()).to.equal(
                "0.0.123",
            );
        });

        it("should throw when the entity number contains letters", function () {
            for (const text of ["0.0.12ab34", "0.0.ff", "0.0.5a", "0.0.1e3"]) {
                expect(() => ScheduleId.fromString(text)).to.throw(
                    `failed to parse entity id: ${text}`,
                );
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
        ScheduleId.fromString("0.0.123-esxsf").validate(testnet);

        expect(warn).toHaveBeenCalledWith(
            "Deprecated: Use `validateChecksum` instead",
        );
    });

    it("validate throws BadEntityIdError when the checksum is for another network", function () {
        expect(() =>
            ScheduleId.fromString("0.0.123-esxsf").validate(mainnet),
        ).to.throw(BadEntityIdError);
    });
});
