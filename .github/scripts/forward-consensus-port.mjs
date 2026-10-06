#!/usr/bin/env node
/**
 * Connects the local consensus node port(s) straight to the node instead of
 * through the chain the Solo action sets up (`kubectl port-forward` to
 * `haproxy-nodeN-svc`, then haproxy to the node).
 *
 * Why: in the hung Build & Test runs the Node suite's path to the node
 * (127.0.0.1:50211 -> kubectl port-forward -> haproxy -> node) stopped
 * answering a minute or two into the run while the browser suite's path
 * (envoy -> the same node) kept working, and a 10 s ping through the stalled
 * path ended in DEADLINE_EXCEEDED: connections were accepted but never
 * answered. `network-nodeN-svc` is a NodePort service, so the runner can
 * reach the node's gRPC port on the kind node's own address with no proxy and
 * no port-forward in between.
 *
 * For each consensus node the first mode that works wins:
 *   1. direct:  a TCP relay run by this script, 127.0.0.1:<port> -> <kind node IP>:<NodePort>
 *   2. forward: `kubectl port-forward svc/network-nodeN-svc <port>:50211` (no haproxy),
 *      supervised: kubectl exits with "lost connection to pod" after a single
 *      refused connection, so it is restarted whenever it exits
 *   3. haproxy: the Solo action's forward is kept (or restarted, supervised) and a warning is printed
 *
 * Usage:
 *   node forward-consensus-port.mjs
 *       set the ports up (run right after the Solo action, before the tests)
 *   node forward-consensus-port.mjs relay <listenHost> <listenPort> <targetHost> <targetPort>
 *       the relay process (started by the first form, detached)
 *   node forward-consensus-port.mjs supervise <command> [args...]
 *       runs the command and restarts it whenever it exits (started by the first form, detached)
 *
 * Environment:
 *   SOLO_NAMESPACE     Solo namespace, default "solo"
 *   CONSENSUS_PORTS    comma separated local ports, default "50211" plus
 *                      "36211" when network-node2-svc exists (dual mode)
 *   FORWARD_LOG_DIR    where the relay / port-forward logs go, default
 *                      $RUNNER_TEMP/consensus-port-forward
 */

import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, openSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const NAMESPACE = process.env.SOLO_NAMESPACE || "solo";
const NODE_GRPC_PORT = 50211;
/** Local port -> the Solo services behind it. The action hardcodes 36211 for node 2. */
const NODES = {
    50211: { service: "network-node1-svc", haproxy: "haproxy-node1-svc" },
    36211: { service: "network-node2-svc", haproxy: "haproxy-node2-svc" },
};
const CONNECT_TIMEOUT_MS = 3000;
const SETTLE_TIMEOUT_MS = 10000;

const log = (...parts) => console.log(new Date().toISOString(), ...parts);

function sh(file, args, { allowFailure = false } = {}) {
    try {
        return execFileSync(file, args, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
        }).trim();
    } catch (error) {
        if (allowFailure) {
            return null;
        }
        throw new Error(
            `${file} ${args.join(" ")} failed: ${(
                error.stderr ||
                error.message ||
                ""
            )
                .toString()
                .trim()}`,
        );
    }
}

/** Resolves to true when a TCP connection to host:port is accepted in time. */
function canConnect(host, port, timeoutMs = CONNECT_TIMEOUT_MS) {
    return new Promise((resolve) => {
        const socket = net.connect({ host, port });
        const done = (result) => {
            socket.destroy();
            resolve(result);
        };
        socket.setTimeout(timeoutMs, () => done(false));
        socket.once("connect", () => done(true));
        socket.once("error", () => done(false));
    });
}

async function waitFor(check, timeoutMs, intervalMs = 250) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await check()) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return false;
}

function kindNodeAddress() {
    const output = sh("kubectl", [
        "get",
        "nodes",
        "-o",
        'jsonpath={.items[0].status.addresses[?(@.type=="InternalIP")].address}',
    ]);
    return output.split(/\s+/)[0] || null;
}

function nodePortOf(service) {
    const raw = sh(
        "kubectl",
        ["get", "svc", "-n", NAMESPACE, service, "-o", "json"],
        { allowFailure: true },
    );
    if (raw == null) {
        return null;
    }
    const svc = JSON.parse(raw);
    const port = (svc.spec?.ports || []).find((p) => p.port === NODE_GRPC_PORT);
    return port?.nodePort ?? null;
}

function serviceExists(service) {
    return (
        sh("kubectl", ["get", "svc", "-n", NAMESPACE, service], {
            allowFailure: true,
        }) != null
    );
}

/** Stops the Solo action's `kubectl port-forward svc/<haproxy> -n <ns> <port>:50211`. */
function stopHaproxyForward(localPort, haproxyService) {
    const pattern = `kubectl port-forward svc/${haproxyService} -n ${NAMESPACE} ${localPort}:${NODE_GRPC_PORT}`;
    sh("pkill", ["-f", pattern], { allowFailure: true });
    return pattern;
}

function startDetached(logFile, file, args) {
    const fd = openSync(logFile, "a");
    const child = spawn(file, args, {
        detached: true,
        stdio: ["ignore", fd, fd],
    });
    child.unref();
    return child.pid;
}

async function setupPort(localPort, logDir) {
    const { service, haproxy } = NODES[localPort];
    const logFile = path.join(logDir, `${localPort}.log`);
    const nodePort = nodePortOf(service);
    const address = kindNodeAddress();
    const direct =
        nodePort != null &&
        address != null &&
        (await canConnect(address, nodePort));
    log(
        `${localPort}: ${service} NodePort ${nodePort ?? "none"} on ${
            address ?? "unknown"
        } is ${direct ? "reachable" : "not reachable"} from the runner`,
    );

    const haproxyPattern = stopHaproxyForward(localPort, haproxy);
    const freed = await waitFor(
        async () => !(await canConnect("127.0.0.1", localPort, 500)),
        SETTLE_TIMEOUT_MS,
    );
    if (!freed) {
        log(
            `${localPort}: still listening after stopping "${haproxyPattern}", leaving it alone`,
        );
        return "haproxy";
    }

    if (direct) {
        const pid = startDetached(logFile, process.execPath, [
            fileURLToPath(import.meta.url),
            "relay",
            "127.0.0.1",
            String(localPort),
            address,
            String(nodePort),
        ]);
        if (
            await waitFor(
                () => canConnect("127.0.0.1", localPort),
                SETTLE_TIMEOUT_MS,
            )
        ) {
            log(
                `${localPort}: direct relay (pid ${pid}) to ${address}:${nodePort}, log ${logFile}`,
            );
            return "direct";
        }
        log(
            `${localPort}: the relay did not come up, falling back to a port-forward`,
        );
        sh("kill", [String(pid)], { allowFailure: true });
    }

    const forwardArgs = (target) => [
        fileURLToPath(import.meta.url),
        "supervise",
        "kubectl",
        "port-forward",
        `svc/${target}`,
        "-n",
        NAMESPACE,
        `${localPort}:${NODE_GRPC_PORT}`,
    ];
    const pid = startDetached(logFile, process.execPath, forwardArgs(service));
    if (
        await waitFor(
            () => canConnect("127.0.0.1", localPort),
            SETTLE_TIMEOUT_MS,
        )
    ) {
        log(
            `${localPort}: supervised kubectl port-forward (pid ${pid}) to svc/${service}, log ${logFile}`,
        );
        return "forward";
    }
    log(
        `${localPort}: the port-forward to svc/${service} did not come up, restoring the haproxy forward`,
    );
    sh("kill", [String(pid)], { allowFailure: true });
    startDetached(logFile, process.execPath, forwardArgs(haproxy));
    await waitFor(() => canConnect("127.0.0.1", localPort), SETTLE_TIMEOUT_MS);
    return "haproxy";
}

async function main() {
    const logDir =
        process.env.FORWARD_LOG_DIR ||
        path.join(
            process.env.RUNNER_TEMP || os.tmpdir(),
            "consensus-port-forward",
        );
    mkdirSync(logDir, { recursive: true });

    const ports = (process.env.CONSENSUS_PORTS || "")
        .split(",")
        .map((p) => Number(p.trim()))
        .filter((p) => NODES[p] != null);
    if (ports.length === 0) {
        ports.push(50211);
        if (serviceExists(NODES[36211].service)) {
            ports.push(36211);
        }
    }

    const modes = {};
    for (const port of ports) {
        modes[port] = await setupPort(port, logDir);
    }
    const summary = Object.entries(modes)
        .map(([port, mode]) => `${port}: ${mode}`)
        .join(", ");
    if (Object.values(modes).every((mode) => mode === "haproxy")) {
        console.log(
            `::warning::consensus node ports still go through the haproxy forward (${summary})`,
        );
    } else {
        console.log(`::notice::consensus node ports: ${summary}`);
    }
}

/** A plain TCP relay; one upstream connection per accepted connection. */
function relay(listenHost, listenPort, targetHost, targetPort) {
    let open = 0;
    let total = 0;
    let errors = 0;
    const server = net.createServer({ noDelay: true }, (client) => {
        total += 1;
        open += 1;
        const upstream = net.connect({
            host: targetHost,
            port: targetPort,
            noDelay: true,
        });
        const drop = (side) => (error) => {
            errors += 1;
            log(`${side} ${error.code || error.message}`);
            client.destroy();
            upstream.destroy();
        };
        client.on("error", drop("client"));
        upstream.on("error", drop("upstream"));
        client.on("close", () => {
            open -= 1;
            upstream.destroy();
        });
        upstream.on("close", () => client.destroy());
        client.pipe(upstream);
        upstream.pipe(client);
    });
    server.on("error", (error) => {
        log(`listen failed: ${error.code || error.message}`);
        process.exit(1);
    });
    server.listen(listenPort, listenHost, () =>
        log(
            `relaying ${listenHost}:${listenPort} -> ${targetHost}:${targetPort}`,
        ),
    );
    setInterval(
        () => log(`connections: open=${open} total=${total} errors=${errors}`),
        60000,
    ).unref();
    for (const signal of ["SIGINT", "SIGTERM"]) {
        process.on(signal, () => {
            log(`${signal}: total=${total} errors=${errors}`);
            process.exit(0);
        });
    }
}

/** Runs a command and restarts it whenever it exits, until this process is told to stop. */
function supervise(file, args) {
    let stopping = false;
    let restarts = 0;
    let child = null;
    const start = () => {
        child = spawn(file, args, { stdio: "inherit" });
        child.on("exit", (code, signal) => {
            if (stopping) {
                return;
            }
            restarts += 1;
            const delayMs = Math.min(1000 * restarts, 5000);
            log(
                `${file} exited (${
                    signal || code
                }), restart ${restarts} in ${delayMs} ms`,
            );
            setTimeout(start, delayMs);
        });
    };
    for (const sig of ["SIGINT", "SIGTERM"]) {
        process.on(sig, () => {
            stopping = true;
            child?.kill("SIGTERM");
            log(`${sig}: stopped after ${restarts} restarts`);
            process.exit(0);
        });
    }
    log(`supervising: ${file} ${args.join(" ")}`);
    start();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    if (process.argv[2] === "supervise") {
        supervise(process.argv[3], process.argv.slice(4));
    } else if (process.argv[2] === "relay") {
        const [listenHost, listenPort, targetHost, targetPort] =
            process.argv.slice(3);
        relay(listenHost, Number(listenPort), targetHost, Number(targetPort));
    } else {
        main().catch((error) => {
            console.log(`::warning::forward-consensus-port: ${error.message}`);
            process.exit(0);
        });
    }
}
