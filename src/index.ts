import { Validator, parseFile, PackageExpression } from 'apigen-compiler';
import * as yargs from 'yargs';
import * as fs from 'mz/fs';
import * as Path from 'path';
import * as util from 'util';
import { Writable } from 'stream';
import { Options } from './types';
import * as _ from 'lodash';
import { handleAst } from './ast';
import { handleGenerate } from './generate';
import { Repository } from './repository';

const DEBUG = true


export function run() {


    app()
        .catch(e => {
            console.log(e)
            if (DEBUG) console.log(e.stack)
            else
                console.error(e.message);
        })

}

interface File {
    content: string;
    path: string;
}

async function app() {
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
        .argv



    const filePromises = Promise.all(argv._.map(async (file) => {
        return {
            content: await parseFile(Path.resolve(file)),
            path: file
        }
    }));


    const repo = new Repository();

    const files = await filePromises;


    const opts: Options = argv as any;

    if (opts.ast) {
        return handleAst(files, opts);
    } else if (argv.generate) {

        if (!Array.isArray(argv.generate)) {
            if (typeof (argv.generate) === 'boolean') {
                throw new Error('-g needs a parameter');
            }
            argv.generate = [argv.generate];
        }
        return handleGenerate(files, repo, argv as any)
    } else if (argv.list) {
        const errors = await repo.loadModules();
        const m = repo.listModules();
        if (m.length == 0 && errors.length) {
            console.log(errors.map(m => m.message).join('\n'))
        } else if (!m.length) {
            console.log('No generators')
        } else {
            console.log(repo.listModules().map(m => m.name).join('\n'));
        }

    }

}