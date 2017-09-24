import { Repository } from './repository';
import { Options } from './types';
import {AstFile} from 'apigen-compiler';
import * as _ from 'lodash';
import * as fs from 'mz/fs';
//import * as util from 'util';



async function print_generate(asts: AstFile[], repo: Repository, opts: Options) {


    
    //await repo.loadModules()
    
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
    let promises = opts.generate!.map(m => repo.generator(m)).filter(m => m != undefined)
        .map(m => {
            
            return m!.generate(asts)
            //return asts.map(v => m!.generate(v.content, v.path))
        });

    let files = _.flatten(await Promise.all(promises));
    
    for(let file of files) {
        var target: fs.WriteStream
        if (opts.output) {
            target = fs.createWriteStream(opts.output);
        } else {
            target = process.stdout as any;
        }
    
        target.write(file.content)
    }

}

export function handleGenerate(asts: AstFile[], repo: Repository, opts: Options) {
    return print_generate(asts, repo, opts);
}