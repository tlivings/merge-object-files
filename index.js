'use strict';

const Fs = require('fs');
const Path = require('path');
const Co = require('co');
const Entries = require('entries');
const Caller = require('caller');

const promisify = function (fn, ctx) {
    return function (...args) {
        return new Promise((resolve, reject) => {
            fn.apply(ctx, [...args, (error, result) => {
                error ? reject(error) : resolve(result);
            }]);
        });
    };
};

const readdir = promisify(Fs.readdir);
const stats = promisify(Fs.stat);

const crawl = Co.wrap(function *(dirname, extensions) {
    const extregex = `\.(${extensions.join('|')})$`;
    const replacetest = RegExp(extregex, 'g');
    const filetest = RegExp(`^.*${extregex}`);

    const files = yield readdir(dirname);

    let handlers = {};

    for (const file of files) {
        const abspath = Path.join(dirname, file);
        const stat = yield stats(abspath);
        const key = file.replace(replacetest, '');

        if (stat.isFile()) {
            if (filetest.test(file)) {
                const obj = require(abspath);

                if (!handlers[key]) {
                    handlers[key] = {};
                }

                for (const [k, v] of Entries(obj)) {
                    handlers[key][k] = v;
                }
            }
        }
        if (stat.isDirectory()) {
            const next = yield crawl(abspath, extensions);

            if (Object.keys(next).length) {
                handlers[key] = next;
            }
        }
    }

    return handlers;
});

const merge = function (dirname = Path.resolve(Path.dirname(Caller())), extensions = ['json'], callback) {
    if (!callback) {
        return crawl(dirname, extensions);
    }

    crawl(dirname, extensions).then((result) => callback(null, result)).catch(callback);
};

module.exports.merge = merge;
