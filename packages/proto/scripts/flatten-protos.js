#!/usr/bin/env node

/**
 * Generic script to flatten all proto files to src/proto/ and fix import paths
 * This script is future-proof and doesn't hardcode any specific filenames
 * 
 * Direct port of flatten-protos.sh to Node.js with identical behavior
 */

import fs from 'fs';
import path from 'path';

const PROTO_DIR = 'src/proto';
const TEMP_DIR = 'src/proto_temp';

console.log('Flattening proto directory structure...');

/**
 * Recursively find all files matching criteria
 * @param {string} dir - Directory to search
 * @param {number} minDepth - Minimum depth (1 = direct children, 2 = subdirectories)
 * @param {number} maxDepth - Maximum depth
 * @param {string} pattern - File extension to match
 * @returns {string[]} Array of file paths
 */
function findFiles(dir, minDepth, maxDepth, pattern = '.proto') {
    const results = [];
    
    function search(currentDir, currentDepth) {
        if (currentDepth > maxDepth) return;
        
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory()) {
                    search(fullPath, currentDepth + 1);
                } else if (entry.isFile() && entry.name.endsWith(pattern)) {
                    if (currentDepth >= minDepth) {
                        results.push(fullPath);
                    }
                }
            }
        } catch (err) {
            // Directory doesn't exist or can't be read
        }
    }
    
    search(dir, 1);
    return results;
}

/**
 * Create directory if it doesn't exist
 * @param {string} dir - Directory to create
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Remove directory recursively
 * @param {string} dir - Directory to remove
 */
function removeDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

// Create temporary directory
ensureDir(TEMP_DIR);

console.log('  - Collecting all proto files...');

// First, copy all files from subdirectories (mindepth 2) with prefixed names
const subdirFiles = findFiles(PROTO_DIR, 2, Infinity, '.proto');

for (const file of subdirFiles) {
    // Convert path to flattened name: services/basic_types.proto -> services_basic_types.proto
    const relativePath = path.relative(PROTO_DIR, file);
    const flattenedName = relativePath.replace(/[/\\]/g, '_');
    const destPath = path.join(TEMP_DIR, flattenedName);
    
    fs.copyFileSync(file, destPath);
    console.log(`    Copied ${file} as ${flattenedName}`);
}

// Then, copy all files from root level (maxdepth 1) with their original names
// Only copy if we don't already have a prefixed version from subdirectories
const rootFiles = findFiles(PROTO_DIR, 1, 1, '.proto');

for (const file of rootFiles) {
    const filename = path.basename(file);
    
    // Check if we already have a prefixed version from subdirectories
    // or if the exact filename already exists (from subdirectory flattening)
    let prefixedExists = false;
    
    const destPath = path.join(TEMP_DIR, filename);
    if (fs.existsSync(destPath)) {
        // Exact filename match exists (from subdirectory)
        prefixedExists = true;
    } else {
        // Check for prefixed versions (ending with _filename)
        const tempFiles = fs.readdirSync(TEMP_DIR);
        for (const tempFile of tempFiles) {
            if (tempFile.endsWith(`_${filename}`)) {
                prefixedExists = true;
                break;
            }
        }
    }
    
    if (!prefixedExists) {
        fs.copyFileSync(file, destPath);
        console.log(`    Copied ${file} as ${filename}`);
    } else {
        console.log(`    Skipped ${file} (already have prefixed version from subdirectory)`);
    }
}

// Remove old proto directory and rename temp directory
console.log('  - Replacing proto directory...');
removeDir(PROTO_DIR);
fs.renameSync(TEMP_DIR, PROTO_DIR);

// Update import paths in all proto files
console.log('  - Updating import paths...');

/**
 * Update imports in a single file
 * @param {string} file - File to update
 */
function updateImportsInFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Normalize to LF line endings (in case Windows added CRLF)
    content = content.replace(/\r\n/g, '\n');
    
    let updatedContent = content;
    
    // Find all import statements that reference local proto files (not google/*)
    const importRegex = /import "([^"]*\.proto)";/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    
    // Process each import
    for (const importFile of imports) {
        // Skip only google imports
        if (importFile.startsWith('google/')) {
            continue;
        }
        
        // Candidate flattened name for subdir imports
        const flatCandidate = importFile.replace(/[/\\]/g, '_');
        
        let newFilename = '';
        
        // Prefer exact flattened candidate if present
        const flatCandidatePath = path.join(PROTO_DIR, flatCandidate);
        if (fs.existsSync(flatCandidatePath)) {
            newFilename = flatCandidate;
        } else {
            // Fallback: search for a file that ends with _basename or exact basename
            const basename = path.basename(importFile);
            const protoFiles = fs.readdirSync(PROTO_DIR).filter(f => f.endsWith('.proto'));
            
            for (const protoFile of protoFiles) {
                if (protoFile.endsWith(`_${basename}`) || protoFile === basename) {
                    newFilename = protoFile;
                    break;
                }
            }
        }
        
        if (newFilename && newFilename !== importFile) {
            const oldImport = `import "${importFile}";`;
            const newImport = `import "${newFilename}";`;
            updatedContent = updatedContent.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
            console.log(`    Updated import: ${importFile} -> ${newFilename}`);
        }
    }
    
    // Replace the original file with the updated content
    // Ensure LF line endings are preserved on all platforms
    fs.writeFileSync(file, updatedContent, { encoding: 'utf8', flag: 'w' });
}

// Process all proto files
const allProtoFiles = fs.readdirSync(PROTO_DIR)
    .filter(f => f.endsWith('.proto'))
    .map(f => path.join(PROTO_DIR, f));

for (const file of allProtoFiles) {
    console.log(`    Processing: ${path.basename(file)}`);
    updateImportsInFile(file);
}

console.log('Proto files flattened successfully!');
console.log(`All .proto files are now in ${PROTO_DIR}/ with updated import paths`);
