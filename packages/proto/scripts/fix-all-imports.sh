#!/bin/bash

# Comprehensive script to fix all import path issues in proto files
# This script handles all the common import path problems generically

set -e

PROTO_DIR="src/proto"

echo "Fixing all import path issues..."

# Function to apply a fix pattern
apply_fix() {
    local pattern="$1"
    local replacement="$2"
    local description="$3"
    
    echo "  - $description"
    find "$PROTO_DIR" -name "*.proto" -type f | while read -r file; do
        # Use a temporary file to avoid sed issues
        temp_file="${file}.tmp"
        sed "s|$pattern|$replacement|g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
    done
}

# 1. Fix platform/event/* imports (files moved to services/)
echo "Fixing platform/event/* imports..."
apply_fix 'import "platform/event/\([^"]*\)\.proto";' 'import "services/\1.proto";' "platform/event/* -> services/*"

# 2. Fix relative imports in mirror and sdk directories
echo "Fixing relative imports in mirror and sdk directories..."
for dir in mirror sdk; do
    if [ -d "$PROTO_DIR/$dir" ]; then
        apply_fix 'import "\([^/]*\)\.proto";' 'import "services/\1.proto";' "relative imports in $dir/"
    fi
done

# 3. Fix type reference mismatches
echo "Fixing type reference mismatches..."

# Node-related type references
apply_fix 'services\.NodeCreateTransactionBody' 'com.hedera.hapi.node.addressbook.NodeCreateTransactionBody' "NodeCreateTransactionBody"
apply_fix 'services\.NodeUpdateTransactionBody' 'com.hedera.hapi.node.addressbook.NodeUpdateTransactionBody' "NodeUpdateTransactionBody"
apply_fix 'services\.NodeDeleteTransactionBody' 'com.hedera.hapi.node.addressbook.NodeDeleteTransactionBody' "NodeDeleteTransactionBody"

# Hints-related type references (only if not already prefixed)
apply_fix '^services\.auxiliary\.hints\.' 'com.hedera.hapi.services.auxiliary.hints.' "hints types (line start)"
apply_fix ' services\.auxiliary\.hints\.' ' com.hedera.hapi.services.auxiliary.hints.' "hints types (with space)"

echo "All import path issues fixed successfully!"
