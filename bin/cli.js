#!/usr/bin/env node

'use strict';

const vfs = require('vinyl-fs');
const program = require('commander');
const packageJson = require('../package');
const transformer = require('../lib');

(function () {
    program
        .name('i18next-csv-transformer')
        .version(packageJson.version)
        .usage('[options] <file ...>')
        .option('--outputFileName <fileName>', 'the name of output file (.csv)')
        .option('-o, --output <path>', 'path to output');

    program.on('--help', function() {
        console.log('');
        console.log('Examples:');
        console.log('');
        console.log('  $ i18next-csv-transformer --output ./dist ./src/locales/**/*.json');
        console.log('');
    });

    program.parse(process.argv);

    var src = program.args || [];

    // 抄的 i18next-scanner
    src = (Array.isArray(src) ? src : Array.prototype.slice.call(src))
        .map(function (s) {
            s = s.trim();

            // On Windows, arguments contain spaces must be enclosed with double quotes, not single quotes.
            if (s.match(/(^'.*'$|^".*"$)/)) {
                // Remove first and last character
                s = s.slice(1, -1);
            }
            return s;
        });

    if (!program.output || src.length === 0) {
        program.help();
        return;
    }

    vfs.src(src)
        .pipe(transformer(program.outputFileName || 'i18n.csv'))
        .pipe(vfs.dest(program.output));
}());
