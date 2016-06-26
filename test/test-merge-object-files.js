'use strict';

const Test = require('tape');
const Files = require('../index');
const Path = require('path');

Test('test merge-object-files', (t) => {

    t.test('accepts extensions', (t) => {
        t.plan(2);

        Files.merge(Path.resolve(__dirname, 'fixtures'), ['js', 'json'])
        .then((merged) => {
            t.ok(merged);
            t.ok(merged.a.b.btest.key);
        })
        .catch(console.log);
    });

    t.test('defaults to json', (t) => {
        t.plan(3);

        Files.merge(Path.resolve(__dirname, 'fixtures'))
        .then((merged) => {
            t.ok(merged);
            t.ok(!merged.a.b);
            t.ok(!merged.test);
        })
        .catch(console.log);
    });

    t.test('defaults to caller directory', (t) => {
        t.plan(2);

        Files.merge()
        .then((merged) => {
            t.ok(merged);
            t.ok(merged.fixtures);
        })
        .catch(console.log);
    });

});
