import * as hex from "../../src/encoding/hex.js";
import AccessListItem from "../../src/AccessListItem.js";

const address = hex.decode("7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181");
const storageKey1 = hex.decode(
    "0000000000000000000000000000000000000000000000000000000000000001",
);
const storageKey2 = hex.decode(
    "0000000000000000000000000000000000000000000000000000000000000002",
);

describe("AccessListItem", function () {
    it("setStorageKeys() replaces the storage keys and returns the item", function () {
        const item = new AccessListItem(address, [storageKey1]);

        expect(item.setStorageKeys([storageKey2])).to.equal(item);

        expect(item.getStorageKeys()).to.deep.equal([storageKey2]);
        expect(item.toTuple()).to.deep.equal([address, [storageKey2]]);
    });

    it("setStorageKeys() copies the array it is given", function () {
        const storageKeys = [storageKey1];
        const item = new AccessListItem(address).setStorageKeys(storageKeys);

        storageKeys.push(storageKey2);

        expect(item.getStorageKeys()).to.deep.equal([storageKey1]);
    });
});
