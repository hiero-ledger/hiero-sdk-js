import { describe, it, expect, vi, afterEach } from "vitest";
import Query from "../query/Query.js";
import ScheduleId from "./ScheduleId.js";
import ScheduleInfo from "./ScheduleInfo.js";
import ScheduleInfoQuery from "./ScheduleInfoQuery.js";

describe("ScheduleInfoQuery", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("creates with no schedule ID by default", () => {
        const query = new ScheduleInfoQuery();

        expect(query.scheduleId).toBeNull();
    });

    it("initializes with a schedule ID from constructor", () => {
        const query = new ScheduleInfoQuery({ scheduleId: "0.0.123" });

        expect(query.scheduleId.toString()).toBe("0.0.123");
    });

    it("sets schedule ID from string and supports chaining", () => {
        const query = new ScheduleInfoQuery();

        const result = query.setScheduleId("0.0.456");

        expect(result).toBe(query);
        expect(query.scheduleId.toString()).toBe("0.0.456");
    });

    it("sets schedule ID from object via clone", () => {
        const clonedId = new ScheduleId(0, 0, 777);
        const input = {
            clone: vi.fn(() => clonedId),
        };

        const query = new ScheduleInfoQuery();
        query.setScheduleId(input);

        expect(input.clone).toHaveBeenCalledOnce();
        expect(query.scheduleId).toBe(clonedId);
    });

    it("throws for invalid schedule ID string", () => {
        const query = new ScheduleInfoQuery();

        expect(() => query.setScheduleId("")).toThrow();
    });

    it("builds request with a protobuf schedule ID when set", () => {
        const query = new ScheduleInfoQuery({ scheduleId: "0.0.123" });
        const header = { payment: { some: "header" } };

        const request = query._onMakeRequest(header);

        expect(request.scheduleGetInfo.header).toBe(header);
        expect(request.scheduleGetInfo.scheduleID.scheduleNum.toString()).toBe(
            "123",
        );
        expect(request.scheduleGetInfo.scheduleID.shardNum.toString()).toBe(
            "0",
        );
        expect(request.scheduleGetInfo.scheduleID.realmNum.toString()).toBe(
            "0",
        );
    });

    it("builds request with null schedule ID when unset", () => {
        const query = new ScheduleInfoQuery();

        const request = query._onMakeRequest({});

        expect(request.scheduleGetInfo.scheduleID).toBeNull();
    });

    it("maps response header", () => {
        const query = new ScheduleInfoQuery();
        const header = { nodeTransactionPrecheckCode: 22 };

        const mapped = query._mapResponseHeader({
            scheduleGetInfo: { header },
        });

        expect(mapped).toBe(header);
    });

    it("maps response using ScheduleInfo._fromProtobuf", async () => {
        const query = new ScheduleInfoQuery();
        const expected = { mapped: true };
        const spy = vi
            .spyOn(ScheduleInfo, "_fromProtobuf")
            .mockReturnValue(expected);

        const rawInfo = { scheduleID: { shardNum: 0, realmNum: 0, scheduleNum: 1 } };
        const result = await query._mapResponse(
            { scheduleGetInfo: { scheduleInfo: rawInfo } },
            {},
            {},
        );

        expect(spy).toHaveBeenCalledWith(rawInfo);
        expect(result).toBe(expected);
    });

    it("validates checksum when schedule ID exists", () => {
        const query = new ScheduleInfoQuery();
        const validateChecksum = vi.fn();

        query._scheduleId = { validateChecksum };
        query._validateChecksums({ some: "client" });

        expect(validateChecksum).toHaveBeenCalledWith({ some: "client" });
    });

    it("does nothing when checksum validation has no schedule ID", () => {
        const query = new ScheduleInfoQuery();

        expect(() => query._validateChecksums({})).not.toThrow();
    });

    it("executes using schedule.getScheduleInfo", async () => {
        const query = new ScheduleInfoQuery();
        const request = { query: true };
        const response = { response: true };
        const getScheduleInfo = vi.fn().mockResolvedValue(response);

        const result = await query._execute(
            { schedule: { getScheduleInfo } },
            request,
        );

        expect(getScheduleInfo).toHaveBeenCalledWith(request);
        expect(result).toBe(response);
    });

    it("uses payment transaction validStart in log ID when present", () => {
        const query = new ScheduleInfoQuery();
        query._paymentTransactionId = {
            validStart: {
                toString: () => "123.456",
            },
        };

        expect(query._getLogId()).toBe("ScheduleInfoQuery:123.456");
    });

    it("falls back to internal timestamp in log ID", () => {
        const query = new ScheduleInfoQuery();
        query._paymentTransactionId = null;
        query._timestamp = 789;

        expect(query._getLogId()).toBe("ScheduleInfoQuery:789");
    });

    it("delegates getCost to Query.getCost", async () => {
        const query = new ScheduleInfoQuery();
        const expectedCost = { tinybars: 1 };
        const spy = vi
            .spyOn(Query.prototype, "getCost")
            .mockResolvedValue(expectedCost);
        const client = { client: true };

        const cost = await query.getCost(client);

        expect(spy).toHaveBeenCalledWith(client);
        expect(cost).toBe(expectedCost);
    });

    it("builds from protobuf with scheduleID", () => {
        const fromPbSpy = vi
            .spyOn(ScheduleId, "_fromProtobuf")
            .mockReturnValue(new ScheduleId(0, 0, 321));

        const query = ScheduleInfoQuery._fromProtobuf({
            scheduleGetInfo: {
                scheduleID: { shardNum: 0, realmNum: 0, scheduleNum: 321 },
            },
        });

        expect(fromPbSpy).toHaveBeenCalledWith({
            shardNum: 0,
            realmNum: 0,
            scheduleNum: 321,
        });
        expect(query.scheduleId.toString()).toBe("0.0.321");
    });

    it("builds from protobuf without scheduleID", () => {
        const query = ScheduleInfoQuery._fromProtobuf({
            scheduleGetInfo: {},
        });

        expect(query.scheduleId).toBeNull();
    });
});