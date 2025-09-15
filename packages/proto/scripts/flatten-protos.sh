#!/bin/bash

# Script to flatten all proto files to src/proto/ and fix import paths
# Moves all .proto files to the root of src/proto/ and updates import paths to current directory

set -e

PROTO_DIR="src/proto"
TEMP_DIR="src/proto_temp"

echo "Flattening proto directory structure..."

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Check if files are already flattened (no subdirectories exist)
if [ $(find "$PROTO_DIR" -mindepth 2 -name "*.proto" -type f | wc -l) -eq 0 ]; then
    echo "  - Files are already flattened, skipping flattening process"
    exit 0
fi

# Find all proto files recursively and copy them to temp directory
echo "  - Collecting all proto files..."

# First, copy all files from subdirectories (mindepth 2) with prefixed names
find "$PROTO_DIR" -mindepth 2 -name "*.proto" -type f | while read -r file; do
    relative_path=$(echo "$file" | sed "s|^$PROTO_DIR/||" | sed "s|/|_|g")
    cp "$file" "$TEMP_DIR/$relative_path"
    echo "    Copied $file as $relative_path"
done

# Then, copy all files from root level (maxdepth 1) with their original names
# Only copy if we don't already have a prefixed version from subdirectories
find "$PROTO_DIR" -maxdepth 1 -name "*.proto" -type f | while read -r file; do
    filename=$(basename "$file")
    # Check if we already have a services_ prefixed version
    if [ ! -f "$TEMP_DIR/services_$filename" ]; then
        cp "$file" "$TEMP_DIR/$filename"
        echo "    Copied $file as $filename"
    else
        echo "    Skipped $file (already have services_$filename from subdirectory)"
    fi
done

# Remove old proto directory and rename temp directory
echo "  - Replacing proto directory..."
rm -rf "$PROTO_DIR"
mv "$TEMP_DIR" "$PROTO_DIR"

# Update import paths in all proto files
echo "  - Updating import paths..."
find "$PROTO_DIR" -name "*.proto" -type f | while read -r file; do
    temp_file="${file}.tmp"
    
    # Update import paths to be flat (just filename)
    # Don't change google imports - they should stay as is
    sed -E 's|import "([^g][^"]*)/([^/"]*\.proto)";|import "\2";|g' "$file" > "$temp_file"
    
    mv "$temp_file" "$file"
    echo "    Updated imports in: $(basename "$file")"
done

# Restore missing files that are needed by the codebase
echo "  - Restoring missing files..."
git checkout HEAD -- src/proto/transaction_list.proto 2>/dev/null || echo "    transaction_list.proto not found in HEAD"
git checkout HEAD -- src/proto/consensus_service.proto 2>/dev/null || echo "    consensus_service.proto not found in HEAD"
git checkout HEAD -- src/proto/mirror_network_service.proto 2>/dev/null || echo "    mirror_network_service.proto not found in HEAD"

# Update import paths in restored files
echo "  - Updating imports in restored files..."
for file in "$PROTO_DIR"/transaction_list.proto "$PROTO_DIR"/consensus_service.proto "$PROTO_DIR"/mirror_network_service.proto; do
    if [ -f "$file" ]; then
        temp_file="${file}.tmp"
        # Update import paths to be flat (just filename)
        sed -E 's|import "([^g][^"]*)/([^/"]*\.proto)";|import "\2";|g' "$file" > "$temp_file"
        mv "$temp_file" "$file"
        echo "    Updated imports in: $(basename "$file")"
    fi
done

echo "Proto files flattened successfully!"
echo "All .proto files are now in $PROTO_DIR/ with flat import paths"
