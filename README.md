i18next-csv-transformer
==============

# Usage

## CLI Usage

```shell
Usage: i18next-csv-transformer [options] <file ...>

Options:
  -V, --version                output the version number
  --outputFileName <fileName>  the name of output file (.csv)
  -o, --output <path>          path to output
  -h, --help                   output usage information

Examples:

  $ i18next-csv-transformer --output ./dist ./src/locales/**/*.json

```

## gulp

```js
const transformer = require('i18next-csv-transformer');
const vfs = require('vinyl-fs');
const src = [];     // .json file paths

vfs.src(src)
    .pipe(transformer('i18n.csv'))
    .pipe(vfs.dest('./dist'));
```

# 附录

整体代码结构有参考 `gulp-concat` & `i18next-scanner`.
