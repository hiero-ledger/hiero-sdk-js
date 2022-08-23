import { Injectable, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import {
    AccountId,
    PrivateKey,
    Wallet,
    LocalProvider,
    PrecheckStatusError,
    Transaction,
} from "@hashgraph/sdk";
import { Executable } from "../../../../lib/LocalProvider";

@Injectable()
export class WalletService {
    public wallet: Wallet;

    constructor() {
        this.wallet = new Wallet(
            AccountId.fromString(process.env.OPERATOR_ID),
            PrivateKey.fromString(process.env.OPERATOR_KEY),
            new LocalProvider(),
        );
    }

    async call<RequestT, ResponseT, OutputT>(
        res: Response,
        request: Executable<RequestT, ResponseT, OutputT>,
    ): Promise<void> {
        try {
            // Sign the request if necessary
            if (request instanceof Transaction) {
                request = await this.wallet.signTransaction(request);
            }
            const response = await this.wallet.call(request);

            // TODO: We should not be calling private methods
            const serialized = request._serializeResponse(response);
            const hex = Buffer.from(serialized).toString("hex");
            res.status(HttpStatus.OK).send({ response: hex });
        } catch (error) {
            if (error instanceof PrecheckStatusError) {
                res.status(HttpStatus.BAD_REQUEST).send({
                    error: error.toJSON(),
                })
            } else {
                res.status(HttpStatus.BAD_REQUEST).send({
                    error: error.toString(),
                });
            }
        }
    }
}
