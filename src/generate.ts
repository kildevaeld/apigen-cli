import { Repository } from './repository';
import { Options } from './types';
import {AstFile} from 'apigen-compiler';
import * as _ from 'lodash';
import * as fs from 'mz/fs';
import * as Path from 'path';
//import * as util from 'util';



async function print_generate(asts: AstFile[], repo: Repository, opts: Options) {
    
    await repo.loadModules()
    
   
    const promises = opts.generate!.map(m => repo.generator(m))
        .filter(m => m != undefined)
        .map(m =>  m!.generate(asts));

    const files = _.flatten(await Promise.all(promises));
    
    for(let file of files) {
        var target: fs.WriteStream
        if (opts.output) {
            target = fs.createWriteStream(Path.join(opts.output, file.path));
        } else {
            target = process.stdout as any;
        }
    
        target.write(file.content)

        if (opts.output) target.close();
    }

}

export function handleGenerate(asts: AstFile[], repo: Repository, opts: Options) {
    return print_generate(asts, repo, opts);
}