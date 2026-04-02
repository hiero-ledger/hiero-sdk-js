// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import Query, { QUERY_REGISTRY } from "../query/Query.js";
import AccountId from "./AccountId.js";
import ContractId from "../contract/ContractId.js";
import AccountBalance from "./AccountBalance.js";
import type Channel from "../channel/Channel.js";
import type MirrorChannel from "../channel/MirrorChannel.js";
import type Client from "../client/Client.js";

/**
 * Get the balance of a Hedera™ crypto-currency account.
 *
 * This returns only the balance, so its a smaller and faster reply
 * than AccountInfoQuery.
 *
 * This query is free.
 */
export default class AccountBalanceQuery extends Query<AccountBalance> {
    private _accountId: AccountId | null;
    private _contractId: ContractId | null;

    constructor(
        props: {
            accountId?: AccountId | string;
            contractId?: ContractId | string;
        } = {},
    ) {
        super();

        this._accountId = null;
        this._contractId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }
    }

    /**
     * @internal
     */
    static _fromProtobuf(query: HieroProto.proto.IQuery): AccountBalanceQuery {
        const balance =
            query.cryptogetAccountBalance as HieroProto.proto.ICryptoGetAccountBalanceQuery;

        return new AccountBalanceQuery({
            accountId:
                balance.accountID != null
                    ? AccountId._fromProtobuf(balance.accountID)
                    : undefined,
            contractId:
                balance.contractID != null
                    ? ContractId._fromProtobuf(balance.contractID)
                    : undefined,
        });
    }

    get accountId(): AccountId | null {
        return this._accountId;
    }

    /**
     * Set the account ID for which the balance is being requested.
     *
     * This is mutually exclusive with `setContractId`.
     */
    setAccountId(accountId: AccountId | string): this {
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId.clone();

        return this;
    }

    get contractId(): ContractId | null {
        return this._contractId;
    }

    /**
     * Set the contract ID for which the balance is being requested.
     *
     * This is mutually exclusive with `setAccountId`.
     */
    setContractId(contractId: ContractId | string): this {
        this._contractId =
            typeof contractId === "string"
                ? ContractId.fromString(contractId)
                : contractId.clone();

        return this;
    }

    protected _isPaymentRequired(): boolean {
        return false;
    }

    _validateChecksums(client: Client<Channel, MirrorChannel>): void {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
        }

        if (this._contractId != null) {
            this._contractId.validateChecksum(client);
        }
    }

    /**
     * @internal
     */
    _execute(
        channel: Channel,
        request: HieroProto.proto.IQuery,
    ): Promise<HieroProto.proto.IResponse> {
        return channel.crypto.cryptoGetBalance(request);
    }

    /**
     * @internal
     */
    _mapResponseHeader(
        response: HieroProto.proto.IResponse,
    ): HieroProto.proto.IResponseHeader {
        const cryptogetAccountBalance =
            response.cryptogetAccountBalance as HieroProto.proto.ICryptoGetAccountBalanceResponse;
        return cryptogetAccountBalance.header as HieroProto.proto.IResponseHeader;
    }

    /**
     * @internal
     */
    _mapResponse(
        response: HieroProto.proto.IResponse,
    ): Promise<AccountBalance> {
        const cryptogetAccountBalance =
            response.cryptogetAccountBalance as HieroProto.proto.ICryptoGetAccountBalanceResponse;
        return Promise.resolve(
            AccountBalance._fromProtobuf(cryptogetAccountBalance),
        );
    }

    /**
     * @internal
     */
    _onMakeRequest(
        header: HieroProto.proto.IQueryHeader,
    ): HieroProto.proto.IQuery {
        return {
            cryptogetAccountBalance: {
                header,
                accountID:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
                contractID:
                    this._contractId != null
                        ? this._contractId._toProtobuf()
                        : null,
            },
        };
    }

    _getLogId(): string {
        return `AccountBalanceQuery:${this._timestamp.toString()}`;
    }
}

QUERY_REGISTRY.set(
    "cryptogetAccountBalance",
    AccountBalanceQuery._fromProtobuf.bind(null),
);
