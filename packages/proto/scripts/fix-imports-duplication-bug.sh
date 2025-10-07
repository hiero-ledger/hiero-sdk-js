#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# PROTO DUPLICATE REMOVAL SCRIPT
# =============================================================================
# 
# PROBLEM: This script fixes duplicate proto files that cause compilation errors
# like "duplicate name 'EventCore' in Namespace .com.hedera.hapi.platform.event"
#
# ROOT CAUSE: The proto flattening process in Taskfile.yml creates multiple
# copies of the same files with different prefixes:
#
# 1. Original source: platform/event/event_core.proto
# 2. After move: services/event_core.proto (Taskfile.yml line 43 moves platform/event/* to services/)
# 3. After flatten: 
#    - services_event_core.proto (from services/event_core.proto)
#    - platform_event_event_core.proto (from platform/event/event_core.proto)
#    - event_core.proto (from root level, if it exists)
#
# The flattening script (flatten-protos.sh) replaces path separators with underscores:
# - services/event/event_descriptor.proto → services_event_event_descriptor.proto
# - platform/event/event_core.proto → platform_event_event_core.proto
#
# This creates files with duplicate "event_" segments and multiple copies of the
# same message definitions in the same namespace, causing protobuf compilation errors.
#
# SOLUTION: Remove duplicate files, keeping only the services_* versions since
# they represent the canonical location after the move operation.
# =============================================================================


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Go up one level to get the proto package root
PROTO_PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"
# Set the proto files directory
ROOT="$PROTO_PACKAGE_ROOT/src/proto"

echo "Removing duplicate proto files..."

# Remove auxiliary_* files if a services_* counterpart exists
shopt -s nullglob
for aux in "$ROOT"/auxiliary_*.proto; do
  base="$(basename "$aux")"
  tail="${base#auxiliary_}"
  svc="$ROOT/services_$tail"

  if [[ -f "$svc" ]]; then
    echo "Removing duplicate: $aux (services version exists: $(basename "$svc"))"
    rm -f "$aux"
  fi
done

# Remove platform_event_event_* files if services_event_* counterpart exists
for platform in "$ROOT"/platform_event_event_*.proto; do
  base="$(basename "$platform")"
  tail="${base#platform_event_event_}"
  svc="$ROOT/services_event_$tail"

  if [[ -f "$svc" ]]; then
    echo "Removing duplicate: $platform (services version exists: $(basename "$svc"))"
    rm -f "$platform"
  fi
done

# Remove root-level event_* files if services_event_* counterpart exists
for event in "$ROOT"/event_*.proto; do
  base="$(basename "$event")"
  svc="$ROOT/services_$base"

  if [[ -f "$svc" ]]; then
    echo "Removing duplicate: $event (services version exists: $(basename "$svc"))"
    rm -f "$event"
  fi
done

# Remove root-level gossip_event.proto if services_gossip_event.proto exists
if [[ -f "$ROOT/gossip_event.proto" && -f "$ROOT/services_gossip_event.proto" ]]; then
    echo "Removing duplicate: gossip_event.proto (services version exists: services_gossip_event.proto)"
    rm -f "$ROOT/gossip_event.proto"
fi

shopt -u nullglob

# Show remaining definitions for sanity
echo
echo "Remaining definitions of GossipEvent:"
grep -rn "message[[:space:]]\+GossipEvent\b" "$ROOT" || true

echo
echo "Done."