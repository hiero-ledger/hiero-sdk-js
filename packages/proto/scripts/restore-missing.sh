#!/bin/bash

# Simple script to restore missing proto files from git history

set -e

PROTO_DIR="src/proto"

echo "Restoring missing proto files..."

# Create necessary directories
mkdir -p "$PROTO_DIR/sdk" "$PROTO_DIR/mirror"

# Restore files from git history (only if they don't exist locally)
echo "  - Restoring sdk files..."
git checkout HEAD -- src/proto/sdk/transaction_list.proto 2>/dev/null || echo "    transaction_list.proto not found in HEAD"

echo "  - Restoring mirror files..."
git checkout HEAD -- src/proto/mirror/consensus_service.proto 2>/dev/null || echo "    consensus_service.proto not found in HEAD"
git checkout HEAD -- src/proto/mirror/mirror_network_service.proto 2>/dev/null || echo "    mirror_network_service.proto not found in HEAD"

echo "Missing files restored successfully!"
