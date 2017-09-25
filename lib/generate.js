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
const _ = require("lodash");
const fs = require("mz/fs");
const Path = require("path");
//import * as util from 'util';
function print_generate(asts, repo, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield repo.loadModules();
        const promises = opts.generate.map(m => repo.generator(m))
            .filter(m => m != undefined)
            .map(m => m.generate(asts));
        const files = _.flatten(yield Promise.all(promises));
        for (let file of files) {
            var target;
            if (opts.output) {
                target = fs.createWriteStream(Path.join(opts.output, file.path));
            }
            else {
                target = process.stdout;
            }
            target.write(file.content);
            if (opts.output)
                target.close();
        }
    });
}
function handleGenerate(asts, repo, opts) {
    return print_generate(asts, repo, opts);
}
exports.handleGenerate = handleGenerate;
