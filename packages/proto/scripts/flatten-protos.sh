#!/bin/bash

# Generic script to flatten all proto files to src/proto/ and fix import paths
# This script is future-proof and doesn't hardcode any specific filenames

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
    
    # Check if we already have a prefixed version from subdirectories
    prefixed_exists=false
    for prefixed_file in "$TEMP_DIR"/*; do
        if [[ "$prefixed_file" == *"_$filename" ]]; then
            prefixed_exists=true
            break
        fi
    done
    
    if [ "$prefixed_exists" = false ]; then
        cp "$file" "$TEMP_DIR/$filename"
        echo "    Copied $file as $filename"
    else
        echo "    Skipped $file (already have prefixed version from subdirectory)"
    fi
done

# Remove old proto directory and rename temp directory
echo "  - Replacing proto directory..."
rm -rf "$PROTO_DIR"
mv "$TEMP_DIR" "$PROTO_DIR"

# Update import paths in all proto files
echo "  - Updating import paths..."

# Function to update imports in a single file
update_imports_in_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    # Start with the original file
    cp "$file" "$temp_file"
    
    # Find all import statements that reference local proto files (not google/*)
    grep -o 'import "[^"]*\.proto";' "$file" | while read -r import_line; do
        # Extract the filename from the import statement
        import_file=$(echo "$import_line" | sed 's/import "\([^"]*\)";/\1/')
        
        # Skip google imports and other external imports
        if [[ "$import_file" == google/* ]] || [[ "$import_file" == */* ]]; then
            continue
        fi
        
        # Find the new prefixed filename
        new_filename=""
        for proto_file in "$PROTO_DIR"/*.proto; do
            if [[ -f "$proto_file" ]]; then
                basename_file=$(basename "$proto_file")
                if [[ "$basename_file" == *"_$import_file" ]] || [[ "$basename_file" == "$import_file" ]]; then
                    new_filename="$basename_file"
                    break
                fi
            fi
        done
        
        # Update the import if we found a new filename
        if [[ -n "$new_filename" ]] && [[ "$new_filename" != "$import_file" ]]; then
            sed -i.tmp "s|import \"$import_file\";|import \"$new_filename\";|g" "$temp_file"
            rm -f "$temp_file.tmp"
            echo "    Updated import: $import_file -> $new_filename"
        fi
    done
    
    # Replace the original file with the updated one
    mv "$temp_file" "$file"
}

# Process all proto files
for file in "$PROTO_DIR"/*.proto; do
    if [[ -f "$file" ]]; then
        echo "    Processing: $(basename "$file")"
        update_imports_in_file "$file"
    fi
done

echo "Proto files flattened successfully!"
echo "All .proto files are now in $PROTO_DIR/ with updated import paths"