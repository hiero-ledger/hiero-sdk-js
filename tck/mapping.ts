import { sdk } from "./sdk_data";
import { RpcMethodParams } from "./params/sdk";

/**
 * Very primitive catch-all mapping prototype
 * @returns {Promise<*>}
 * @param {Input} input
 */
export default async function mapMethods({
    callClass,
    methods,
}: RpcMethodParams): Promise<string> {
    const cl: any = (await import("@hiero-ledger/sdk"))[callClass];

    let currentObject: any = new cl();
    for (let { name, param } of methods) {
        if (param === "client") {
            param = sdk.getClient();
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
