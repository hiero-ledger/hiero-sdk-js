#!/usr/bin/env node

/**
 * Fix proto namespaces in proto.d.ts
 * Replace proto. with hashgraph.proto. except when preceded by api.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_DIR = __dirname;
const PROTO_PACKAGE_ROOT = path.dirname(SCRIPT_DIR);
const filePath = path.join(PROTO_PACKAGE_ROOT, 'src', 'proto.d.ts');

let content = fs.readFileSync(filePath, 'utf8');

// Replace proto. with hashgraph.proto. except when preceded by api.
content = content.replace(/(?<!api\.)proto\./g, 'hashgraph.proto.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed proto namespaces in proto.d.ts');

