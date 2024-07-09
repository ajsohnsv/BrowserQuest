#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const SRC_FILE = 'tmx/map.tmx';
const TEMP_FILE = SRC_FILE + '.json';

const mode = process.argv.length > 2 ? process.argv[2] : 'client';
const DEST_FILE = mode === 'client' ? '../../client/maps/world_client' : '../../server/maps/world_server.json';

function executeCommand(command) {
    try {
        const output = execSync(command, { encoding: 'utf8' });
        console.log(output);
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error);
    }
}

executeCommand(`python tmx2json.py ${SRC_FILE} ${TEMP_FILE}`);

executeCommand(`node ./exportmap.js ${TEMP_FILE} ${DEST_FILE} ${mode}`);

fs.unlinkSync(TEMP_FILE);