import FeeEstimateQuery from "../../src/query/FeeEstimateQuery.js";
import FeeEstimateMode from "../../src/query/enums/FeeEstimateMode.js";
import { TransferTransaction, AccountId, Hbar } from "../../src/index.js";

describe("FeeEstimateQuery", function () {
    let mockTransaction;

    beforeEach(function () {
        // Create a mock transaction
        mockTransaction = new TransferTransaction()
            .addHbarTransfer(new AccountId(1001), new Hbar(-10))
            .addHbarTransfer(new AccountId(1002), new Hbar(10));
    });

    describe("constructor", function () {
        it("should create with default props", function () {
            const query = new FeeEstimateQuery();

            expect(query.mode).to.equal(FeeEstimateMode.STATE);
            expect(query.transaction).to.be.null;
        });

        it("should create with mode prop", function () {
            const query = new FeeEstimateQuery({
                mode: FeeEstimateMode.INTRINSIC,
            });

            expect(query.mode).to.equal(FeeEstimateMode.INTRINSIC);
            expect(query.transaction).to.be.null;
        });

        it("should create with transaction prop", function () {
            const query = new FeeEstimateQuery({
                transaction: mockTransaction,
            });

            expect(query.mode).to.equal(FeeEstimateMode.STATE);
            expect(query.transaction).to.equal(mockTransaction);
        });
    });

    describe("setMode", function () {
        it("should set STATE mode", function () {
            const query = new FeeEstimateQuery();
            const result = query.setMode(FeeEstimateMode.STATE);

            expect(query.mode).to.equal(FeeEstimateMode.STATE);
            expect(result).to.equal(query);
        });

        it("should set INTRINSIC mode", function () {
            const query = new FeeEstimateQuery();
            const result = query.setMode(FeeEstimateMode.INTRINSIC);

            expect(query.mode).to.equal(FeeEstimateMode.INTRINSIC);
            expect(result).to.equal(query);
        });

        it("should throw error for invalid mode", function () {
            const query = new FeeEstimateQuery();

            expect(() => query.setMode(999)).to.throw(
                Error,
                "Invalid FeeEstimateMode: 999. Must be one of: STATE (0), INTRINSIC (1)",
            );
        });
    });

    describe("setTransaction", function () {
        it("should set transaction", function () {
            const query = new FeeEstimateQuery();
            const result = query.setTransaction(mockTransaction);

            expect(query.transaction).to.equal(mockTransaction);
            expect(result).to.equal(query);
        });

        it("should set null transaction", function () {
            const query = new FeeEstimateQuery();
            query.setTransaction(mockTransaction);
            query.setTransaction(null);

            expect(query.transaction).to.be.null;
        });
    });

    describe("getMode", function () {
        it("should get current mode", function () {
            const query = new FeeEstimateQuery();
            query.setMode(FeeEstimateMode.INTRINSIC);

            expect(query.getMode()).to.equal(FeeEstimateMode.INTRINSIC);
        });
    });

    describe("getTransaction", function () {
        it("should get current transaction", function () {
            const query = new FeeEstimateQuery();
            query.setTransaction(mockTransaction);

            expect(query.getTransaction()).to.equal(mockTransaction);
        });
    });

    describe("_validateChecksums", function () {
        it("should validate transaction checksums when transaction is set", function () {
            const query = new FeeEstimateQuery({
                transaction: mockTransaction,
            });

            let validated = false;
            mockTransaction._validateChecksums = () => {
                validated = true;
            };

            query._validateChecksums({});

            expect(validated).to.be.true;
        });

        it("should not validate when transaction is null", function () {
            const query = new FeeEstimateQuery();

            expect(() => query._validateChecksums({})).to.not.throw();
        });
    });
});
