import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const DEFAULT_CONSENSUS_NODE_VERSION = "v0.69.1";
export const DEFAULT_MIRROR_NODE_VERSION = "v0.145.2";
export const DEFAULT_NUM_NODES = 1;
export const DEFAULT_HBAR_AMOUNT = 10000000;

export const SOLO_CLUSTER_NAME = "solo-cluster";
export const SOLO_NAMESPACE = "solo";
export const SOLO_CLUSTER_SETUP_NAMESPACE = "solo-cluster-setup";
export const SOLO_DEPLOYMENT = "solo-deployment";

const __filename = fileURLToPath(import.meta.url);
export const SCRIPT_DIR = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
export const ENV_FILE = path.join(PROJECT_ROOT, ".env");
export const SOLO_DIR = path.join(os.homedir(), ".solo");
export const SOLO_LOCAL_CONFIG_PATH = path.join(SOLO_DIR, "local-config.yaml");

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const BLUE = "\x1b[0;34m";
const NC = "\x1b[0m";

export const log = {
    info(message) {
        console.log(`${BLUE}[INFO]${NC} ${message}`);
    },
    success(message) {
        console.log(`${GREEN}[SUCCESS]${NC} ${message}`);
    },
    error(message) {
        console.error(`${RED}[ERROR]${NC} ${message}`);
    },
    warning(message) {
        console.warn(`${YELLOW}[WARNING]${NC} ${message}`);
    },
};

export function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

function formatCommand(command, args) {
    return [command, ...args].join(" ");
}

export async function runCommand(command, args = [], options = {}) {
    const {
        cwd = PROJECT_ROOT,
        env = process.env,
        allowFailure = false,
        captureOutput = false,
        input = null,
    } = options;

    return await new Promise((resolve, reject) => {
        const stdio = captureOutput
            ? ["pipe", "pipe", "pipe"]
            : ["pipe", "inherit", "inherit"];

        const child = spawn(command, args, {
            cwd,
            env,
            stdio,
        });

        let stdout = "";
        let stderr = "";

        if (captureOutput) {
            child.stdout.setEncoding("utf8");
            child.stderr.setEncoding("utf8");

            child.stdout.on("data", (chunk) => {
                stdout += chunk;
            });

            child.stderr.on("data", (chunk) => {
                stderr += chunk;
            });
        }

        child.on("error", (error) => {
            if (allowFailure) {
                resolve({ code: 1, stdout, stderr, error });
                return;
            }

            reject(error);
        });

        if (input !== null) {
            child.stdin.write(input);
        }

        child.stdin.end();

        child.on("close", (code) => {
            const exitCode = code ?? 1;

            if (exitCode !== 0 && !allowFailure) {
                const error = new Error(
                    `Command failed (${exitCode}): ${formatCommand(
                        command,
                        args,
                    )}`,
                );

                if (captureOutput && stderr.trim().length > 0) {
                    error.message += `\n${stderr.trim()}`;
                }

                reject(error);
                return;
            }

            resolve({ code: exitCode, stdout, stderr });
        });
    });
}

export function spawnBackgroundCommand(command, args = [], options = {}) {
    const { cwd = PROJECT_ROOT, env = process.env } = options;

    const child = spawn(command, args, {
        cwd,
        env,
        detached: true,
        stdio: "ignore",
    });

    child.unref();
}

export function commandExists(command) {
    return spawnSync("which", [command], { stdio: "ignore" }).status === 0;
}

export async function fileExists(filePath) {
    try {
        await fs.access(filePath, fsConstants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function directoryExists(directoryPath) {
    try {
        const stats = await fs.stat(directoryPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

export async function readFileIfExists(filePath) {
    if (!(await fileExists(filePath))) {
        return "";
    }

    return await fs.readFile(filePath, "utf8");
}

export async function localConfigContains(text) {
    const content = await readFileIfExists(SOLO_LOCAL_CONFIG_PATH);
    return content.includes(text);
}

export async function clusterExists(clusterName = SOLO_CLUSTER_NAME) {
    const result = await runCommand("kind", ["get", "clusters"], {
        allowFailure: true,
        captureOutput: true,
    });

    if (result.code !== 0) {
        return false;
    }

    return result.stdout
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .includes(clusterName);
}

export async function soloInstalled() {
    const result = await runCommand("npx", ["solo", "--version"], {
        allowFailure: true,
        captureOutput: true,
    });

    return result.code === 0;
}

export function createNodeIdList(numNodes) {
    return Array.from(
        { length: numNodes },
        (_, index) => `node${index + 1}`,
    ).join(",");
}

export async function killPortForwardProcesses(namespace = SOLO_NAMESPACE) {
    const pattern = `kubectl port-forward.*${namespace}`;
    const running = await runCommand("pgrep", ["-f", pattern], {
        allowFailure: true,
        captureOutput: true,
    });

    if (running.code !== 0) {
        return false;
    }

    await runCommand("pkill", ["-f", pattern], { allowFailure: true });
    return true;
}

export async function setupPortForwarding({
    numNodes,
    namespace = SOLO_NAMESPACE,
    kubeContext = null,
    logger = log,
}) {
    logger.info("Setting up port forwarding...");
    const withContext = (kubectlArgs) =>
        kubeContext ? ["--context", kubeContext, ...kubectlArgs] : kubectlArgs;

    await killPortForwardProcesses(namespace);
    await sleep(2000);

    spawnBackgroundCommand(
        "kubectl",
        withContext([
            "port-forward",
            "svc/haproxy-node1-svc",
            "-n",
            namespace,
            "50211:50211",
        ]),
    );
    logger.info("  - Node 1 (consensus): localhost:50211");

    if (numNodes >= 2) {
        spawnBackgroundCommand(
            "kubectl",
            withContext([
                "port-forward",
                "svc/haproxy-node2-svc",
                "-n",
                namespace,
                "51211:50211",
            ]),
        );
        logger.info("  - Node 2 (consensus): localhost:51211");
    }

    spawnBackgroundCommand(
        "kubectl",
        withContext([
            "port-forward",
            "svc/mirror-1-rest",
            "-n",
            namespace,
            "5551:80",
        ]),
    );
    logger.info("  - Mirror REST API: localhost:5551");

    spawnBackgroundCommand(
        "kubectl",
        withContext([
            "port-forward",
            "svc/envoy-proxy-node1-svc",
            "-n",
            namespace,
            "8080:8080",
        ]),
    );
    logger.info("  - gRPC Web Proxy (node1): localhost:8080");

    const node2ProxyResult = await runCommand(
        "kubectl",
        withContext(["get", "svc", "envoy-proxy-node2-svc", "-n", namespace]),
        { allowFailure: true },
    );

    if (node2ProxyResult.code === 0) {
        spawnBackgroundCommand(
            "kubectl",
            withContext([
                "port-forward",
                "svc/envoy-proxy-node2-svc",
                "-n",
                namespace,
                "8081:8080",
            ]),
        );
        logger.info("  - gRPC Web Proxy (node2): localhost:8081");
    }

    spawnBackgroundCommand(
        "kubectl",
        withContext([
            "port-forward",
            "svc/mirror-1-web3",
            "-n",
            namespace,
            "8545:80",
        ]),
    );
    logger.info("  - Mirror Web3: localhost:8545");

    spawnBackgroundCommand(
        "kubectl",
        withContext([
            "port-forward",
            "svc/mirror-1-restjava",
            "-n",
            namespace,
            "8084:80",
        ]),
    );
    logger.info("  - Mirror REST Java: localhost:8084");

    spawnBackgroundCommand(
        "kubectl",
        withContext([
            "port-forward",
            "svc/mirror-1-grpc",
            "-n",
            namespace,
            "5600:5600",
        ]),
    );
    logger.info("  - Mirror gRPC: localhost:5600");

    await sleep(3000);
    logger.success("Port forwarding established");
}

async function listKindContainers({
    clusterName = SOLO_CLUSTER_NAME,
    all = false,
}) {
    if (!commandExists("docker")) {
        throw new Error(
            "docker is required to start/stop a Kind cluster. Please install Docker.",
        );
    }

    const args = all
        ? [
              "ps",
              "-a",
              "--format",
              "{{.Names}}",
              "--filter",
              `name=${clusterName}`,
          ]
        : ["ps", "--format", "{{.Names}}", "--filter", `name=${clusterName}`];

    const result = await runCommand("docker", args, {
        allowFailure: true,
        captureOutput: true,
    });

    if (result.code !== 0) {
        return [];
    }

    return result.stdout
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

export async function stopKindClusterContainers(
    clusterName = SOLO_CLUSTER_NAME,
) {
    const allContainers = await listKindContainers({
        clusterName,
        all: true,
    });

    if (allContainers.length === 0) {
        return {
            exists: false,
            changed: false,
            containers: [],
        };
    }

    const runningContainers = await listKindContainers({
        clusterName,
        all: false,
    });

    if (runningContainers.length === 0) {
        return {
            exists: true,
            changed: false,
            containers: [],
        };
    }

    await runCommand("docker", ["stop", ...runningContainers]);

    return {
        exists: true,
        changed: true,
        containers: runningContainers,
    };
}

export async function startKindClusterContainers(
    clusterName = SOLO_CLUSTER_NAME,
) {
    const allContainers = await listKindContainers({
        clusterName,
        all: true,
    });

    if (allContainers.length === 0) {
        return {
            exists: false,
            changed: false,
            containers: [],
        };
    }

    const runningContainers = await listKindContainers({
        clusterName,
        all: false,
    });
    const runningSet = new Set(runningContainers);
    const stoppedContainers = allContainers.filter(
        (container) => !runningSet.has(container),
    );

    if (stoppedContainers.length === 0) {
        return {
            exists: true,
            changed: false,
            containers: [],
        };
    }

    await runCommand("docker", ["start", ...stoppedContainers]);

    return {
        exists: true,
        changed: true,
        containers: stoppedContainers,
    };
}

export function extractAccountInfo(text) {
    const result = {};

    const accountIdMatch = text.match(
        /accountId[:\s]+([0-9]+\.[0-9]+\.[0-9]+)/iu,
    );
    if (accountIdMatch) {
        result.accountId = accountIdMatch[1];
    }

    const publicKeyMatch = text.match(/publicKey[:\s]+([0-9a-fA-F]{64,})/iu);
    if (publicKeyMatch) {
        result.publicKey = publicKeyMatch[1];
    }

    const aliasMatch = text.match(/alias[:\s]+([0-9a-fA-F]+)/iu);
    if (aliasMatch) {
        result.alias = aliasMatch[1];
    }

    if (!result.accountId) {
        const altIdMatch = text.match(/\b([0-9]+\.[0-9]+\.[0-9]{3,})\b/u);
        if (altIdMatch) {
            result.accountId = altIdMatch[1];
        }
    }

    if (!result.publicKey) {
        const altKeyMatch = text.match(/\b([0-9a-fA-F]{64,})\b/u);
        if (altKeyMatch) {
            result.publicKey = altKeyMatch[1];
        }
    }

    return result;
}

export async function createTestAccount({
    deployment = SOLO_DEPLOYMENT,
    namespace = SOLO_NAMESPACE,
    kubeContext = null,
    hbarAmount = DEFAULT_HBAR_AMOUNT,
    logger = log,
}) {
    logger.info("Creating ECDSA test account...");

    const outputFilePath = path.join(
        PROJECT_ROOT,
        "account_create_output_ecdsa.txt",
    );

    try {
        const createResult = await runCommand(
            "npx",
            [
                "solo",
                "ledger",
                "account",
                "create",
                "--generate-ecdsa-key",
                "--deployment",
                deployment,
                "--dev",
            ],
            { captureOutput: true },
        );

        await fs.writeFile(outputFilePath, createResult.stdout, "utf8");

        if (createResult.stdout.trim().length > 0) {
            process.stdout.write(createResult.stdout);
        }
        if (createResult.stderr.trim().length > 0) {
            process.stderr.write(createResult.stderr);
        }

        logger.info("Parsing account information...");
        const accountInfo = extractAccountInfo(createResult.stdout);

        if (!accountInfo.accountId) {
            throw new Error(
                "Failed to parse account information from Solo output",
            );
        }

        const accountId = accountInfo.accountId;
        const accountPublicKey = accountInfo.publicKey ?? "";

        logger.info(`Account ID: ${accountId}`);
        if (accountPublicKey) {
            logger.info(`Public Key: ${accountPublicKey}`);
        }

        logger.info("Retrieving private key from Kubernetes...");
        const secretResult = await runCommand(
            "kubectl",
            [
                ...(kubeContext ? ["--context", kubeContext] : []),
                "get",
                "secret",
                `account-key-${accountId}`,
                "-n",
                namespace,
                "-o",
                "jsonpath={.data.privateKey}",
            ],
            { captureOutput: true },
        );

        const encodedPrivateKey = secretResult.stdout.trim();
        const accountPrivateKey = Buffer.from(encodedPrivateKey, "base64")
            .toString("utf8")
            .trim();

        if (!accountPrivateKey) {
            throw new Error(
                `Failed to decode private key for account ${accountId}`,
            );
        }

        logger.info(`Funding account with ${hbarAmount} HBAR...`);
        await runCommand("npx", [
            "solo",
            "ledger",
            "account",
            "update",
            "--account-id",
            accountId,
            "--hbar-amount",
            String(hbarAmount),
            "--deployment",
            deployment,
            "--dev",
        ]);

        logger.success("Test account created and funded");

        return {
            accountId,
            accountPublicKey,
            accountPrivateKey,
        };
    } finally {
        await fs.rm(outputFilePath, { force: true });
    }
}

export async function generateEnvFile({
    envFilePath = ENV_FILE,
    operatorId,
    operatorKey,
    logger = log,
}) {
    logger.info("Generating .env file...");

    if (await fileExists(envFilePath)) {
        logger.warning(".env file already exists, backing up to .env.backup");
        await fs.copyFile(envFilePath, `${envFilePath}.backup`);
    }

    const genesisOperatorId = "0.0.2";
    const genesisOperatorKey =
        "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137";

    const content = `# Hiero SDK JS - Local Development Environment Configuration
# Generated on ${new Date().toString()}

# Network Configuration
HEDERA_NETWORK=local-node
CONFIG_FILE=

# Standard Test Account (ECDSA) - Use this for most integration tests
OPERATOR_ID=${operatorId}
OPERATOR_KEY=${operatorKey}

# Genesis Account - Only use for genesis-specific tests
GENESIS_OPERATOR_ID=${genesisOperatorId}
GENESIS_OPERATOR_KEY=${genesisOperatorKey}

# Node Endpoints
NODE1_ENDPOINT=127.0.0.1:50211
NODE2_ENDPOINT=127.0.0.1:51211

# Mirror Node Endpoints
MIRROR_REST_ENDPOINT=http://localhost:5551
MIRROR_WEB3_ENDPOINT=http://localhost:8545
MIRROR_GRPC_ENDPOINT=localhost:5600
`;

    await fs.writeFile(envFilePath, content, "utf8");
    logger.success(`.env file created at ${envFilePath}`);
}

export function validateNumNodes(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("--num-nodes must be a positive integer");
    }
    return parsed;
}
