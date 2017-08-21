"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = require("../repository");
const yargs = require("yargs");
const fs = require("mz/fs");
const Path = require("path");
const util = require("util");
const _1 = require("../");
const _ = require("lodash");
const DEBUG = true;
function run() {
    app()
        .catch(e => {
        console.log(e);
        if (DEBUG)
            console.log(e.stack);
        else
            console.error(e.message);
    });
}
exports.run = run;
function app() {
    return __awaiter(this, void 0, void 0, function* () {
        const argv = yargs.option("ast", {
            alias: 'a',
            default: false
        }).option("pretty", {
            alias: "p",
            default: false
        }).option("output", {
            alias: 'o'
        }).option("generate", {
            alias: 'g'
        }).help()
            .argv;
        const filePromises = Promise.all(argv._.map((file) => __awaiter(this, void 0, void 0, function* () {
            return {
                content: yield _1.parseFile(file),
                path: file
            };
        })));
        const repo = new repository_1.Repository();
        const [files] = yield Promise.all([
            filePromises,
            repo.loadModules()
        ]);
        /*const files = await Promise.all(argv._.map(async (file) => {
            return {
                content: await parseFile(file),
                path: file
            }
        }));*/
        if (argv.ast) {
            return print_ast(files, argv);
        }
        else if (argv.generate) {
            if (!Array.isArray(argv.generate)) {
                if (typeof (argv.generate) === 'boolean') {
                    throw new Error('-g needs a parameter');
                }
                argv.generate = [argv.generate];
            }
            return generate(files, argv);
        }
    });
}
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
}
const lua = require("../lua");
const ts = require("../typescript");
const cpp = require("../cpp");
function generate_lua(files) {
    return Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
        if (!file.content.endpoints.length)
            return null;
        let output = lua.write(file.content);
        return {
            path: Path.basename(file.path, Path.extname(file.path)) + '.lua',
            content: (yield output)
        };
    }))).then(m => {
        return m.filter(m => m != null);
    });
}
function generate_ts(files) {
    return Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
        //if (!file.content.endpoints.length) return null;
        let output = ts.write(file.content);
        return {
            path: Path.basename(file.path, Path.extname(file.path)) + '.ts',
            content: (yield output)
        };
    }))).then(m => {
        return m.filter(m => m != null);
    });
}
function generate_cpp(files) {
    return Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
        let gen = new cpp.CppGenerator();
        const results = yield gen.generate(file.content.copy(), file.path);
        return results;
    }))).then(m => _.flatten(m));
}
function generate(asts, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!opts.generate)
            return;
        let output = [];
        for (let o of opts.generate) {
            switch (o) {
                case "lua":
                    output.push(...(yield generate_lua(asts)));
                case "typescript":
                    output.push(...(yield generate_ts(asts)));
                case "cpp":
                    output.push(...(yield generate_cpp(asts)));
            }
        }
        if (opts.output) {
            let root = opts.output;
            if (!(yield fs.stat(root)).isDirectory) {
                throw new Error('output is not a directory');
            }
            yield Promise.all(output.map(m => {
                return fs.writeFile(Path.join(root, m.path), m.content);
            }));
        }
        else {
            process.stdout.write(output.map(m => m.content).join('\n\n') + '\n');
        }
    });
}
