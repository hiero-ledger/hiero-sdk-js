import { Client as GrpcClient } from "@grpc/grpc-js";
import { vi } from "vitest";
import NodeChannel from "../../../src/channel/NodeChannel.js";
import Mocker from "../Mocker.js";
import { CLPR_RPC_CASES } from "../utils/ClprTransport.js";

describe("CLPR NodeChannel transport", function () {
    it.each(CLPR_RPC_CASES)(
        "routes $method through ClprService and decodes the response",
        async function ({
            method,
            requestType,
            responseType,
            request,
            response,
        }) {
            const unaryRequests = vi.spyOn(
                GrpcClient.prototype,
                "makeUnaryRequest",
            );
            let mock;
            let channel;

            try {
                mock = await Mocker.withResponses([
                    [
                        {
                            call: (received) => {
                                expect(
                                    requestType.encode(received).finish(),
                                ).to.deep.equal(
                                    requestType.encode(request).finish(),
                                );
                                return response;
                            },
                        },
                    ],
                ]);

                const address = Object.keys(mock.client.network)[0].replace(
                    "0.0.0.0:",
                    "127.0.0.1:",
                );
                channel = new NodeChannel(address, 5000);
                const service = channel.clpr;
                const result = await service[method](request);

                expect(unaryRequests).toHaveBeenCalledTimes(1);
                expect(unaryRequests.mock.calls[0][0]).to.equal(
                    `/proto.ClprService/${method}`,
                );
                expect(result).to.be.instanceOf(responseType);
                expect(responseType.encode(result).finish()).to.deep.equal(
                    responseType.encode(response).finish(),
                );
                expect(channel.clpr).to.equal(service);
            } finally {
                channel?.close();
                mock?.client.close();
                mock?.servers.close();
                unaryRequests.mockRestore();
            }
        },
    );
});
