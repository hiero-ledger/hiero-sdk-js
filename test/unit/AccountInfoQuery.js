import { AccountId, AccountInfoQuery } from "../../src/index.js";
import { describeQuery } from "./utils/transactionTests.js";

describe("AccountInfoQuery", function () {
    describeQuery(AccountInfoQuery, {
        queryCase: "cryptoGetInfo",
        execute: ["crypto", "getAccountInfo"],
        fields: [
            {
                name: "accountId",
                value: new AccountId(0, 0, 5005),
                entityId: true,
            },
        ],
    });
});
