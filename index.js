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

const crawl = Co.wrap(function *(dirname, stripextension, filetest) {
    const files = yield readdir(dirname);
    let handlers = {};

    for (const file of files) {
        const abspath = Path.join(dirname, file);
        const key = file.replace(stripextension, '');
        const stat = yield stats(abspath);

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
            const next = yield crawl(abspath, stripextension, filetest);

            if (Object.keys(next).length) {
                handlers[key] = next;
            }
        }
    }

    return handlers;
});

const merge = function (dirname = Path.resolve(Path.dirname(Caller())), extensions = ['json'], callback) {
    const extregex = `\.(${extensions.join('|')})$`;
    const stripextension = RegExp(extregex, 'g');
    const filetest = RegExp(`^.*${extregex}`);

    const result = crawl(dirname, stripextension, filetest);

    if (!callback) {
        return result;
    }

    result.then((merged) => callback(null, merged)).catch(callback);
};

module.exports.merge = merge;
