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
const module_resolver_1 = require("module-resolver");
const Path = require("path");
class Repository {
    constructor() {
        this.modules = {};
    }
    loadModules() {
        return __awaiter(this, void 0, void 0, function* () {
            const modules = (yield module_resolver_1.resolver.lookup("apigen-generator")).filter(m => m.pkgjson.name !== 'apigen');
            const errors = [];
            for (let mod of modules) {
                try {
                    this.loadModule(mod);
                }
                catch (e) {
                    errors.push(e);
                }
            }
            return errors;
        });
    }
    generator(name) {
        return this.modules[name] ? this.modules[name].genenerator() : undefined;
    }
    listModules() {
        let out = [];
        for (let k in this.modules) {
            out.push(this.modules[k]);
        }
        return out;
    }
    loadModule(m) {
        let main = m.pkgjson.main, hasMain = true;
        if (!main) {
            main = Path.join(Path.dirname(m.path), 'index.js');
            hasMain = false;
        }
        if (!Path.isAbsolute(main)) {
            main = Path.resolve(Path.dirname(m.path), main);
        }
        let mod;
        try {
            mod = require(main);
        }
        catch (e) {
            let msg = "";
            if (!hasMain) {
                msg = `no main specified. could not find default ${main}`;
            }
            else {
                msg = `could not resolve: ${main}`;
            }
            throw new Error(msg);
        }
        if (mod.default)
            mod = mod.default;
        if (typeof mod === 'function') {
            this.addModule(m.pkgjson.name.replace('apigen-generator-', ''), mod);
        }
        else {
            throw new Error(`not a module ${m.path}`);
        }
    }
    addModule(name, fn) {
        if (this.modules[name]) {
            console.warn('warn: golang generator already defined');
            return;
        }
        this.modules[name] = {
            name: name,
            genenerator: function () { return new fn(); }
        };
    }
}
exports.Repository = Repository;
