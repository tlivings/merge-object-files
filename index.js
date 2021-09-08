import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import { caller } from './lib/caller.js';

const readdir = Util.promisify(Fs.readdir);
const stats = Util.promisify(Fs.stat);

const crawl = async function (dirname, stripextension, filetest) {
    const files = await readdir(dirname);
    const objects = {};

    for (const file of files) {
        const abspath = Path.join(dirname, file);
        const key = file.replace(stripextension, '');
        const stat = await stats(abspath);

        if (stat.isFile()) {
            if (filetest.test(file)) {
                const obj = await import(abspath);

                if (!objects[key]) {
                    objects[key] = {};
                }

                if (obj.default) {
                  for (const [k, v] of Object.entries(obj.default)) {
                    objects[key][k] = v;
                  }
                }
                for (const [k, v] of Object.entries(obj)) {
                    if (k !== 'default') {
                        objects[key][k] = v;
                    }
                }
            }
        }
        if (stat.isDirectory()) {
            const next = await crawl(abspath, stripextension, filetest);

            if (Object.keys(next).length) {
                objects[key] = next;
            }
        }
    }

    return objects;
};

export const merge = function (dirname = Path.resolve(Path.dirname(caller())), extensions = ['.json'], callback) {
    const extregex = `.(${extensions.join('|')})$`;
    const stripextension = RegExp(extregex, 'g');
    const filetest = RegExp(`^.*${extregex}`);

    const result = crawl(dirname, stripextension, filetest);

    if (!callback) {
        return result;
    }

    result.then((merged) => callback(null, merged)).catch(callback);
};

export default {merge};
