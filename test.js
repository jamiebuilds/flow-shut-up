// @flow
'use strict';
const test = require('ava');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const spawn = require('spawndamnit');
const fixtures = require('fixturez');

const f = fixtures(__dirname, { root: __dirname });
const CLI = path.join(__dirname, 'cli.js');
const NODE_MODULES_BIN = path.join(__dirname, 'node_modules', '.bin');
const readFile = promisify(fs.readFile);

test('works', async t => {
  let tmpPath = f.copy('lint-errors');

  let res = await spawn(CLI, ['flowlint-next-line unclear-type:off', 'prevline'], {
    cwd: tmpPath,
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      PATH: `${NODE_MODULES_BIN}:${process.env.PATH}`
    }),
  });

  let fileContents = await readFile(path.join(tmpPath, 'index.js'), 'utf-8');
  t.is(fileContents, '// @flow\n// flowlint-next-line unclear-type:off\nlet a: any = 1;\n');
});
