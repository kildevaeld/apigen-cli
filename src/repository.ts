import { resolver } from 'module-resolver';
import { IGenerator, Constructor } from 'apigen-compiler';
import * as Path from 'path';

interface Mod {
    path: string;
    pkgjson: any;
}

export interface Generator {
    name: string;
    genenerator: () => IGenerator;
}


export class Repository {

    private modules: { [key: string]: Generator } = {};

    constructor() {

    }


    async loadModules() {
        const modules = (await resolver.lookup("apigen-generator")).filter(m => m.pkgjson.name !== 'apigen');

        const errors: Error[] = [];

        for (let mod of modules) {
            try {
                this.loadModule(mod as any);
            } catch (e) {
                errors.push(e);
            }
        }

        return errors;
    }

    generator(name: string): IGenerator | undefined {
        
        return this.modules[name] ? this.modules[name].genenerator() : undefined;
    }

    listModules() {
        let out: Generator[] = [];
        for (let k in this.modules) {
            out.push(this.modules[k]);
        }
        return out;
    }

    private loadModule(m: Mod) {

        let main = m.pkgjson.main,
            hasMain = true;

        if (!main) {
            main = Path.join(Path.dirname(m.path), 'index.js');
            hasMain = false;
        }

        if (!Path.isAbsolute(main)) {
            main = Path.resolve(Path.dirname(m.path), main)
        }

        let mod: any;

        try {
            mod = require(main)
        } catch (e) {

            let msg = "";
            if (!hasMain) {
                msg = `no main specified. could not find default ${main}`;
            } else {
                msg = `could not resolve: ${main}`;
            }
            throw new Error(msg);
        }



        if (mod.default) mod = mod.default;

        if (typeof mod === 'function') {
            this.addModule(m.pkgjson.name.replace('apigen-generator-', ''), mod);
        } else {
            throw new Error(`not a module ${m.path}`);
        }

    }

    public addModule(name: string, fn: Constructor<IGenerator>) {

        if (this.modules[name]) {
            console.warn('warn: golang generator already defined')
            return;
        }
        
        this.modules[name] = {
            name: name,
            genenerator: function () { return new fn() }
        }
    }

}