import { readdirSync, readFileSync } from "node:fs";

const PROTO_DIR = new URL(
    "../../../packages/proto/src/proto/",
    import.meta.url,
);

describe("CLPR proto snapshot", function () {
    it.each([
        [
            "services_",
            [
                "clpr_close_channel.proto",
                "clpr_complete_channel.proto",
                "clpr_complete_connector.proto",
                "clpr_deregister_connector.proto",
                "clpr_get_endpoint_manifest.proto",
                "clpr_get_ledger_configuration.proto",
                "clpr_register_channel.proto",
                "clpr_register_connector.proto",
                "clpr_service.proto",
                "clpr_submit_bundle.proto",
                "clpr_update_ledger_configuration.proto",
            ],
        ],
        [
            "services_state_clpr_",
            [
                "clpr_bundle_content.proto",
                "clpr_channel.proto",
                "clpr_connector.proto",
                "clpr_endpoint_manifest.proto",
                "clpr_endpoint_manifest_construction.proto",
                "clpr_ledger_configuration.proto",
                "clpr_message.proto",
                "clpr_peer_endpoints.proto",
                "clpr_qbft_ledger_configuration_payload.proto",
                "clpr_sei_ledger_configuration_payload.proto",
            ],
        ],
        [
            "services_auxiliary_clpr_",
            ["clpr_endpoint_publication.proto", "clpr_maintenance.proto"],
        ],
    ])(
        "includes the flattened %s CLPR schemas and their imports",
        function (prefix, names) {
            const expected = names.map((name) => `${prefix}${name}`).sort();
            const files = readdirSync(PROTO_DIR);

            expect(
                files
                    .filter((name) => name.startsWith(`${prefix}clpr_`))
                    .sort(),
            ).to.deep.equal(expected);

            for (const name of expected) {
                const schema = readFileSync(new URL(name, PROTO_DIR), "utf8");
                for (const [, dependency] of schema.matchAll(
                    /import "([^"]+)";/g,
                )) {
                    if (!dependency.startsWith("google/")) {
                        expect(dependency).not.to.include("/");
                        expect(files).to.include(dependency);
                    }
                }
            }
        },
    );
});
