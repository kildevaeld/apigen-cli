import {
    DefinitionExpression,
    EndpointExpression,
    Expression,
    GlobalImportExpression,
    NamedImportExpression,
    ObjectExpression,
    PackageExpression,
    Primitive,
    PrimitiveExpression,
    PropertyExpression,
    StringEnumExpression,
    StringExpression,
    Type,
    TypeExpression,
    UrlExpression,
    UserDefinedExpression,
    ArrayExpression
} from 'apigen-compiler';
import * as hbs from 'handlebars';
import * as _ from 'lodash';
const helpers = require('handlebars-helpers');
export type Constructor<T> = new (...args: any[]) => T;


export interface TemplateRenderer {
    compile(str: string): any
}


export interface HandleBarsOptions {
    typeToString?: (e: Expression, endpoint?:EndpointExpression) => string;
}

export namespace temp {

    function register(hbs: any, o: HandleBarsOptions) {

        hbs.registerHelper("mimetype", (context: any) => {

            let e = check<EndpointExpression>(context, Type.Endpoint);
            try {
                let found = e.findPropertyValue("mime", StringExpression);
                if (found) found.value;
            } catch (e) {
                console.error(e)
            }


            let body = e.findProperty('body');
            if (!body) return ""
            return mimeFromBody(body.value)
        });

        hbs.registerHelper("hasQuery", (ctx: any, options: any) => {
            const e = check<EndpointExpression>(ctx, Type.Endpoint);
            if (e.findProperty("query")) return options.fn(ctx)
            return null;
        })

        hbs.registerHelper("hasAuth", (ctx: any, options: any) => {
            const e = check<PackageExpression>(ctx, Type.Package);
            if (e.auth) return options.fn(ctx);
            //if (e.findProperty("query")) return options.fn(ctx)
            return null;
        })

        hbs.registerHelper("hasReturn", (ctx: any, options: any) => {
            const e = check<EndpointExpression>(ctx, Type.Endpoint);
            if (e.findProperty("return")) return options.fn(ctx)
            return null;
        });

        hbs.registerHelper("hasBody", (ctx: any, options: any) => {
            const e = check<EndpointExpression>(ctx, Type.Endpoint);
            if (e.findProperty("body")) return options.fn(ctx)
            return null;
        });

        hbs.registerHelper("url", (context: any, options: any) => {
            let e = check<PackageExpression>(context, Type.Package);
            const url = e.children.find((m: any) => m.type == Type.Url) as UrlExpression
            return url ? `${url.protocol}://${url.domain}`: "\"\""; 
        });


        hbs.registerHelper("typestring", (context: any) => {
            try {
                let e = check<ArrayExpression>(context, Type.Array)
                return o.typeToString!(e);
            } catch (e) {
                //console.log(e)
            }


            if (o.typeToString) return o.typeToString(context);
            return "<undefined>";
        });


        hbs.registerHelper("property", function (this: any, end: any, prop: any, options: any) {
            const e = check<EndpointExpression>(end, Type.Endpoint);
            return o.typeToString!(e.findProperty<PropertyExpression>(prop), e);
        })

        hbs.registerHelper("eachEndpoint", (context: any, options: any) => {
            var ret = ""
            for (var i = 0, j = context.length; i < j; i++) {
                if (context[i].type !== Type.Endpoint) continue;
                ret = ret + options.fn(context[i]);
            }
            return ret;
        });

        hbs.registerHelper('eachObject', (ctx: any, opts: any) => {
            let e: ObjectExpression;
            try {
                e = temp.check(ctx, Type.Object);
            } catch (e) {
                console.error(e.message);
                return "";
            }

            return e.value.map((m, i) => {
                let ee = temp.check<PropertyExpression>(m, Type.Property);
                return opts.fn({
                    name: ee.name,
                    type: o.typeToString ? o.typeToString(ee.value) : "nothing",
                    lastIndex: i + 1 === e.value.length,
                    optional: ee.optional,
                    imported: (ee.value as TypeExpression).imported
                });
            }).filter(m => m != null).join('')
        });

        hbs.registerHelper('eachDefinition', (context: any, options: any) => {

            var ret = ""
            for (var i = 0, j = context.length; i < j; i++) {
                if (context[i].type !== Type.Definition) continue;
                let o = context[i];
                if (o.value.type == Type.SimpleAuthentication || o.value.type == Type.TokenAuthentication) continue;
                ret = ret + options.fn({
                    name: o.name,
                    isObject: o.value.type == Type.Object,
                    value: o.value
                });

            }
            return ret;

        });

        hbs.registerHelper('equal', function (this: any, lvalue: any, rvalue: any, options: any) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        });

        hbs.registerHelper('json', (ctx: any) => {
            return JSON.stringify(ctx);
        })

        hbs.registerHelper('camelcase', (ctx: any) => {
            return _.upperFirst(_.camelCase(ctx));
        })

    }

    export function check<T extends Expression>(e: any, t: Type) {
        if (e.type !== t) throw new Error(`invalid type: ${e.constructor.name} should be: ${t}`);
        return e as T
    }

    export function findProperty(e: EndpointExpression, name: string, t?: Constructor<PropertyExpression>): PropertyExpression
    export function findProperty<T extends Expression>(e: EndpointExpression, name: string, t?: Constructor<T>): T {
        if (e.type != Type.Endpoint) throw new Error('not a endpoint');
        const found = e.children.find(m => m.type == Type.Property && (m as any).name === name) as PropertyExpression
        if (!t) return (<any>found) as T;

        if (!(found.value instanceof t)) throw new Error("invalid property type");
        return found.value;

    }


    export function mimeFromBody(b: Expression) {
        switch (b.type) {
            case Type.Primitive:
                const e = check<PrimitiveExpression>(b, Type.Primitive);
                switch (e.value) {
                    case Primitive.String, Primitive.Boolean: return "plain/text";
                    case Primitive.Binary: return "application/octet-stream"
                }
            case Type.Object:
                return "application/json"
        }
        return "application/octet-stream"
    }




    export function handlebars(o: HandleBarsOptions = {}): any {
        const h = hbs.create();
        helpers({
            handlebars: h,
        });



        register(h, o);


        return h;
    }

}
