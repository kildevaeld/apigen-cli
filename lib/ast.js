"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const util = require("util");
function print_ast(asts, opts) {
    var out = "";
    if (opts.pretty) {
        out = util.inspect(asts.map(m => m.content.toJSON(false, true)), false, 20, true);
    }
    else {
        out = JSON.stringify(asts, null, 2);
    }
    var target;
    if (opts.output) {
        target = fs.createWriteStream(opts.output);
    }
    else {
        target = process.stdout;
    }
    target.write(new Buffer(out));
    if (opts.output)
        target.close();
    else
        target.write('\n');
}
function handleAst(asts, opts) {
    if (!asts.length) {
        console.log('No files');
        return;
    }
    return print_ast(asts, opts);
}
exports.handleAst = handleAst;
