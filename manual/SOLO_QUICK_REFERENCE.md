# Solo Quick Reference

> Solo is supported on macOS/Linux (Windows via WSL2).
> RAM: 12 GB minimum (single node), 24 GB recommended for dual-node DAB tests.

```bash
npm install -g @hashgraph/solo@latest
```

Use the global `solo` CLI for all commands in this guide.

## Core Commands

```bash
# Initial provisioning + service deployment (cluster, consensus, mirror, account, port-forward)
task solo:setup

# Resume from paused state (start cluster + consensus, redeploy mirror, re-enable port-forward)
task solo:resume

# Pause environment (destroy mirror, stop consensus node(s), stop cluster, remove port-forward)
task solo:pause

# Full cleanup (remove cluster and Solo state)
task solo:teardown

# Health/logs
task solo:status
task solo:logs
```

## Setup Arguments (setup only)

`solo:setup` is the only lifecycle command that takes version/build arguments.

```bash
# Dual-node setup
task solo:setup -- --num-nodes 2

# Custom images
task solo:setup -- --consensus-node-version v0.70.1 --mirror-node-version v0.146.0

# Local consensus build (overrides consensus version)
task solo:setup -- --local-build-path ../hiero-consensus-node/hedera-node/data
```

Expected timing:

-   `solo:setup`: ~10 minutes on first run (image pulls + deployment)
-   `solo:resume`: ~4 minutes

## Daily Workflow

```bash
# One-time (or after teardown)
task install
npm install -g @hashgraph/solo@latest
task solo:setup

# During development
task test:integration

# End of day
task solo:pause

# Next session
task solo:resume
```

## Dynamic Address Book (Dual Node)

```bash
task solo:setup -- --num-nodes 2

echo "127.0.0.1 network-node1-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 envoy-proxy-node1-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 network-node2-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 envoy-proxy-node2-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
```

## Quick Troubleshooting

```bash
# Check status
task solo:status
kubectl get pods -n solo

# Restart flow
task solo:pause
task solo:resume

# Full reset
task solo:teardown
task solo:setup
```
