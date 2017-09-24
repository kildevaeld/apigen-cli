import {
    IGenerator, AstFile, Result, PackageExpression, EndpointExpression,
    DefinitionExpression, Expression, ArrayExpression, PrimitiveExpression,
    Primitive, Type, PropertyExpression, ObjectExpression
} from 'apigen-compiler'
import * as Path from 'path';
import { temp } from './template';
import * as fs from 'mz/fs';
import * as _ from 'lodash';

const TemplatePath = Path.join(__dirname, "../../../templates");


export class GolangGenerator implements IGenerator {


    collapse(asts: AstFile[]): { [key: string]: PackageExpression } {

        let packages: { [key: string]: PackageExpression } = {};

        for (let ast of asts) {
            if (packages[ast.content.name]) {
                let old = packages[ast.content.name];
                for (let end of ast.content.children) {
                    if (end instanceof EndpointExpression) {
                        if (old.endpoints.find(m => m.name === (end as EndpointExpression).name)) {
                            throw new Error(`endpoint ${end.name} already defined`)
                        }
                    } else if (end instanceof DefinitionExpression) {
                        if (old.definitions.find(m => m.name == (end as DefinitionExpression).name)) {
                            throw new Error(`definition ${end.name} already defined`);
                        }
                    }
                    packages[ast.content.name].children.push(end);
                }

            } else {
                packages[ast.content.name] = ast.content;
            }
        }



        return packages;
    }


    hbs: any;

    constructor() {
        this.initHandlebars();
    }

    async generate(e: AstFile[]): Promise<Result[]> {

        const buffer = await fs.readFile(Path.join(TemplatePath, "golang.hbs")),
            tpl = this.hbs.compile(buffer.toString());

        
        let packages = this.collapse(e);

        
        return Object.keys(packages).map( m => {
            return {
                path: m.toLowerCase() + '.go',
                content: new Buffer(tpl(packages[m]), 'utf8')
            }
        })

        /*return [{
            path: "rapraprap" + '.go',
            content: new Buffer(tpl(e), 'utf8')
        }]*/
    }

    private typeToString(o: Expression, end?: EndpointExpression): string {
        
        const camel = (str: string) => _.upperFirst(_.camelCase(str)) 
     
        switch (o.type) {
            case Type.Array:
                return '[]' + this.typeToString((o as ArrayExpression).value, end);
            case Type.Primitive: {
                switch ((o as PrimitiveExpression).value) {
                    case Primitive.Binary: return '[]byte';
                    case Primitive.Boolean: return 'bool';
                    case Primitive.Number: return 'int';
                    case Primitive.String: return 'string';
                }
                break;
            }
            case Type.Object: {
                let e = (o as ObjectExpression)
                if (e.imported) {
                    var i: number
                    if (~(i = e.imported!.indexOf('.'))) {
                        return e.imported!.substr(i + 1);
                    }
                    return e.imported!
                }
                //console.warn(e)
                break;
            }

            case Type.Definition: return camel((o as DefinitionExpression).name);

            case Type.StringEnum: return "string"

            case Type.Property: {
                let e = (o as PropertyExpression);
                if (!end) return '';

                if (e.value.type !== Type.Object) return this.typeToString(e.value)
                else if (e.value instanceof ObjectExpression) {
                    if (e.value.imported) return camel(e.value.imported);
                } 
                switch (e.name) {
                    case "query":
                        return _.upperFirst(_.camelCase(end.name)) + 'Options'
                    case "body":
                        return _.upperFirst(_.camelCase(end.name)) + 'Request'
                    case "return": 
                        return _.upperFirst(_.camelCase(end.name)) + "Result"
                    
                }
            }

        }
        //console.warn(o)
        return ""
    }

    private initHandlebars() {

        this.hbs = temp.handlebars({
            typeToString: this.typeToString.bind(this)
        });

        this.hbs.registerHelper('buildPath', (context: any, optios: any) => {
            let e = temp.check<EndpointExpression>(context, Type.Endpoint);
            let p = e.path
            let l = e.path.length
            e.path.forEach((path, i) => {
                if (path[0] == ":")
                    p[i] = path.substr(1)
                else
                    p[i] = '"' + path + (i == l - 1 ? "" : "") + '"'
            });
            return p.join('+"/"+');
        });

        this.hbs.registerHelper('parameters', (context: any, optios: any) => {
            let e = temp.check<EndpointExpression>(context, Type.Endpoint);
            let p: string[] = [];
            let q = temp.findProperty(e, "query");
            let b = temp.findProperty(e, "body");
            e.path.forEach(path => {
                if (path[0] == ":")
                    p.push(path.substr(1) + ' string')
            })

            if (q) p.push("query " + this.typeToString(q, e))
            if (b) p.push('body ' + this.typeToString(b, e));

            return p.join(', ')
        })


    }

}