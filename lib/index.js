'use strict';

const path = require('path');
const File = require('vinyl');
const through2 = require('through2');
const gutil = require('gulp-util');
const PluginError = gutil.PluginError;

const PLUGIN_NAME = 'i18next-csv-transformer';

function recursion (obj, key) {
    var result = {};
    const keys = Object.keys(obj);
    const prefix = key ? key + '.' : '';

    for (let i = 0, l = keys.length; i < l; ++i) {
        switch (typeof(obj[keys[i]])) {
            case 'string':
                result[`${prefix}${keys[i]}`] = obj[keys[i]];
                break;
            case 'object':
                result = {
                    ...result,
                    ...recursion(obj[keys[i]], `${prefix}${keys[i]}`),
                };
                break;
        }
    }

    return result;
}

module.exports = (fileName, opt) => {
    if (!fileName) {
        this.emit('error', new PluginError(PLUGIN_NAME, 'missing fileName option'));
        return ;
    }

    var latestMod, latestFile, combine = {};

    function bufferContents (file, enc, cb) {
        gutil.log('processing', file.path);

        if (file.isNull()) {
            gutil.log('processing warning', file.path, 'is null');
            cb();
            return ;
        } else {
            // we don't do streams (yet)
            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
                cb();
                return;
            }

            if (file.isBuffer()) {
                let content, result;

                // 解析原 json
                try {
                    content = JSON.parse(file.contents.toString());
                } catch (ex) {
                    content = {};
                }

                // 拉平, 转化为 key-value
                result = recursion(content);

                // 命名空间
                const namespace = file.relative.replace(/\.json$/, '');

                // 语言
                const lang = file.path.replace(new RegExp(`^.*\\/([^\\/]*?)\\/${namespace}\\.json`), '$1');

                // 往总和里加语言
                if (!combine[lang]) {
                    combine[lang] = {};
                }

                // 加对应的 namespace
                combine[lang][namespace] = result;
            }

            // 不知道有啥用
            // set latest file if not already set,
            // or if the current file was modified more recently.
            if (!latestMod || file.stat && file.stat.mtime > latestMod) {
                latestFile = file;
                latestMod = file.stat && file.stat.mtime;
            }

            cb();
        }
    }

    function endStream (cb) {
        if (!latestFile) {
            cb();
            return ;
        }
        gutil.log('converting json into csv');

        const joinedFile = new File();

        const rows = {};

        const keysLang = Object.keys(combine);

        for (let i = 0, l = keysLang.length; i < l; ++i) {
            const lang = combine[keysLang[i]];
            const keysNamespace = Object.keys(lang);

            for (let j = 0, m = keysNamespace.length; j < m; ++j) {
                const namespace = lang[keysNamespace[j]];
                const keysProperty = Object.keys(namespace);

                for (let k = 0, n = keysProperty.length; k < n; ++k) {
                    if (!rows[`${keysNamespace[j]}:${keysProperty[k]}`]) {
                        rows[`${keysNamespace[j]}:${keysProperty[k]}`] = {};
                    }
                    rows[`${keysNamespace[j]}:${keysProperty[k]}`][keysLang[i]] = namespace[keysProperty[k]];
                }
            }
        }

        const keysRow = Object.keys(rows);

        const csv = [
            ['"key"', '"tags"', '"context"', '"namespace"', ...keysLang.map(item => `"${item}"`),]
        ];

        for (let i = 0, l = keysRow.length; i < l; ++i) {
            csv.push([
                `"${keysRow[i].replace(/^.*:/, '')}"`,
                '',     // tags
                '',     // context
                `"${keysRow[i].replace(/:.*$/, '')}"`,
                ...keysLang.map(lang => `"${rows[keysRow[i]][lang]}"`),
            ]);
        }

        const csvFile = csv.map(row => row.join(',')).join('\n');

        // csv 文件乱码问题解决
        // https://github.com/f2e-journey/xueqianban/issues/34
        joinedFile.contents = Buffer.concat([ Buffer.from('\xEF\xBB\xBF', 'binary'), Buffer.from(csvFile), ]);
        joinedFile.path = fileName;

        this.push(joinedFile);
        cb();
    }

    return through2.obj(bufferContents, endStream);
};
