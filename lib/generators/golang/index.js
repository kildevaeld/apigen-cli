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
const apigen_compiler_1 = require("apigen-compiler");
const Path = require("path");
const template_1 = require("./template");
const fs = require("mz/fs");
const _ = require("lodash");
const TemplatePath = Path.join(__dirname, "../../../templates");
class GolangGenerator {
    collapse(asts) {
        let packages = {};
        for (let ast of asts) {
            if (packages[ast.content.name]) {
                let old = packages[ast.content.name];
                for (let end of ast.content.children) {
                    if (end instanceof apigen_compiler_1.EndpointExpression) {
                        if (old.endpoints.find(m => m.name === end.name)) {
                            throw new Error(`endpoint ${end.name} already defined`);
                        }
                    }
                    else if (end instanceof apigen_compiler_1.DefinitionExpression) {
                        if (old.definitions.find(m => m.name == end.name)) {
                            throw new Error(`definition ${end.name} already defined`);
                        }
                    }
                    packages[ast.content.name].children.push(end);
                }
            }
            else {
                packages[ast.content.name] = ast.content;
            }
        }
        return packages;
    }
    constructor() {
        this.initHandlebars();
    }
    generate(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = yield fs.readFile(Path.join(TemplatePath, "golang.hbs")), tpl = this.hbs.compile(buffer.toString());
            let packages = this.collapse(e);
            return Object.keys(packages).map(m => {
                return {
                    path: m.toLowerCase() + '.go',
                    content: new Buffer(tpl(packages[m]), 'utf8')
                };
            });
            /*return [{
                path: "rapraprap" + '.go',
                content: new Buffer(tpl(e), 'utf8')
            }]*/
        });
    }
    typeToString(o, end) {
        const camel = (str) => _.upperFirst(_.camelCase(str));
        switch (o.type) {
            case apigen_compiler_1.Type.Array:
                return '[]' + this.typeToString(o.value, end);
            case apigen_compiler_1.Type.Primitive: {
                switch (o.value) {
                    case apigen_compiler_1.Primitive.Binary: return '[]byte';
                    case apigen_compiler_1.Primitive.Boolean: return 'bool';
                    case apigen_compiler_1.Primitive.Number: return 'int';
                    case apigen_compiler_1.Primitive.String: return 'string';
                }
                break;
            }
            case apigen_compiler_1.Type.Object: {
                let e = o;
                if (e.imported) {
                    var i;
                    if (~(i = e.imported.indexOf('.'))) {
                        return e.imported.substr(i + 1);
                    }
                    return e.imported;
                }
                //console.warn(e)
                break;
            }
            case apigen_compiler_1.Type.Definition: return camel(o.name);
            case apigen_compiler_1.Type.StringEnum: return "string";
            case apigen_compiler_1.Type.Property: {
                let e = o;
                if (!end)
                    return '';
                if (e.value.type !== apigen_compiler_1.Type.Object)
                    return this.typeToString(e.value);
                else if (e.value instanceof apigen_compiler_1.ObjectExpression) {
                    if (e.value.imported)
                        return e.value.imported.substr(e.value.imported.indexOf('.') + 1);
                }
                switch (e.name) {
                    case "query":
                        return _.upperFirst(_.camelCase(end.name)) + 'Options';
                    case "body":
                        return _.upperFirst(_.camelCase(end.name)) + 'Request';
                    case "return":
                        return _.upperFirst(_.camelCase(end.name)) + "Result";
                }
            }
        }
        //console.warn(o)
        return "";
    }
    initHandlebars() {
        this.hbs = template_1.temp.handlebars({
            typeToString: this.typeToString.bind(this)
        });
        this.hbs.registerHelper('buildPath', (context, optios) => {
            let e = template_1.temp.check(context, apigen_compiler_1.Type.Endpoint);
            let p = e.path;
            let l = e.path.length;
            e.path.forEach((path, i) => {
                if (path[0] == ":")
                    p[i] = path.substr(1);
                else
                    p[i] = '"' + path + (i == l - 1 ? "" : "") + '"';
            });
            return p.join('+"/"+');
        });
        this.hbs.registerHelper('parameters', (context, optios) => {
            let e = template_1.temp.check(context, apigen_compiler_1.Type.Endpoint);
            let p = [];
            let q = template_1.temp.findProperty(e, "query");
            let b = template_1.temp.findProperty(e, "body");
            e.path.forEach(path => {
                if (path[0] == ":")
                    p.push(path.substr(1) + ' string');
            });
            if (q)
                p.push("query " + this.typeToString(q, e));
            if (b)
                p.push('body ' + this.typeToString(b, e));
            return p.join(', ');
        });
        this.hbs.registerHelper("authheader", (context) => {
            let e = template_1.temp.check(context, apigen_compiler_1.Type.Endpoint);
            let auth = e.findProperty("auth");
            switch (auth.value.type) {
                case apigen_compiler_1.Type.TokenAuthentication: {
                    let ee = auth.value;
                    return `"${ee.header[0]}", "${ee.header.length ? ee.header[1] + ' ' : ''}"`;
                }
            }
            return "";
        });
    }
}
exports.GolangGenerator = GolangGenerator;
