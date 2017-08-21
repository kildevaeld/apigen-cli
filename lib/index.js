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
const apigen_compiler_1 = require("apigen-compiler");
const yargs = require("yargs");
const Path = require("path");
const ast_1 = require("./ast");
const generate_1 = require("./generate");
const repository_1 = require("./repository");
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
            alias: 'o',
            description: "output"
        }).option("generate", {
            alias: 'g',
            desc: "trala"
        }).option("list", {
            alias: 'l'
        }).help(true)
            .argv;
        const filePromises = Promise.all(argv._.map((file) => __awaiter(this, void 0, void 0, function* () {
            return {
                content: yield apigen_compiler_1.parseFile(Path.resolve(file)),
                path: file
            };
        })));
        const repo = new repository_1.Repository();
        const files = yield filePromises;
        const opts = argv;
        if (opts.ast) {
            return ast_1.handleAst(files, opts);
        }
        else if (argv.generate) {
            if (!Array.isArray(argv.generate)) {
                if (typeof (argv.generate) === 'boolean') {
                    throw new Error('-g needs a parameter');
                }
                argv.generate = [argv.generate];
            }
            return generate_1.handleGenerate(files, repo, argv);
        }
        else if (argv.list) {
            const errors = yield repo.loadModules();
            const m = repo.listModules();
            if (m.length == 0 && errors.length) {
                console.log(errors.map(m => m.message).join('\n'));
            }
            else if (!m.length) {
                console.log('No generators');
            }
            else {
                console.log(repo.listModules().map(m => m.name).join('\n'));
            }
        }
    });
}
