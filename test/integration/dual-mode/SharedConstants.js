// Must match the namespace in hiero-solo-action (build.yml dab-tests job).
export const SOLO_NAMESPACE = "solo";

/**
 * Mirror address-book refresh returns in-cluster DNS. Remap by account ID to the
 * localhost port-forwards from hiero-solo-action so INVALID_NODE_ACCOUNT retries
 * keep working on the CI runner.
 *
 * @param {import("../../../src/client/Client.js").default} client
 * @param {Record<string, string>} localNetwork
 */
export function patchClientNetworkRemap(client, localNetwork) {
    const localPortByAccountId = new Map(
        Object.entries(localNetwork).map(([addr, id]) => [String(id), addr]),
    );
    const node2LocalAddress = Object.keys(localNetwork).at(-1);
    const originalUpdateNetwork = client.updateNetwork.bind(client);

    client.updateNetwork = async function updateNetworkWithLocalRemap() {
        await originalUpdateNetwork();

        const mirrorNetworkState = client.network;
        if (Object.keys(mirrorNetworkState).length === 0) {
            return client;
        }

        /** @type {Record<string, string | import("../../../src/account/AccountId.js").default>} */
        const remapped = {};

        for (const [, accountId] of Object.entries(mirrorNetworkState)) {
            const localAddr =
                localPortByAccountId.get(accountId.toString()) ??
                node2LocalAddress;
            remapped[localAddr] = accountId;
        }

        client.setNetwork(remapped);
        return client;
    };
}
