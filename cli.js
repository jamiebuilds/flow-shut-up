#!/usr/bin/env node
// @flow
'use strict';
const meow = require('meow');
const flowShutup = require('./');

const cli = meow({
  help: `
    $ flow-shut-up <comment> <position>
    
    Examples

      $ flow-shut-up '$FlowFixMe' prevline
      $ flow-shut-up 'flowlint-next-line unclear-type:off' prevline
      $ flow-shut-up 'flowlint-line unclear-type:off' inline
  `
});

let [comment, position] = cli.input;
let cwd = process.cwd();

if (!comment) {
  console.error('Must specify comment');
  throw cli.showHelp();
}

if (!position) {
  console.error('Must specify position');
  throw cli.showHelp();
}

flowShutup(cwd, comment, position).catch(err => {
  console.error(err);
  process.exit(1);
});
