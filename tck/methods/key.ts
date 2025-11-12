import { PrivateKey, KeyList } from "@hiero-ledger/sdk";

import { invalidParamError } from "../utils/invalid-param-error";
import {
    getKeyFromString,
    convertToKeyListHex,
    getEvmAddressFromKey,
    getKeyPairFromParams,
} from "../utils/key";
import { AccountKey } from "../utils/enums/account-key";

import { KeyGenerationParams } from "../params/key";
import { KeyGenerationResponse } from "../response/key";

export const generateKey = (
    params: KeyGenerationParams,
): KeyGenerationResponse => {
    const isValidFromKeyType =
        params.fromKey &&
        ![
            AccountKey.ED25519_PUBLIC_KEY,
            AccountKey.ECDSA_SECP256K1_PUBLIC_KEY,
            AccountKey.EVM_ADDRESS,
        ].includes(params.type as AccountKey);

    if (isValidFromKeyType) {
        return invalidParamError<KeyGenerationResponse>(
            "fromKey should only be provided for specific public key types or EVM address",
        );
    }

    const isValidThresholdParam =
        params.threshold && params.type !== AccountKey.THRESHOLD_KEY;

    if (isValidThresholdParam) {
        return invalidParamError<KeyGenerationResponse>(
            "threshold should only be provided for thresholdKey types",
        );
    }

    const isValidKeysParam =
        params.keys &&
        ![AccountKey.KEY_LIST, AccountKey.THRESHOLD_KEY].includes(
            params.type as AccountKey,
        );

    if (isValidKeysParam) {
        return invalidParamError<KeyGenerationResponse>(
            "keys should only be provided for keyList or thresholdKey types",
        );
    }

    const isValidThresholdKeysParam =
        (params.type === AccountKey.THRESHOLD_KEY ||
            params.type === AccountKey.KEY_LIST) &&
        !params.keys;

    if (isValidThresholdKeysParam) {
        return invalidParamError<KeyGenerationResponse>(
            "keys list is required for generating a KeyList type",
        );
    }

    const isValidThresholdParamForThresholdKey =
        params.type === AccountKey.THRESHOLD_KEY && params.threshold === 0;

    if (isValidThresholdParamForThresholdKey) {
        return invalidParamError<KeyGenerationResponse>(
            "threshold is required for generating a ThresholdKey type",
        );
    }

    const response: KeyGenerationResponse = {
        key: "",
        privateKeys: [],
    };

    try {
        const { key, privateKeys } = processKeyRecursively(
            params,
            response,
            false,
        );

        response.key = key;
        response.privateKeys = privateKeys;
    } catch (error) {
        return invalidParamError<KeyGenerationResponse>(error.message);
    }

    return response;
};

const handleED25519PrivateKey = (
    response: KeyGenerationResponse,
    params?: KeyGenerationParams,
    isList?: boolean,
) => {
    const ed25519PrivateKey = PrivateKey.generateED25519();
    if (isList) response.privateKeys.push(ed25519PrivateKey.toStringDer());
    return {
        key: ed25519PrivateKey.toStringDer(),
        privateKeys: response.privateKeys,
    };
};

const handleECDSA_SECP256K1PrivateKey = (
    response: KeyGenerationResponse,
    params?: KeyGenerationParams,
    isList?: boolean,
) => {
    const ecdsaPrivateKey = PrivateKey.generateECDSA();
    if (isList) response.privateKeys.push(ecdsaPrivateKey.toStringDer());
    return {
        key: ecdsaPrivateKey.toStringDer(),
        privateKeys: response.privateKeys,
    };
};

const handleEd25519andEcdsaPublicKey = (
    response: KeyGenerationResponse,
    params?: KeyGenerationParams,
    isList?: boolean,
): KeyGenerationResponse => {
    const { privateKey, publicKey } = getKeyPairFromParams(params);

    const privateKeyDer = privateKey.toStringDer();
    const publicKeyDer = publicKey.toStringDer();

    if (isList) {
        response.privateKeys.push(privateKeyDer);
    }

    return { key: publicKeyDer, privateKeys: response.privateKeys };
};

const handleKeyList = (
    response: KeyGenerationResponse,
    params?: KeyGenerationParams,
) => {
    const keyList = new KeyList();

    for (const keyParam of params.keys!) {
        const { key: keyStr } = processKeyRecursively(keyParam, response, true);
        const key = getKeyFromString(keyStr);
        if (key) {
            keyList.push(key);
        }
    }
    if (params.type === AccountKey.THRESHOLD_KEY) {
        keyList.setThreshold(params.threshold!);
    }

    return {
        key: convertToKeyListHex(keyList) || "",
        privateKeys: response.privateKeys,
    };
};

const handleEvmAddress = (
    response: KeyGenerationResponse,
    params?: KeyGenerationParams,
    isList?: boolean,
): KeyGenerationResponse => {
    if (params.fromKey) {
        return getEvmAddressFromKey(params.fromKey, response);
    }

    // Generate new EVM address if fromKey is not provided
    const privateKey = PrivateKey.generateECDSA();
    return {
        key: privateKey.publicKey.toEvmAddress(),
        privateKeys: [privateKey.toStringDer()],
    };
};

const keyHandlers: {
    [key: string]: (
        response: KeyGenerationResponse,
        params?: KeyGenerationParams,
        isList?: boolean,
    ) => KeyGenerationResponse;
} = {
    [AccountKey.ED25519_PRIVATE_KEY]: handleED25519PrivateKey,
    [AccountKey.ECDSA_SECP256K1_PRIVATE_KEY]: handleECDSA_SECP256K1PrivateKey,
    [AccountKey.ED25519_PUBLIC_KEY]: handleEd25519andEcdsaPublicKey,
    [AccountKey.ECDSA_SECP256K1_PUBLIC_KEY]: handleEd25519andEcdsaPublicKey,
    [AccountKey.KEY_LIST]: handleKeyList,
    [AccountKey.THRESHOLD_KEY]: handleKeyList,
    [AccountKey.EVM_ADDRESS]: handleEvmAddress,
};

const processKeyRecursively = (
    params: KeyGenerationParams,
    response: KeyGenerationResponse,
    isList: boolean,
): KeyGenerationResponse => {
    const handleKey = keyHandlers[params.type];

    if (handleKey) {
        return handleKey(response, params, isList);
    } else {
        return invalidParamError<KeyGenerationResponse>(
            "key type not recognized",
        );
    }
};
