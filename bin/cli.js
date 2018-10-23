'use strict';

const vfs = require('vinyl-fs');
const program = require('commander');
const packageJson = require('../package');
const transformer = require('../lib');

(function () {
    program
        .version(packageJson.version)
        .usage('[options] <file ...>')
        // .option('-c, --config <config>', 'config file')
        .option('-o, --output <path>', 'path to output');

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
        .pipe(transformer('i18n.csv'))
        .pipe(vfs.dest(program.output));
}());
