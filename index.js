// @flow
'use strict';
const findUp = require('find-up');
const spawn = require('spawndamnit');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const EOL = require('os').EOL;
const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function flowShutup(cwd /*: string */, comment /*: string */, position /*: string */) {
  if (position !== 'inline' && position !== 'prevline') {
    throw new Error(`position must be 'inline' or 'prevline'`);
  }

  let flowConfigPath = await findUp('.flowConfig', { cwd });
  if (!flowConfigPath) throw new Error('Could not find .flowconfig');
  let rootDir = path.dirname(flowConfigPath);
  let nodeModulesPath = await findUp('node_modules', { cwd: rootDir });
  let nodeModulesBin = nodeModulesPath ? path.join(nodeModulesPath, '.bin') : '';

  let res = await spawn('flow', ['status', '--json'], {
    cwd: rootDir,
    env: Object.assign({}, process.env, {
      PATH: `${nodeModulesBin}:${process.env.PATH || ''}`
    }),
  });

  if (res.code !== 0 && res.code !== 2) {
    console.error(res.stderr.toString());
    throw new Error(`Flow exited with code: ${res.code}`);
  }

  let json = JSON.parse(res.stdout.toString());
  let files = new Map();

  for (let error of json.errors) {
    for (let part of error.message) {
      if (
        part.loc &&
        part.loc.type === 'SourceFile' &&
        typeof part.loc.source === 'string'
      ) {
        let comments = files.get(part.loc.source);

        if (!comments) {
          comments = {};
          files.set(part.loc.source, comments);
        }

        comments[part.loc.start.line] = true;
      }
    }
  }

  for (let [filePath, comments] of files) {
    let fileContents = await readFile(filePath, 'utf-8');
    let eol = detectNewline(fileContents) || EOL;
    let lines = fileContents.split(eol);
    let result = [];

    for (let index = 0; index < lines.length; index++) {
      let line = lines[index];

      if (comments[index + 1]) {
        if (position === 'inline') {
          line = line + ' // ' + comment;
        } else {
          let indentation = detectIndent(line).indent;
          result.push(indentation + '// ' + comment);
        }
      }

      result.push(line);
    }

    await writeFile(filePath, result.join(eol));
  }
}

module.exports = flowShutup;
