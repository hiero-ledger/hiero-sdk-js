import { sdk } from "./sdk_data";
import { RpcMethodParams } from "./params/sdk";

/**
 * Very primitive catch-all mapping prototype with session support
 * @returns {Promise<*>}
 * @param {Input} input - Input parameters including optional sessionId
 */
export default async function mapMethods({
    callClass,
    methods,
    sessionId,
}: RpcMethodParams & { sessionId?: string }): Promise<string> {
    const cl: any = (await import("@hashgraph/sdk"))[callClass];

    let currentObject: any = new cl();
    for (let { name, param } of methods) {
        if (param === "client") {
            param = sdk.getClient(sessionId);
        }

        if (typeof currentObject[name] === "function") {
            currentObject = await currentObject[name](param);
        } else if (typeof cl[name] === "function") {
            currentObject = await cl[name](param);
        } else if (typeof currentObject[name] === "object") {
            currentObject = await currentObject[name];
        } else {
            throw Error(`${callClass}.${name}() isn't a function`);
        }
    }
    return currentObject;
}
