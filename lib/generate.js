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
//import * as fs from 'mz/fs';
//import * as util from 'util';
function print_generate(asts, repo, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield repo.loadModules();
        /*var out: string = ""
        if (opts.pretty) {
            out = util.inspect(asts.map(m => m.content.toJSON(false, true)), false, 20, true);
        } else {
            out = JSON.stringify(asts, null, 2)
        }
    
        var target: fs.WriteStream
        if (opts.output) {
            target = fs.createWriteStream(opts.output);
        } else {
            target = process.stdout as any;
        }
    
        target.write(new Buffer(out))
        if (opts.output) target.close();*/
        _.flatten(opts.generate.map(m => repo.generator(m)).filter(m => m != undefined)
            .map(m => {
            return m.generate(ast);
            //return asts.map(v => m!.generate(v.content, v.path))
        })).map(m => {
            console.log(m);
        });
    });
}
function handleGenerate(asts, repo, opts) {
    return print_generate(asts, repo, opts);
}
exports.handleGenerate = handleGenerate;
