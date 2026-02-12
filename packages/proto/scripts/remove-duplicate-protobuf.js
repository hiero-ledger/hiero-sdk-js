#!/usr/bin/env node

/**
 * PROTO DUPLICATE REMOVAL SCRIPT
 * 
 * PROBLEM: This script fixes duplicate proto files that cause compilation errors
 * like "duplicate name 'EventCore' in Namespace .com.hedera.hapi.platform.event"
 * or "duplicate name 'HookEntityId' in Namespace .proto"
 *
 * ROOT CAUSE: The proto flattening process in Taskfile.yml creates multiple
 * copies of the same files with different prefixes:
 *
 * 1. Original source: platform/event/event_core.proto
 * 2. After move: services/event_core.proto (Taskfile.yml line 43 moves platform/event/* to services/)
 * 3. After flatten: 
 *    - services_event_core.proto (from services/event_core.proto)
 *    - platform_event_event_core.proto (from platform/event/event_core.proto)
 *    - event_core.proto (from root level, if it exists)
 *
 * The flattening script (flatten-protos.js) replaces path separators with underscores:
 * - services/event/event_descriptor.proto → services_event_event_descriptor.proto
 * - platform/event/event_core.proto → platform_event_event_core.proto
 *
 * This creates files with duplicate "event_" segments and multiple copies of the
 * same message definitions in the same namespace, causing protobuf compilation errors.
 *
 * SOLUTION: Remove duplicate files, keeping only the services_* versions since
 * they represent the canonical location after the move operation.
 *
 * ADDITIONAL CASE: services_hook_primitives.proto contains duplicate message
 * definitions (HookEntityId, HookId, HookCall) that are already defined in
 * services_basic_types.proto. The hook_primitives file is removed to prevent
 * duplicate name errors.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_DIR = __dirname;
const PROTO_PACKAGE_ROOT = path.dirname(SCRIPT_DIR);
const ROOT = path.join(PROTO_PACKAGE_ROOT, 'src', 'proto');

console.log(`Removing duplicate proto files from: ${ROOT}`);

/**
 * Remove file if it exists
 * @param {string} filePath - Path to file to remove
 * @param {string} reason - Reason for removal
 */
function removeFile(filePath, reason) {
    if (fs.existsSync(filePath)) {
        console.log(`Removing duplicate: ${path.basename(filePath)} (${reason})`);
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

/**
 * Get all files in directory matching a pattern
 * @param {string} dir - Directory to search
 * @param {string} pattern - Pattern to match (supports * wildcards)
 * @returns {string[]} Array of matching file paths
 */
function getFilesMatching(dir, pattern) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    
    const files = fs.readdirSync(dir);
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    return files
        .filter(f => regex.test(f))
        .map(f => path.join(dir, f));
}

/**
 * Search for a pattern in files
 * @param {string} dir - Directory to search
 * @param {string} pattern - Pattern to search for
 * @returns {Array<{file: string, line: number, content: string}>} Matches
 */
function grepFiles(dir, pattern) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    
    const results = [];
    const regex = new RegExp(pattern);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.proto'));
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            if (regex.test(line)) {
                results.push({
                    file: filePath,
                    line: index + 1,
                    content: line.trim()
                });
            }
        });
    }
    
    return results;
}

// Remove auxiliary_* files if a services_* counterpart exists
const auxiliaryFiles = getFilesMatching(ROOT, 'auxiliary_*.proto');
for (const auxFile of auxiliaryFiles) {
    const baseName = path.basename(auxFile);
    const tail = baseName.replace(/^auxiliary_/, '');
    const svcFile = path.join(ROOT, `services_${tail}`);
    
    if (fs.existsSync(svcFile)) {
        removeFile(auxFile, `services version exists: services_${tail}`);
    }
}

// Remove platform_event_event_* files if services_event_* counterpart exists
const platformEventFiles = getFilesMatching(ROOT, 'platform_event_event_*.proto');
for (const platformFile of platformEventFiles) {
    const baseName = path.basename(platformFile);
    const tail = baseName.replace(/^platform_event_event_/, '');
    const svcFile = path.join(ROOT, `services_event_${tail}`);
    
    if (fs.existsSync(svcFile)) {
        removeFile(platformFile, `services version exists: services_event_${tail}`);
    }
}

// Remove root-level event_* files if services_event_* counterpart exists
const eventFiles = getFilesMatching(ROOT, 'event_*.proto');
for (const eventFile of eventFiles) {
    const baseName = path.basename(eventFile);
    const svcFile = path.join(ROOT, `services_${baseName}`);
    
    if (fs.existsSync(svcFile)) {
        removeFile(eventFile, `services version exists: services_${baseName}`);
    }
}

// Remove root-level gossip_event.proto if services_gossip_event.proto exists
const gossipEventFile = path.join(ROOT, 'gossip_event.proto');
const servicesGossipEventFile = path.join(ROOT, 'services_gossip_event.proto');
if (fs.existsSync(gossipEventFile) && fs.existsSync(servicesGossipEventFile)) {
    removeFile(gossipEventFile, 'services version exists: services_gossip_event.proto');
}

// Remove any duplicate state signature transaction files
const stateSignatureFiles = getFilesMatching(ROOT, '*state*signature*transaction*.proto');
const canonicalFile = path.join(ROOT, 'services_state_signature_transaction.proto');

for (const file of stateSignatureFiles) {
    if (file !== canonicalFile) {
        removeFile(file, 'keeping services_state_signature_transaction.proto');
    }
}

// Remove services_hook_primitives.proto if services_basic_types.proto exists
const hookPrimitivesFile = path.join(ROOT, 'services_hook_primitives.proto');
const basicTypesFile = path.join(ROOT, 'services_basic_types.proto');
if (fs.existsSync(hookPrimitivesFile) && fs.existsSync(basicTypesFile)) {
    removeFile(hookPrimitivesFile, 'all messages already defined in services_basic_types.proto');
}

// Show remaining definitions for sanity
console.log('');
console.log('Remaining definitions of EventCore:');
const eventCoreMatches = grepFiles(ROOT, 'message\\s+EventCore\\b');
if (eventCoreMatches.length === 0) {
    console.log('  (none found)');
} else {
    eventCoreMatches.forEach(m => {
        console.log(`  ${path.basename(m.file)}:${m.line}: ${m.content}`);
    });
}

console.log('');
console.log('Remaining definitions of StateSignatureTransaction:');
const stateSignatureMatches = grepFiles(ROOT, 'message\\s+StateSignatureTransaction\\b');
if (stateSignatureMatches.length === 0) {
    console.log('  (none found)');
} else {
    stateSignatureMatches.forEach(m => {
        console.log(`  ${path.basename(m.file)}:${m.line}: ${m.content}`);
    });
}

console.log('');
console.log('Remaining definitions of HookEntityId:');
const hookEntityIdMatches = grepFiles(ROOT, 'message\\s+HookEntityId\\b');
if (hookEntityIdMatches.length === 0) {
    console.log('  (none found)');
} else {
    hookEntityIdMatches.forEach(m => {
        console.log(`  ${path.basename(m.file)}:${m.line}: ${m.content}`);
    });
}

console.log('');
console.log('Remaining definitions of HookId:');
const hookIdMatches = grepFiles(ROOT, 'message\\s+HookId\\b');
if (hookIdMatches.length === 0) {
    console.log('  (none found)');
} else {
    hookIdMatches.forEach(m => {
        console.log(`  ${path.basename(m.file)}:${m.line}: ${m.content}`);
    });
}

console.log('');
console.log('Remaining definitions of HookCall:');
const hookCallMatches = grepFiles(ROOT, 'message\\s+HookCall\\b');
if (hookCallMatches.length === 0) {
    console.log('  (none found)');
} else {
    hookCallMatches.forEach(m => {
        console.log(`  ${path.basename(m.file)}:${m.line}: ${m.content}`);
    });
}

console.log('');
console.log('Done.');

