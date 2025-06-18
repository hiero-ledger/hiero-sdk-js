import FileId from "../../src/file/FileId.js";

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
});
