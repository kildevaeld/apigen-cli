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
import { addGenerators } from './generators';
const DEBUG = true


export function run() {


    app()
        .catch(e => {
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


    let inputs = argv._.slice(0);
    if (argv.ast && !argv.generate) inputs.push(argv.ast);

    const filePromises = Promise.all(inputs.map(async (file) => {
        try {
            return {
                content: await parseFile(Path.resolve(file)),
                path: file
            }
        } catch (e) {
            e.path = file;
            throw e;
        }
    }));


    const repo = new Repository();

    addGenerators(repo);

    let files: { content: PackageExpression, path: string }[]
    try {
        files = await filePromises;
    } catch (e) {
        console.log(e)
    }


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
            console.log('Generators:\n ' + repo.listModules().map(m => m.name).join('\n  '));
        }

    }

}