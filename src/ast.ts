import { Options, AstFile } from './types';
import * as fs from 'mz/fs';
import * as util from 'util';


function print_ast(asts: AstFile[], opts: Options) {
    var out: string = ""
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
    if (opts.output) target.close();
    else target.write('\n');
}

export function handleAst(asts: AstFile[], opts: Options) {
    if (!asts.length) {
        console.log('No files')
        return;
    }
    return print_ast(asts, opts);
}