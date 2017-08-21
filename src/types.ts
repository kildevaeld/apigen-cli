import { PackageExpression } from 'apigen-compiler';

export interface AstFile {
    content: PackageExpression;
    path: string;
}


export interface Options {
    pretty: boolean;
    output?: string;
    generate?: string[];
    ast: boolean;
}